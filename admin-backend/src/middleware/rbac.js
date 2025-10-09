const logger = require('../utils/logger');

const checkModuleAccess = (requiredModuleId) => {
  return (req, res, next) => {
    logger.debug(`RBAC middleware: checking access to module ${requiredModuleId} for ${req.method} ${req.path}`);

    if (!req.user) {
      logger.warn(`RBAC AUDIT: No user in request for ${req.method} ${req.path} from IP: ${req.ip}`);
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.user.module_permissions || !Array.isArray(req.user.module_permissions)) {
      logger.warn(`RBAC AUDIT: No module permissions found for user ${req.user.user_id} on ${req.method} ${req.path} from IP: ${req.ip}`);
      return res.status(403).json({ message: 'Access denied - no permissions configured' });
    }

    // Superadmin has unrestricted access
    if (req.user.user_type_name === 'Superadmin') {
      logger.info(`RBAC AUDIT: Superadmin access granted for user ${req.user.user_id} to module ${requiredModuleId} on ${req.method} ${req.path} from IP: ${req.ip}`);
      return next();
    }

    if (!req.user.module_permissions.includes(parseInt(requiredModuleId))) {
      logger.warn(`RBAC AUDIT: Access denied for user ${req.user.user_id} (role: ${req.user.user_type_name}) to module ${requiredModuleId} on ${req.method} ${req.path} from IP: ${req.ip}`);
      return res.status(403).json({ message: 'Access denied - insufficient permissions' });
    }

    logger.info(`RBAC AUDIT: Access granted for user ${req.user.user_id} (role: ${req.user.user_type_name}) to module ${requiredModuleId} on ${req.method} ${req.path} from IP: ${req.ip}`);
    next();
  };
};

module.exports = { checkModuleAccess };