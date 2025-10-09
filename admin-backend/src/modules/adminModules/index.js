module.exports = (config, logger, db) => {
  const models = {
    adminModule: require('./models/adminModules'),
  };
  const service = require('./services/adminModuleService')(config, logger, models);
  const controller = require('./controllers/adminModules')(service, logger);
  const router = require('./routes/adminModules')(controller, logger);
  return router;
};