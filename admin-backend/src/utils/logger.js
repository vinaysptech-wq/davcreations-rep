const winston = require('winston');

/**
 * Determines the appropriate log level based on environment configuration
 * Priority: LOG_LEVEL env var > NODE_ENV > default 'debug'
 * @returns {string} Log level ('error', 'warn', 'info', or 'debug')
 */
const getLogLevel = () => {
  // Allow override via environment variable for maximum flexibility
  if (process.env.LOG_LEVEL) {
    const validLevels = ['error', 'warn', 'info', 'debug'];
    if (validLevels.includes(process.env.LOG_LEVEL.toLowerCase())) {
      return process.env.LOG_LEVEL.toLowerCase();
    }
  }

  // Environment-based defaults for different deployment stages
  const env = process.env.NODE_ENV;
  if (env === 'production') {
    return 'warn'; // In production, log warnings and above to reduce noise
  } else if (env === 'staging') {
    return 'info'; // In staging, log info and above for monitoring
  }
  return 'debug'; // Default for development, debugging, or other environments
};

// Create transports
const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
];

// Add file transport if LOG_FILE_PATH is set
if (process.env.LOG_FILE_PATH) {
  transports.push(
    new winston.transports.File({
      filename: process.env.LOG_FILE_PATH,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  );
}

// Create logger
const logger = winston.createLogger({
  level: getLogLevel(),
  transports
});

/**
 * Dynamically changes the logger's log level at runtime
 * Useful for debugging or adjusting verbosity without restart
 * @param {string} level - The new log level ('error', 'warn', 'info', or 'debug')
 */
logger.setLogLevel = (level) => {
  const validLevels = ['error', 'warn', 'info', 'debug'];
  if (validLevels.includes(level.toLowerCase())) {
    logger.level = level.toLowerCase();
    logger.info(`Log level changed to ${level}`);
  } else {
    logger.warn(`Invalid log level: ${level}. Valid levels: ${validLevels.join(', ')}`);
  }
};

module.exports = logger;