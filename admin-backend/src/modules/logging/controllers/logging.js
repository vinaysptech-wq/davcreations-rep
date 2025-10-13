module.exports = (service, logger) => ({
  getLogLevel: async (req, res) => {
    try {
      const level = await service.getLogLevel();
      res.json({ logLevel: level });
    } catch (error) {
      logger.error(`Failed to get log level: ${error.message}`);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  setLogLevel: async (req, res) => {
    const Joi = require('joi');
    const setLogLevelSchema = Joi.object({
      level: Joi.string().valid('error', 'warn', 'info', 'debug').required(),
    });

    const { error } = setLogLevelSchema.validate(req.body);
    if (error) {
      logger.warn(`Log level validation failed: ${error.details[0].message}`);
      return res.status(400).json({ message: error.details[0].message });
    }
    const { level } = req.body;
    try {
      await service.setLogLevel(level);
      logger.info(`Log level changed to ${level} by user ${req.user.user_id}`);
      res.json({ message: 'Log level updated' });
    } catch (error) {
      logger.error(`Failed to set log level: ${error.message}`);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  logClientError: async (req, res) => {
    const Joi = require('joi');
    const logClientErrorSchema = Joi.object({
      level: Joi.string().valid('error', 'warn', 'info', 'debug').required(),
      message: Joi.string().required(),
      stack: Joi.string().optional(),
      userAgent: Joi.string().optional(),
      url: Joi.string().optional(),
    });

    const { error } = logClientErrorSchema.validate(req.body);
    if (error) {
      logger.warn(`Client error log validation failed: ${error.details[0].message}`);
      return res.status(400).json({ message: error.details[0].message });
    }
    const { level, message, stack, userAgent, url } = req.body;
    try {
      await service.logClientError(level, message, stack, userAgent, url);
      res.json({ message: 'Client error logged' });
    } catch (error) {
      logger.error(`Failed to log client error: ${error.message}`);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getLogs: async (req, res) => {
    try {
      const result = await service.getLogs();
      res.json(result);
    } catch (error) {
      logger.error(`Failed to get logs: ${error.message}`);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Settings endpoints
  getSettings: async (req, res) => {
    try {
      const settings = await service.getAllSettings();
      res.json(settings);
    } catch (error) {
      logger.error(`Failed to get settings: ${error.message}`);
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
      logger.error(`Failed to get setting: ${error.message}`);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  createSetting: async (req, res) => {
    const Joi = require('joi');
    const createSettingSchema = Joi.object({
      setting_key: Joi.string().required(),
      setting_value: Joi.string().required(),
    });

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
      logger.error(`Failed to create setting: ${error.message}`);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  updateSetting: async (req, res) => {
    const Joi = require('joi');
    const updateSettingSchema = Joi.object({
      setting_value: Joi.string().required(),
    });

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
      logger.error(`Failed to update setting: ${error.message}`);
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
      logger.error(`Failed to delete setting: ${error.message}`);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Audit endpoints
  getAuditLogsForPermission: async (req, res) => {
    try {
      const { rolePermissionsId } = req.params;
      const { limit } = req.query;
      const auditLogs = await service.getAuditLogsForPermission(rolePermissionsId, limit);
      res.json(auditLogs);
    } catch (error) {
      logger.error(`Failed to get audit logs for permission: ${error.message}`);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getAuditLogsForUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit } = req.query;
      const auditLogs = await service.getAuditLogsForUser(userId, limit);
      res.json(auditLogs);
    } catch (error) {
      logger.error(`Failed to get audit logs for user: ${error.message}`);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getAuditLogsByDateRange: async (req, res) => {
    try {
      const { startDate, endDate, limit } = req.query;
      const auditLogs = await service.getAuditLogsByDateRange(startDate, endDate, limit);
      res.json(auditLogs);
    } catch (error) {
      logger.error(`Failed to get audit logs by date range: ${error.message}`);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getAuditSummary: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const summary = await service.getAuditSummary(startDate, endDate);
      res.json(summary);
    } catch (error) {
      logger.error(`Failed to get audit summary: ${error.message}`);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
});