module.exports = (config, logger, db) => {
  logger.debug('Loading auth feature dependencies');
  const userModelFactory = require('./models/user');
  const userModel = userModelFactory(db);
  logger.debug('userModel loaded successfully');
  let userAccessModel;
  try {
    userAccessModel = require('../users/models/userAccess');
    logger.debug('userAccessModel loaded successfully, type:', typeof userAccessModel);
  } catch (error) {
    logger.error('Failed to load userAccessModel:', error.message);
    userAccessModel = null;
  }
  const refreshTokenModel = require('../../models/RefreshToken');
  logger.debug('refreshTokenModel loaded successfully');

  // Initialize permission resolution service
  const PermissionResolutionService = require('../../services/permissionResolutionService');
  const permissionService = new PermissionResolutionService(db);
  logger.debug('PermissionResolutionService loaded successfully');

  const service = require('./services/authService')(config, logger, userModel, userAccessModel, refreshTokenModel, permissionService);
  const controller = require('./controllers/authController')(service, logger);
  const router = require('./routes/auth')(controller, logger);
  return router;
};