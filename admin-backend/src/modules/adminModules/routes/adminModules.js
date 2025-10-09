module.exports = (controller, logger) => {
  const express = require('express');
  const { authenticateToken } = require('../../../middleware/auth');

  const router = express.Router();

  // Middleware to log incoming requests
  router.use((req, res, next) => {
    logger.debug(`Incoming request: ${req.method} ${req.path}`);
    next();
  });

  // All routes are protected
  router.use(authenticateToken);

  router.get('/', (req, res, next) => { logger.info('Fetching all admin modules'); next(); }, controller.getAdminModules);
  router.get('/:id', (req, res, next) => { logger.info(`Fetching admin module with ID: ${req.params.id}`); next(); }, controller.getAdminModule);
  router.post('/', (req, res, next) => { logger.info('Creating new admin module'); next(); }, controller.createAdminModule);
  router.put('/:id', (req, res, next) => { logger.info(`Updating admin module with ID: ${req.params.id}`); next(); }, controller.updateAdminModule);
  router.delete('/:id', (req, res, next) => { logger.info(`Deleting admin module with ID: ${req.params.id}`); next(); }, controller.deleteAdminModule);

  return router;
};