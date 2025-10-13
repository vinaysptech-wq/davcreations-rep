module.exports = (controller, logger) => {
  const express = require('express');
  const { authenticateToken } = require('../../../middleware/auth');

  const router = express.Router();

  // Middleware to log requests
  router.use((req, res, next) => {
    logger.debug(`Logging route: ${req.method} ${req.path}`);
    next();
  });

  router.post('/client-error', controller.logClientError);
  router.get('/level', authenticateToken, controller.getLogLevel);
  router.put('/level', authenticateToken, controller.setLogLevel);
  router.get('/logs', authenticateToken, controller.getLogs);

  // Settings routes
  router.get('/settings', authenticateToken, controller.getSettings);
  router.get('/settings/:key', authenticateToken, controller.getSetting);
  router.post('/settings', authenticateToken, controller.createSetting);
  router.put('/settings/:key', authenticateToken, controller.updateSetting);
  router.delete('/settings/:key', authenticateToken, controller.deleteSetting);

  // Audit routes
  router.get('/permissions/:rolePermissionsId', authenticateToken, controller.getAuditLogsForPermission);
  router.get('/users/:userId', authenticateToken, controller.getAuditLogsForUser);
  router.get('/date-range', authenticateToken, controller.getAuditLogsByDateRange);
  router.get('/summary', authenticateToken, controller.getAuditSummary);

  return router;
};