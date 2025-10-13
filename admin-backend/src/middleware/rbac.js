const { logger } = require('../utils');
const PermissionResolutionService = require('../services/permissionResolutionService');

const permissionService = new PermissionResolutionService(require('../lib/prisma'));

// Configurable superadmin roles - can be set via environment or config
const SUPERADMIN_ROLES = process.env.SUPERADMIN_ROLES ? process.env.SUPERADMIN_ROLES.split(',') : ['Superadmin'];

const checkModuleAccess = (requiredModuleId) => {
  return (req, res, next) => {
    logger.debug(`RBAC middleware: checking access to module ${requiredModuleId} for ${req.method} ${req.path}`);

    if (!req.user) {
      logger.warn(`RBAC AUDIT: No user in request for ${req.method} ${req.path} from IP: ${req.ip}`);
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Configurable superadmin check
    if (SUPERADMIN_ROLES.includes(req.user.user_type_name)) {
      logger.info(`RBAC AUDIT: Superadmin access granted for user ${req.user.user_id} to module ${requiredModuleId} on ${req.method} ${req.path} from IP: ${req.ip}`);
      return next();
    }

    if (!req.user.module_permissions || typeof req.user.module_permissions !== 'object') {
      logger.warn(`RBAC AUDIT: No module permissions found for user ${req.user.user_id} on ${req.method} ${req.path} from IP: ${req.ip}`);
      return res.status(403).json({ message: 'Access denied - no permissions configured' });
    }

    const modulePerms = req.user.module_permissions[parseInt(requiredModuleId)];
    if (!modulePerms || !modulePerms.view) {
      logger.warn(`RBAC AUDIT: Access denied for user ${req.user.user_id} (role: ${req.user.user_type_name}) to module ${requiredModuleId} on ${req.method} ${req.path} from IP: ${req.ip}`);
      return res.status(403).json({ message: 'Access denied - insufficient permissions' });
    }

    logger.info(`RBAC AUDIT: Access granted for user ${req.user.user_id} (role: ${req.user.user_type_name}) to module ${requiredModuleId} on ${req.method} ${req.path} from IP: ${req.ip}`);
    next();
  };
};

const checkPermission = (requiredModuleId, requiredAction) => {
  return async (req, res, next) => {
    logger.debug(`RBAC middleware: checking ${requiredAction} permission for module ${requiredModuleId} on ${req.method} ${req.path}`);

    if (!req.user) {
      logger.warn(`RBAC AUDIT: No user in request for ${req.method} ${req.path} from IP: ${req.ip}`);
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Configurable superadmin check
    if (SUPERADMIN_ROLES.includes(req.user.user_type_name)) {
      logger.info(`RBAC AUDIT: Superadmin ${requiredAction} permission granted for user ${req.user.user_id} to module ${requiredModuleId} on ${req.method} ${req.path} from IP: ${req.ip}`);
      return next();
    }

    try {
      const hasPermission = await permissionService.hasPermission(
        req.user.user_id,
        req.user.user_typeid,
        requiredModuleId,
        requiredAction
      );

      if (!hasPermission) {
        logger.warn(`RBAC AUDIT: ${requiredAction} permission denied for user ${req.user.user_id} (role: ${req.user.user_type_name}) to module ${requiredModuleId} on ${req.method} ${req.path} from IP: ${req.ip}`);
        return res.status(403).json({ message: `Access denied - ${requiredAction} permission required` });
      }

      logger.info(`RBAC AUDIT: ${requiredAction} permission granted for user ${req.user.user_id} (role: ${req.user.user_type_name}) to module ${requiredModuleId} on ${req.method} ${req.path} from IP: ${req.ip}`);
      next();
    } catch (error) {
      logger.error('Error checking permissions:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
};

module.exports = { checkModuleAccess, checkPermission, SUPERADMIN_ROLES };