const fs = require('fs');
const path = require('path');

module.exports = (config, logger, models) => ({
  getLogLevel: async () => {
    try {
      const setting = await models.settings.getSetting('LOG_LEVEL');
      const level = setting ? setting.setting_value : process.env.LOG_LEVEL || 'info';
      return level;
    } catch (error) {
      logger.error('Error in loggingService.getLogLevel', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  setLogLevel: async (level) => {
    try {
      if (!['error', 'warn', 'info', 'debug'].includes(level)) {
        throw new Error('Invalid log level');
      }
      await models.settings.setSetting('LOG_LEVEL', level);
      // Update the logger instance level
      logger.setLogLevel(level);
      return level;
    } catch (error) {
      logger.error('Error in loggingService.setLogLevel', {
        error: error.message,
        stack: error.stack,
        level
      });
      throw error;
    }
  },

  getLogs: async (page = 1, limit = 50, level = null, userId = null, startDate = null, endDate = null) => {
    try {
      // Get structured logs from DB
      const structuredLogs = await models.logs.getLogs(page, limit, level, userId, startDate, endDate);

      // Also get file logs if available
      let fileLogs = null;
      try {
        const logFile = process.env.LOG_FILE_PATH;
        if (logFile && fs.existsSync(logFile)) {
          fileLogs = fs.readFileSync(logFile, 'utf8');
        }
      } catch (error) {
        logger.warn('Failed to read log file:', error.message);
      }

      return {
        structured: structuredLogs,
        file: fileLogs,
      };
    } catch (error) {
      logger.error('Error in loggingService.getLogs', {
        error: error.message,
        stack: error.stack,
        page,
        limit,
        level,
        userId,
        startDate,
        endDate
      });
      throw error;
    }
  },

  createLog: async (level, message, userId = null, action = null, details = null) => {
    try {
      return await models.logs.createLog(level, message, userId, action, details);
    } catch (error) {
      logger.error('Error in loggingService.createLog', {
        error: error.message,
        stack: error.stack,
        level,
        message,
        userId,
        action,
        details
      });
      throw error;
    }
  },

  getAllSettings: async () => {
    try {
      return await models.settings.getAllSettings();
    } catch (error) {
      logger.error('Error in loggingService.getAllSettings', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  getSetting: async (key) => {
    try {
      return await models.settings.getSetting(key);
    } catch (error) {
      logger.error('Error in loggingService.getSetting', {
        error: error.message,
        stack: error.stack,
        key
      });
      throw error;
    }
  },

  createSetting: async (key, value) => {
    try {
      return await models.settings.setSetting(key, value);
    } catch (error) {
      logger.error('Error in loggingService.createSetting', {
        error: error.message,
        stack: error.stack,
        key,
        value
      });
      throw error;
    }
  },

  updateSetting: async (key, value) => {
    try {
      return await models.settings.setSetting(key, value);
    } catch (error) {
      logger.error('Error in loggingService.updateSetting', {
        error: error.message,
        stack: error.stack,
        key,
        value
      });
      throw error;
    }
  },

  deleteSetting: async (key) => {
    try {
      const db = require('../../../lib/prisma');
      const setting = await db.setting.findUnique({ where: { setting_key: key } });
      if (!setting) return null;
      await db.setting.delete({ where: { setting_key: key } });
      return setting;
    } catch (error) {
      logger.error('Error in loggingService.deleteSetting', {
        error: error.message,
        stack: error.stack,
        key
      });
      throw error;
    }
  },

  logClientError: async (level, message, stack = null, userAgent = null, url = null) => {
    try {
      const details = {
        stack,
        userAgent,
        url,
      };
      return await models.logs.createLog(level, message, null, 'CLIENT_ERROR', JSON.stringify(details));
    } catch (error) {
      logger.error('Error in loggingService.logClientError', {
        error: error.message,
        stack: error.stack,
        level,
        message,
        userAgent,
        url
      });
      throw error;
    }
  },
});