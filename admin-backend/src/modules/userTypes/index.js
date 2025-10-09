module.exports = (config, logger, db) => {
  const models = {
    userType: require('./models/userTypes'),
  };
  const service = require('./services/userTypeService')(config, logger, models);
  const controller = require('./controllers/userTypes')(service, logger);
  const router = require('./routes/userTypes')(controller, logger);
  return router;
};