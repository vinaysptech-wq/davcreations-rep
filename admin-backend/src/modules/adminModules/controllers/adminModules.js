module.exports = (service, logger) => ({
  getAdminModules: async (req, res) => {
    logger.debug('Starting getAdminModules');
    try {
      const adminModules = await service.getAll();
      logger.info('getAdminModules completed successfully');
      res.json(adminModules);
    } catch (error) {
      logger.error('Error in getAdminModules:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  getAdminModule: async (req, res) => {
    logger.debug('Starting getAdminModule');
    try {
      const { id } = req.params;
      const adminModule = await service.getById(id);
      if (!adminModule) {
        logger.info('Admin module not found for getAdminModule');
        return res.status(404).json({ message: 'Admin module not found' });
      }
      logger.info('getAdminModule completed successfully');
      res.json(adminModule);
    } catch (error) {
      logger.error('Error in getAdminModule:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  createAdminModule: async (req, res) => {
    logger.debug('Starting createAdminModule');
    try {
      const Joi = require('joi');
      const createAdminModuleSchema = Joi.object({
        module_name: Joi.string().required(),
        url_slug: Joi.string().required(),
        parent_id: Joi.number().integer().optional(),
        tool_tip: Joi.string().optional(),
        short_description: Joi.string().optional(),
        category: Joi.string().optional(),
        is_active: Joi.boolean().optional(),
        user_id: Joi.number().integer().optional(),
      });

      const { error } = createAdminModuleSchema.validate(req.body);
      if (error) {
        logger.info('Validation error in createAdminModule:', error.details[0].message);
        return res.status(400).json({ message: error.details[0].message });
      }
      const adminModuleData = req.body;
      const adminModule = await service.create(adminModuleData);
      logger.info(`Admin module created successfully with ID: ${adminModule.admin_module_id}`);
      res.status(201).json(adminModule);
    } catch (error) {
      logger.error('Error in createAdminModule:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  updateAdminModule: async (req, res) => {
    logger.debug('Starting updateAdminModule');
    try {
      const Joi = require('joi');
      const updateAdminModuleSchema = Joi.object({
        module_name: Joi.string().required(),
        url_slug: Joi.string().required(),
        parent_id: Joi.number().integer().optional(),
        tool_tip: Joi.string().optional(),
        short_description: Joi.string().optional(),
        category: Joi.string().optional(),
        is_active: Joi.boolean().optional(),
        user_id: Joi.number().integer().optional(),
      });

      const { error } = updateAdminModuleSchema.validate(req.body);
      if (error) {
        logger.info('Validation error in updateAdminModule:', error.details[0].message);
        return res.status(400).json({ message: error.details[0].message });
      }
      const { id } = req.params;
      const adminModuleData = req.body;
      const adminModule = await service.update(id, adminModuleData);
      if (!adminModule) {
        logger.info('Admin module not found for updateAdminModule');
        return res.status(404).json({ message: 'Admin module not found' });
      }
      logger.info('updateAdminModule completed successfully');
      res.json(adminModule);
    } catch (error) {
      logger.error('Error in updateAdminModule:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  deleteAdminModule: async (req, res) => {
    logger.debug('Starting deleteAdminModule');
    try {
      const { id } = req.params;
      await service.delete(id);
      logger.info('deleteAdminModule completed successfully');
      res.json({ message: 'Admin module deleted successfully' });
    } catch (error) {
      logger.error('Error in deleteAdminModule:', error.message);
      res.status(500).json({ message: error.message });
    }
  },
});