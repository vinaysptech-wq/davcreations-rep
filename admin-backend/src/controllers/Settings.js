const Joi = require('joi');

const createSettingSchema = Joi.object({
  setting_key: Joi.string().required(),
  setting_value: Joi.string().required(),
});

const updateSettingSchema = Joi.object({
  setting_value: Joi.string().required(),
});

module.exports = (service, logger) => ({
  getSettings: async (req, res) => {
    try {
      const settings = await service.getAllSettings();
      res.json(settings);
    } catch (error) {
      logger.error(`Failed to get settings: ${error.message}`, {
        stack: error.stack,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getSetting: async (req, res) => {
    try {
      const { key } = req.params;
      const setting = await service.getSetting(key);
      if (!setting) {
        return res.status(404).json({ message: 'Setting not found' });
      }
      res.json(setting);
    } catch (error) {
      logger.error(`Failed to get setting: ${error.message}`, {
        stack: error.stack,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  createSetting: async (req, res) => {
    const { error } = createSettingSchema.validate(req.body);
    if (error) {
      logger.warn(`Setting validation failed: ${error.details[0].message}`);
      return res.status(400).json({ message: error.details[0].message });
    }
    try {
      const { setting_key, setting_value } = req.body;
      const setting = await service.createSetting(setting_key, setting_value);
      logger.info(`Setting created: ${setting_key} by user ${req.user.user_id}`);
      res.status(201).json(setting);
    } catch (error) {
      logger.error(`Failed to create setting: ${error.message}`, {
        stack: error.stack,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  updateSetting: async (req, res) => {
    const { error } = updateSettingSchema.validate(req.body);
    if (error) {
      logger.warn(`Setting update validation failed: ${error.details[0].message}`);
      return res.status(400).json({ message: error.details[0].message });
    }
    try {
      const { key } = req.params;
      const { setting_value } = req.body;
      const setting = await service.updateSetting(key, setting_value);
      if (!setting) {
        return res.status(404).json({ message: 'Setting not found' });
      }
      logger.info(`Setting updated: ${key} by user ${req.user.user_id}`);
      res.json(setting);
    } catch (error) {
      logger.error(`Failed to update setting: ${error.message}`, {
        stack: error.stack,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  deleteSetting: async (req, res) => {
    try {
      const { key } = req.params;
      const setting = await service.deleteSetting(key);
      if (!setting) {
        return res.status(404).json({ message: 'Setting not found' });
      }
      logger.info(`Setting deleted: ${key} by user ${req.user.user_id}`);
      res.json({ message: 'Setting deleted successfully' });
    } catch (error) {
      logger.error(`Failed to delete setting: ${error.message}`, {
        stack: error.stack,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  },
});