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

  // Permission management endpoints
  router.get('/:id/permissions', (req, res, next) => { logger.info(`Fetching permissions for role ID: ${req.params.id}`); next(); }, controller.getPermissionsForRole);
  router.post('/:id/permissions', (req, res, next) => { logger.info(`Assigning permission to role ID: ${req.params.id}`); next(); }, controller.assignPermissionToRole);
  router.put('/:id/permissions', (req, res, next) => { logger.info(`Updating permissions for role ID: ${req.params.id}`); next(); }, controller.updateRolePermissions);
  router.delete('/:id/permissions/:moduleId', (req, res, next) => { logger.info(`Removing permission from role ID: ${req.params.id} for module ID: ${req.params.moduleId}`); next(); }, controller.removePermissionFromRole);
  router.post('/:id/permissions/bulk', (req, res, next) => { logger.info(`Bulk assigning permissions to role ID: ${req.params.id}`); next(); }, controller.bulkAssignPermissions);
  router.put('/permissions/bulk', (req, res, next) => { logger.info('Bulk updating role permissions'); next(); }, controller.bulkUpdateRolePermissions);
  router.delete('/:id/permissions/bulk', (req, res, next) => { logger.info(`Bulk removing permissions from role ID: ${req.params.id}`); next(); }, controller.bulkRemovePermissions);

  // Audit log endpoints
  router.get('/permissions/:rolePermissionsId/audit', (req, res, next) => { logger.info(`Fetching audit logs for role permission ID: ${req.params.rolePermissionsId}`); next(); }, controller.getPermissionAuditLogs);

  return router;
};