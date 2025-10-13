module.exports = (config, logger, _db) => {
  const models = {
    user: require('./models/users'),
    userAccess: require('./models/userAccess'),
    adminModule: require('./models/adminModule'),
    userType: require('./models/userType'),
    userPreferences: require('./models/userPreferences'),
    logs: require('../logging/services/loggingService'), // placeholder
    settings: {}, // placeholder
  };
  const loggingService = require('../logging/services/loggingService')(config, logger, models);
  const service = require('./services/userService')(config, logger, models);
  const controller = require('./controllers/users')(service, logger, loggingService);
  const router = require('./routes/users')(controller, logger);
  return router;
};