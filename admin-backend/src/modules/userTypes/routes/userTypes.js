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

  router.get('/', (req, res, next) => { logger.info('Fetching all user types'); next(); }, controller.getUserTypes);
  router.get('/:id', (req, res, next) => { logger.info(`Fetching user type with ID: ${req.params.id}`); next(); }, controller.getUserType);
  router.post('/', (req, res, next) => { logger.info('Creating new user type'); next(); }, controller.createUserType);
  router.put('/:id', (req, res, next) => { logger.info(`Updating user type with ID: ${req.params.id}`); next(); }, controller.updateUserType);
  router.delete('/:id', (req, res, next) => { logger.info(`Deleting user type with ID: ${req.params.id}`); next(); }, controller.deleteUserType);

  return router;
};