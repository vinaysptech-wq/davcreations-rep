const { logger } = require('../utils');

function validateConfig() {
  const errors = [];

  if (!process.env.CORS_ORIGIN) {
    errors.push('CORS_ORIGIN environment variable is required');
  }

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.HTTPS_ENABLED) {
      errors.push('HTTPS_ENABLED environment variable is required in production');
    }
    if (process.env.HTTPS_ENABLED === 'true' && !process.env.HTTPS_REDIRECT) {
      logger.warn('HTTPS_REDIRECT not set, HTTPS enforcement may not work properly in production');
    }
  }

  if (errors.length > 0) {
    const errorMessage = `Configuration validation failed: ${errors.join(', ')}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  logger.info('Server configuration validated successfully');
}

const config = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN,
  corsCredentials: process.env.CORS_CREDENTIALS === 'true',
  httpsEnabled: process.env.HTTPS_ENABLED === 'true',
  httpsRedirect: process.env.HTTPS_REDIRECT === 'true',
  logFilePath: process.env.LOG_FILE_PATH,
};

// Validate configuration on load
validateConfig();

module.exports = config;