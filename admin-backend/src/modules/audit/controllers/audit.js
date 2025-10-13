module.exports = (service, logger) => ({
  getAuditLogsForPermission: async (req, res) => {
    try {
      const { rolePermissionsId } = req.params;
      const { limit } = req.query;
      const auditLogs = await service.getAuditLogsForPermission(rolePermissionsId, limit);
      res.json(auditLogs);
    } catch (error) {
      logger.error(`Failed to get audit logs for permission: ${error.message}`);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getAuditLogsForUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit } = req.query;
      const auditLogs = await service.getAuditLogsForUser(userId, limit);
      res.json(auditLogs);
    } catch (error) {
      logger.error(`Failed to get audit logs for user: ${error.message}`);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getAuditLogsByDateRange: async (req, res) => {
    try {
      const { startDate, endDate, limit } = req.query;
      const auditLogs = await service.getAuditLogsByDateRange(startDate, endDate, limit);
      res.json(auditLogs);
    } catch (error) {
      logger.error(`Failed to get audit logs by date range: ${error.message}`);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getAuditSummary: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const summary = await service.getAuditSummary(startDate, endDate);
      res.json(summary);
    } catch (error) {
      logger.error(`Failed to get audit summary: ${error.message}`);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
});