const prisma = require('../../lib/prisma');

const create = async (rolePermissionData) => {
  try {
    // Default permissions if not provided
    const defaultPermissions = {
      view: true,
      create: false,
      edit: false,
      delete: false,
    };

    const rolePermission = await prisma.rolePermissions.create({
      data: {
        user_type_id: rolePermissionData.user_type_id,
        admin_module_id: rolePermissionData.admin_module_id,
        permissions: rolePermissionData.permissions || defaultPermissions,
      },
    });

    return rolePermission;
  } catch (error) {
    throw new Error(`Failed to create role permission: ${error.message}`);
  }
};

const getAll = async () => {
  try {
    const rolePermissions = await prisma.rolePermissions.findMany({
      where: {
        is_active: true,
      },
      include: {
        user_type: true,
        admin_module: true,
      },
      orderBy: {
        created_date: 'desc',
      },
    });

    return rolePermissions;
  } catch (error) {
    throw new Error(`Failed to get role permissions: ${error.message}`);
  }
};

const getById = async (id) => {
  try {
    const rolePermission = await prisma.rolePermissions.findUnique({
      where: {
        role_permissions_id: parseInt(id),
        is_active: true,
      },
      include: {
        user_type: true,
        admin_module: true,
      },
    });

    return rolePermission;
  } catch (error) {
    throw new Error(`Failed to get role permission: ${error.message}`);
  }
};

const update = async (id, rolePermissionData) => {
  try {
    const updateData = {
      last_updated_date: new Date(),
    };

    // Only update fields that are provided
    if (rolePermissionData.user_type_id !== undefined) {
      updateData.user_type_id = rolePermissionData.user_type_id;
    }
    if (rolePermissionData.admin_module_id !== undefined) {
      updateData.admin_module_id = rolePermissionData.admin_module_id;
    }
    if (rolePermissionData.permissions !== undefined) {
      updateData.permissions = rolePermissionData.permissions;
    }

    const rolePermission = await prisma.rolePermissions.update({
      where: {
        role_permissions_id: parseInt(id),
        is_active: true,
      },
      data: updateData,
    });

    return rolePermission;
  } catch (error) {
    throw new Error(`Failed to update role permission: ${error.message}`);
  }
};

const deleteRolePermission = async (id) => {
  try {
    const rolePermission = await prisma.rolePermissions.update({
      where: {
        role_permissions_id: parseInt(id),
        is_active: true,
      },
      data: {
        is_active: false,
        last_updated_date: new Date(),
      },
    });

    return rolePermission;
  } catch (error) {
    throw new Error(`Failed to delete role permission: ${error.message}`);
  }
};

const updatePermissions = async (id, permissions, userId, changeReason, req) => {
  try {
    // Get current permission for audit
    const currentPermission = await prisma.rolePermissions.findUnique({
      where: { role_permissions_id: parseInt(id) },
    });

    if (!currentPermission) {
      throw new Error('Role permission not found');
    }

    // Update permissions
    const updatedPermission = await prisma.rolePermissions.update({
      where: { role_permissions_id: parseInt(id) },
      data: {
        permissions: permissions,
        last_updated_date: new Date(),
      },
    });

    // Create audit log
    await prisma.permissionAudit.create({
      data: {
        role_permissions_id: parseInt(id),
        user_id: userId,
        action: 'update',
        old_permissions: currentPermission.permissions,
        new_permissions: permissions,
        change_reason: changeReason,
        ip_address: req?.ip,
        user_agent: req?.get('User-Agent'),
      },
    });

    return updatedPermission;
  } catch (error) {
    throw new Error(`Failed to update permissions: ${error.message}`);
  }
};

const getPermissionsByRoleAndModule = async (userTypeId, adminModuleId) => {
  try {
    const rolePermission = await prisma.rolePermissions.findFirst({
      where: {
        user_type_id: parseInt(userTypeId),
        admin_module_id: parseInt(adminModuleId),
        is_active: true,
      },
    });

    return rolePermission;
  } catch (error) {
    throw new Error(`Failed to get permissions by role and module: ${error.message}`);
  }
};

const bulkUpdatePermissions = async (updates, userId, changeReason, req) => {
  try {
    const results = [];

    for (const update of updates) {
      try {
        const result = await updatePermissions(
          update.role_permissions_id,
          update.permissions,
          userId,
          changeReason,
          req
        );
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ success: false, error: error.message, id: update.role_permissions_id });
      }
    }

    return results;
  } catch (error) {
    throw new Error(`Failed to bulk update permissions: ${error.message}`);
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  delete: deleteRolePermission,
  updatePermissions,
  getPermissionsByRoleAndModule,
  bulkUpdatePermissions,
};