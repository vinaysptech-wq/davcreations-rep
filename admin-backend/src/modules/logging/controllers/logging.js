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
});