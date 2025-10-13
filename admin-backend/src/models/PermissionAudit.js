const prisma = require('../lib/prisma');

const createAuditLog = async (auditData) => {
  try {
    const auditLog = await prisma.permissionAudit.create({
      data: {
        role_permissions_id: auditData.role_permissions_id,
        user_id: auditData.user_id,
        action: auditData.action,
        old_permissions: auditData.old_permissions || null,
        new_permissions: auditData.new_permissions || null,
        change_reason: auditData.change_reason || null,
        ip_address: auditData.ip_address || null,
        user_agent: auditData.user_agent || null,
      },
    });

    return auditLog;
  } catch (error) {
    throw new Error(`Failed to create audit log: ${error.message}`);
  }
};

const getAuditLogsForPermission = async (rolePermissionsId, limit = 50) => {
  try {
    const auditLogs = await prisma.permissionAudit.findMany({
      where: {
        role_permissions_id: parseInt(rolePermissionsId),
      },
      include: {
        user: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_date: 'desc',
      },
      take: limit,
    });

    return auditLogs;
  } catch (error) {
    throw new Error(`Failed to get audit logs: ${error.message}`);
  }
};

const getAuditLogsForUser = async (userId, limit = 100) => {
  try {
    const auditLogs = await prisma.permissionAudit.findMany({
      where: {
        user_id: parseInt(userId),
      },
      include: {
        role_permission: {
          include: {
            user_type: true,
            admin_module: true,
          },
        },
      },
      orderBy: {
        created_date: 'desc',
      },
      take: limit,
    });

    return auditLogs;
  } catch (error) {
    throw new Error(`Failed to get user audit logs: ${error.message}`);
  }
};

const getAuditLogsByDateRange = async (startDate, endDate, limit = 500) => {
  try {
    const auditLogs = await prisma.permissionAudit.findMany({
      where: {
        created_date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        user: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        role_permission: {
          include: {
            user_type: true,
            admin_module: true,
          },
        },
      },
      orderBy: {
        created_date: 'desc',
      },
      take: limit,
    });

    return auditLogs;
  } catch (error) {
    throw new Error(`Failed to get audit logs by date range: ${error.message}`);
  }
};

const getAuditSummary = async (startDate, endDate) => {
  try {
    const summary = await prisma.permissionAudit.groupBy({
      by: ['action'],
      where: {
        created_date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      _count: {
        audit_id: true,
      },
    });

    return summary;
  } catch (error) {
    throw new Error(`Failed to get audit summary: ${error.message}`);
  }
};

module.exports = {
  createAuditLog,
  getAuditLogsForPermission,
  getAuditLogsForUser,
  getAuditLogsByDateRange,
  getAuditSummary,
};