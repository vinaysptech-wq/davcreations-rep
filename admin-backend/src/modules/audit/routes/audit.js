module.exports = (controller, logger) => {
  const express = require('express');
  const { authenticateToken } = require('../../../middleware/auth');

  const router = express.Router();

  // Middleware to log requests
  router.use((req, res, next) => {
    logger.debug(`Audit route: ${req.method} ${req.path}`);
    next();
  });

  // All audit routes require authentication
  router.use(authenticateToken);

  router.get('/permissions/:rolePermissionsId', controller.getAuditLogsForPermission);
  router.get('/users/:userId', controller.getAuditLogsForUser);
  router.get('/date-range', controller.getAuditLogsByDateRange);
  router.get('/summary', controller.getAuditSummary);

  return router;
};