const logger = require('../../utils/logger');
module.exports = (db) => ({
  getAllSettings: async () => {
    try {
      const settings = await db.setting.findMany({
        orderBy: { created_date: 'desc' },
      });
      return settings;
    } catch (error) {
      logger.error('Error in settingsModel.getAllSettings', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  getSetting: async (key) => {
    try {
      const setting = await db.setting.findUnique({ where: { setting_key: key } });
      return setting;
    } catch (error) {
      logger.error('Error in settingsModel.getSetting', {
        error: error.message,
        stack: error.stack,
        key
      });
      throw error;
    }
  },

  setSetting: async (key, value) => {
    try {
      const setting = await db.setting.upsert({
        where: { setting_key: key },
        update: { setting_value: value },
        create: { setting_key: key, setting_value: value },
      });
      return setting;
    } catch (error) {
      logger.error('Error in settingsModel.setSetting', {
        error: error.message,
        stack: error.stack,
        key,
        value
      });
      throw error;
    }
  },
});