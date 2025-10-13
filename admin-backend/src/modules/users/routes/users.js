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

  router.get('/', (req, res, next) => { logger.info('Fetching all users'); next(); }, controller.getUsers);
  router.get('/user-types', (req, res, next) => { logger.info('Fetching user types'); next(); }, controller.getUserTypes);
  router.get('/modules', (req, res, next) => { logger.info('Route /modules matched, calling getModules'); next(); }, controller.getModules);
  router.get('/:id/modules', (req, res, next) => { logger.info(`Fetching modules for user ID: ${req.params.id}`); next(); }, controller.getUserModules);
  router.get('/:id', (req, res, next) => { logger.info(`Fetching user with ID: ${req.params.id}`); next(); }, controller.getUser);
  router.post('/', (req, res, next) => { logger.info('Creating new user'); next(); }, controller.createUser);
  router.put('/:id', (req, res, next) => { logger.info(`Updating user with ID: ${req.params.id}`); next(); }, controller.updateUser);
  router.delete('/:id', (req, res, next) => { logger.info(`Deleting user with ID: ${req.params.id}`); next(); }, controller.deleteUser);
  router.put('/:id/modules', (req, res, next) => { logger.info(`Updating modules for user ID: ${req.params.id}`); next(); }, controller.updateUserModules);

  // Profile management routes
  router.get('/profile', (req, res, next) => { logger.info('Fetching current user profile'); next(); }, controller.getProfile);
  router.put('/profile', (req, res, next) => { logger.info('Updating current user profile'); next(); }, controller.updateProfile);
  router.put('/profile/password', (req, res, next) => { logger.info('Updating current user password'); next(); }, controller.updatePassword);
  router.post('/profile/image', (req, res, next) => { logger.info('Uploading profile image'); next(); }, controller.uploadImage);

  // Preferences routes
  router.get('/preferences', (req, res, next) => { logger.info('Fetching user preferences'); next(); }, controller.getUserPreferences);
  router.put('/preferences', (req, res, next) => { logger.info('Updating user preferences'); next(); }, controller.updateUserPreferences);

  // Bulk operations routes
  router.post('/:id/permissions/bulk', (req, res, next) => { logger.info(`Bulk assigning permissions to user ${req.params.id}`); next(); }, controller.bulkAssignPermissions);
  router.delete('/:id/permissions/bulk', (req, res, next) => { logger.info(`Bulk removing permissions from user ${req.params.id}`); next(); }, controller.bulkRemovePermissions);

  return router;
};