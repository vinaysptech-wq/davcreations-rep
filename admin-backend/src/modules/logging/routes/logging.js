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

  return router;
};