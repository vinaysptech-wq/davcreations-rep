module.exports = (config, logger, _db) => {
  const models = {
    userType: require('./models/userTypes'),
    rolePermissions: require('../../models/UserRole/RolePermissions'),
    adminModules: require('../adminModules/models/adminModules'),
  };
  const service = require('./services/userTypeService')(config, logger, models);
  const rolePermissionsService = require('./services/rolePermissionsService')(config, logger, models);
  const controller = require('./controllers/userTypes')(service, rolePermissionsService, logger);
  const router = require('./routes/userTypes')(controller, logger);
  return router;
};