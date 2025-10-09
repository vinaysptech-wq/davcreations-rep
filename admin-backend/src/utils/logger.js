const winston = require('winston');

// Determine log level based on environment or LOG_LEVEL env var
const getLogLevel = () => {
  // Allow override via environment variable
  if (process.env.LOG_LEVEL) {
    const validLevels = ['error', 'warn', 'info', 'debug'];
    if (validLevels.includes(process.env.LOG_LEVEL.toLowerCase())) {
      return process.env.LOG_LEVEL.toLowerCase();
    }
  }

  const env = process.env.NODE_ENV;
  if (env === 'production') {
    return 'warn'; // In production, log warnings and above
  } else if (env === 'staging') {
    return 'info'; // In staging, log info and above
  }
  return 'debug'; // for development, debugging, or other environments
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

// Function to dynamically change log level
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