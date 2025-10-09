module.exports = (config, logger, db) => {
  const ActivityLogs = require('../../models/UserRole/ActivityLogs');
  const models = {
    logs: ActivityLogs(db),
    settings: {}, // placeholder
  };
  const service = require('./services/loggingService')(config, logger, models);
  const controller = require('./controllers/logging')(service, logger);
  const router = require('./routes/logging')(controller, logger);
  return router;
};