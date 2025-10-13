const jwt = require('jsonwebtoken');
const { logger } = require('../utils');

const authenticateToken = (req, res, next) => {
  logger.debug(`Auth middleware: checking token for ${req.method} ${req.path}`);

  // Check for token in cookies first
  let token = req.cookies.authToken;
  let tokenSource = 'cookie';

  // If not in cookies, check Authorization header
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    tokenSource = 'header';
  }

  if (!token) {
    logger.warn(`SECURITY AUDIT: Auth failed - no token provided for ${req.method} ${req.path} from IP: ${req.ip}`);
    return res.status(401).json({ message: 'Access token required' });
  }

  logger.debug(`Auth middleware: Token found from ${tokenSource}, length: ${token.length}`);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn(`SECURITY AUDIT: Auth failed - invalid token for ${req.method} ${req.path} from IP: ${req.ip}, error: ${err.message}, token source: ${tokenSource}`);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    logger.info(`SECURITY AUDIT: Auth successful for user ${user.user_id} (role: ${user.user_type_name}) on ${req.method} ${req.path} from IP: ${req.ip}`);
    req.user = user;
    next();
  });
};

// Role-based authorization middleware
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.user_type_name) {
      logger.warn(`RBAC AUDIT: Authorization failed - no user or user_type_name in request for ${req.method} ${req.path} from IP: ${req.ip}`);
      return res.status(403).json({ message: 'User information not available' });
    }

    // Superadmin has unrestricted access
    if (req.user.user_type_name === 'Superadmin') {
      logger.info(`RBAC AUDIT: Superadmin access granted for user ${req.user.user_id} on ${req.method} ${req.path} from IP: ${req.ip}`);
      return next();
    }

    // Define admin roles
    const adminRoles = ['Superadmin', 'Staff'];

    if (allowedRoles.includes('admin') && !adminRoles.includes(req.user.user_type_name)) {
      logger.warn(`RBAC AUDIT: Admin access denied for user ${req.user.user_id} (role: ${req.user.user_type_name}) on ${req.method} ${req.path} from IP: ${req.ip}`);
      return res.status(403).json({ message: 'Admin access required' });
    }

    logger.info(`RBAC AUDIT: Access granted for user ${req.user.user_id} (role: ${req.user.user_type_name}) on ${req.method} ${req.path} from IP: ${req.ip}`);
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };