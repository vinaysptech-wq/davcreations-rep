module.exports = (config, logger, db) => {
  const model = require('./models/support');
  const service = require('./services/supportService')(config, logger, model);
  const controller = require('./controllers/support')(service, logger);
  const router = require('./routes/support')(controller, logger);
  return router;
};