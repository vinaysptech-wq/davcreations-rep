module.exports = (controller, logger) => {
  const express = require('express');
  const { authenticateToken } = require('../../../middleware/auth');

  const router = express.Router();

  // Middleware to log incoming requests
  router.use((req, res, next) => {
    console.log(`Auth router incoming: ${req.method} ${req.path}`);
    logger.debug(`Incoming request: ${req.method} ${req.path}`);
    next();
  });

  router.post('/login', (req, res, next) => {
    console.log('Login route called');
    logger.info('Processing login request');
    next();
  }, controller.login);

  router.post('/register', (req, res, next) => {
    logger.info('Processing registration request');
    next();
  }, controller.register);

  router.post('/refresh', (req, res, next) => {
    logger.info('Processing token refresh request');
    next();
  }, controller.refresh);

  // Routes
  router.post('/logout', (req, res, next) => {
    console.log('Logout route called');
    logger.info('Processing logout request');
    next();
  }, controller.logout);

  router.get('/permissions', authenticateToken, controller.getEffectivePermissions);
  router.get('/permissions/details', authenticateToken, controller.getPermissionDetails);

  return router;
};