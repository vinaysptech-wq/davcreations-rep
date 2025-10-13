const { logger } = require('../utils');

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  logger.error('SECURITY RISK: JWT_SECRET environment variable is not set!');
} else if (jwtSecret.length < 32) {
  logger.warn('SECURITY WARNING: JWT_SECRET is shorter than recommended (32+ characters)');
}

module.exports = {
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
};