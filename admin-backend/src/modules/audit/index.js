const controller = require('./controllers/audit');
const service = require('./services/auditService');
const routes = require('./routes/audit');

module.exports = (config, logger, _db) => {
  const auditService = service(config, logger);
  const auditController = controller(auditService, logger);
  const auditRoutes = routes(auditController, logger);

  return auditRoutes;
};