module.exports = (config, logger, db) => {
  logger.debug('Loading auth feature dependencies');
  const userModel = require('./models/user');
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
  const service = require('./services/authService')(config, logger, userModel, userAccessModel, refreshTokenModel);
  const controller = require('./controllers/authController')(service, logger);
  const router = require('./routes/auth')(controller, logger);
  return router;
};