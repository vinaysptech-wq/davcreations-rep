const prisma = require('../../../../src/lib/prisma');

module.exports = (config, logger, models) => ({
  getPermissionsByRoleId: async (roleId) => {
    try {
      logger.debug(`getPermissionsByRoleId called with roleId: ${roleId}`);
      // Validate role exists
      const role = await models.userType.getById(roleId);
      if (!role) {
        throw new Error('Role not found');
      }

      const permissions = await prisma.rolePermissions.findMany({
        where: {
          user_type_id: parseInt(roleId),
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

      logger.info(`getPermissionsByRoleId completed successfully for roleId: ${roleId}`);
      return permissions;
    } catch (error) {
      logger.error('Error in rolePermissionsService.getPermissionsByRoleId', {
        error: error.message,
        stack: error.stack,
        roleId
      });
      throw error;
    }
  },

  assignPermissionToRole: async (roleId, moduleId, permissions = null, userId = null, changeReason = null, req = null) => {
    try {
      logger.debug(`assignPermissionToRole called with roleId: ${roleId}, moduleId: ${moduleId}, permissions: ${JSON.stringify(permissions)}`);
      // Validate role exists
      const role = await models.userType.getById(roleId);
      if (!role) {
        throw new Error('Role not found');
      }

      // Validate module exists
      const module = await models.adminModules.getById(moduleId);
      if (!module) {
        throw new Error('Admin module not found');
      }

      // Default permissions if not provided
      const defaultPermissions = {
        view: true,
        create: false,
        edit: false,
        delete: false,
      };

      const finalPermissions = permissions || defaultPermissions;

      // Check if permission already exists
      const existingPermission = await prisma.rolePermissions.findFirst({
        where: {
          user_type_id: parseInt(roleId),
          admin_module_id: parseInt(moduleId),
          is_active: true,
        },
      });

      if (existingPermission) {
        // Update existing permission with new granular permissions
        const result = await models.rolePermissions.updatePermissions(
          existingPermission.role_permissions_id,
          finalPermissions,
          userId,
          changeReason,
          req
        );
        logger.info(`Permission updated successfully for roleId: ${roleId}, moduleId: ${moduleId}`);
        return result;
      }

      // Create new permission
      const result = await models.rolePermissions.create({
        user_type_id: parseInt(roleId),
        admin_module_id: parseInt(moduleId),
        permissions: finalPermissions,
      });

      // Create audit log for new permission
      if (userId) {
        await prisma.permissionAudit.create({
          data: {
            role_permissions_id: result.role_permissions_id,
            user_id: userId,
            action: 'create',
            new_permissions: finalPermissions,
            change_reason: changeReason,
            ip_address: req?.ip,
            user_agent: req?.get('User-Agent'),
          },
        });
      }

      logger.info(`Permission assigned successfully for roleId: ${roleId}, moduleId: ${moduleId}`);
      return result;
    } catch (error) {
      logger.error('Error in rolePermissionsService.assignPermissionToRole', {
        error: error.message,
        stack: error.stack,
        roleId,
        moduleId
      });
      throw error;
    }
  },

  removePermissionFromRole: async (roleId, moduleId) => {
    try {
      logger.debug(`removePermissionFromRole called with roleId: ${roleId}, moduleId: ${moduleId}`);
      // Find the permission
      const permission = await prisma.rolePermissions.findFirst({
        where: {
          user_type_id: parseInt(roleId),
          admin_module_id: parseInt(moduleId),
          is_active: true,
        },
      });

      if (!permission) {
        throw new Error('Permission not found for this role and module');
      }

      // Soft delete
      const result = await prisma.rolePermissions.update({
        where: {
          role_permissions_id: permission.role_permissions_id,
        },
        data: {
          is_active: false,
          last_updated_date: new Date(),
        },
      });

      logger.info(`Permission removed successfully for roleId: ${roleId}, moduleId: ${moduleId}`);
      return result;
    } catch (error) {
      logger.error('Error in rolePermissionsService.removePermissionFromRole', {
        error: error.message,
        stack: error.stack,
        roleId,
        moduleId
      });
      throw error;
    }
  },

  bulkAssignPermissions: async (roleId, moduleIds) => {
    try {
      logger.debug(`bulkAssignPermissions called with roleId: ${roleId}, moduleIds: ${JSON.stringify(moduleIds)}`);
      // Validate role exists
      const role = await models.userType.getById(roleId);
      if (!role) {
        throw new Error('Role not found');
      }

      const results = [];
      for (const moduleId of moduleIds) {
        try {
          const result = await this.assignPermissionToRole(roleId, moduleId);
          results.push({ moduleId, success: true, data: result });
        } catch (error) {
          results.push({ moduleId, success: false, error: error.message });
        }
      }

      logger.info(`bulkAssignPermissions completed for roleId: ${roleId}`);
      return results;
    } catch (error) {
      logger.error('Error in rolePermissionsService.bulkAssignPermissions', {
        error: error.message,
        stack: error.stack,
        roleId,
        moduleIds
      });
      throw error;
    }
  },

  bulkRemovePermissions: async (roleId, moduleIds) => {
    try {
      logger.debug(`bulkRemovePermissions called with roleId: ${roleId}, moduleIds: ${JSON.stringify(moduleIds)}`);
      const results = [];
      for (const moduleId of moduleIds) {
        try {
          const result = await this.removePermissionFromRole(roleId, moduleId);
          results.push({ moduleId, success: true, data: result });
        } catch (error) {
          results.push({ moduleId, success: false, error: error.message });
        }
      }

      logger.info(`bulkRemovePermissions completed for roleId: ${roleId}`);
      return results;
    } catch (error) {
      logger.error('Error in rolePermissionsService.bulkRemovePermissions', {
        error: error.message,
        stack: error.stack,
        roleId,
        moduleIds
      });
      throw error;
    }
  },

  getAllPermissionsWithDetails: async () => {
    try {
      logger.debug('getAllPermissionsWithDetails called');
      const permissions = await models.rolePermissions.getAll();
      logger.info('getAllPermissionsWithDetails completed successfully');
      return permissions;
    } catch (error) {
      logger.error('Error in rolePermissionsService.getAllPermissionsWithDetails', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  updateRolePermissions: async (roleId, moduleId, permissions, userId, changeReason, req) => {
    try {
      logger.debug(`updateRolePermissions called with roleId: ${roleId}, moduleId: ${moduleId}, permissions: ${JSON.stringify(permissions)}`);

      const permission = await models.rolePermissions.getPermissionsByRoleAndModule(roleId, moduleId);
      if (!permission) {
        throw new Error('Permission not found for this role and module');
      }

      const result = await models.rolePermissions.updatePermissions(
        permission.role_permissions_id,
        permissions,
        userId,
        changeReason,
        req
      );

      logger.info(`Role permissions updated successfully for roleId: ${roleId}, moduleId: ${moduleId}`);
      return result;
    } catch (error) {
      logger.error('Error in rolePermissionsService.updateRolePermissions', {
        error: error.message,
        stack: error.stack,
        roleId,
        moduleId
      });
      throw error;
    }
  },

  bulkUpdateRolePermissions: async (updates, userId, changeReason, req) => {
    try {
      logger.debug(`bulkUpdateRolePermissions called with ${updates.length} updates`);

      const results = [];
      for (const update of updates) {
        try {
          const result = await this.updateRolePermissions(
            update.roleId,
            update.moduleId,
            update.permissions,
            userId,
            changeReason,
            req
          );
          results.push({ success: true, data: result, roleId: update.roleId, moduleId: update.moduleId });
        } catch (error) {
          results.push({ success: false, error: error.message, roleId: update.roleId, moduleId: update.moduleId });
        }
      }

      logger.info(`bulkUpdateRolePermissions completed with ${results.filter(r => r.success).length} successes`);
      return results;
    } catch (error) {
      logger.error('Error in rolePermissionsService.bulkUpdateRolePermissions', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  getPermissionAuditLogs: async (rolePermissionsId, limit = 50) => {
    try {
      logger.debug(`getPermissionAuditLogs called with rolePermissionsId: ${rolePermissionsId}`);
      const auditLogs = await models.permissionAudit.getAuditLogsForPermission(rolePermissionsId, limit);
      logger.info(`getPermissionAuditLogs completed successfully for rolePermissionsId: ${rolePermissionsId}`);
      return auditLogs;
    } catch (error) {
      logger.error('Error in rolePermissionsService.getPermissionAuditLogs', {
        error: error.message,
        stack: error.stack,
        rolePermissionsId
      });
      throw error;
    }
  },
});