const permissionAuditModel = require('../../../models/PermissionAudit');

module.exports = (config, logger) => ({
  getAuditLogsForPermission: async (rolePermissionsId, limit = 50) => {
    try {
      const auditLogs = await permissionAuditModel.getAuditLogsForPermission(rolePermissionsId, limit);
      return auditLogs;
    } catch (error) {
      logger.error('Error in auditService.getAuditLogsForPermission', {
        error: error.message,
        stack: error.stack,
        rolePermissionsId,
        limit
      });
      throw error;
    }
  },

  getAuditLogsForUser: async (userId, limit = 100) => {
    try {
      const auditLogs = await permissionAuditModel.getAuditLogsForUser(userId, limit);
      return auditLogs;
    } catch (error) {
      logger.error('Error in auditService.getAuditLogsForUser', {
        error: error.message,
        stack: error.stack,
        userId,
        limit
      });
      throw error;
    }
  },

  getAuditLogsByDateRange: async (startDate, endDate, limit = 500) => {
    try {
      const auditLogs = await permissionAuditModel.getAuditLogsByDateRange(startDate, endDate, limit);
      return auditLogs;
    } catch (error) {
      logger.error('Error in auditService.getAuditLogsByDateRange', {
        error: error.message,
        stack: error.stack,
        startDate,
        endDate,
        limit
      });
      throw error;
    }
  },

  getAuditSummary: async (startDate, endDate) => {
    try {
      const summary = await permissionAuditModel.getAuditSummary(startDate, endDate);
      return summary;
    } catch (error) {
      logger.error('Error in auditService.getAuditSummary', {
        error: error.message,
        stack: error.stack,
        startDate,
        endDate
      });
      throw error;
    }
  },
});