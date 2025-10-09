module.exports = (config, logger, models) => ({
  create: async (adminModuleData) => {
    try {
      logger.debug(`Creating admin module with name: ${adminModuleData.module_name}`);
      // Basic validation
      if (!adminModuleData.module_name) {
        throw new Error('module_name is required');
      }
      const result = await models.adminModule.create(adminModuleData);
      logger.info(`Admin module created successfully with ID: ${result.admin_module_id}`);
      return result;
    } catch (error) {
      logger.error('Error in adminModuleService.create', {
        error: error.message,
        stack: error.stack,
        adminModuleData
      });
      throw error;
    }
  },

  getAll: async () => {
    try {
      logger.debug('getAll called');
      const result = await models.adminModule.getAll();
      logger.info('getAll completed successfully');
      return result;
    } catch (error) {
      logger.error('Error in adminModuleService.getAll', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  getById: async (admin_module_id) => {
    try {
      logger.debug(`getById called with id: ${admin_module_id}`);
      const result = await models.adminModule.getById(admin_module_id);
      logger.info('getById completed successfully');
      return result;
    } catch (error) {
      logger.error('Error in adminModuleService.getById', {
        error: error.message,
        stack: error.stack,
        admin_module_id
      });
      throw error;
    }
  },

  update: async (admin_module_id, adminModuleData) => {
    try {
      logger.debug(`update called with id: ${admin_module_id}, data: ${JSON.stringify(adminModuleData)}`);
      // Basic validation
      if (!adminModuleData.module_name) {
        throw new Error('module_name is required');
      }
      const result = await models.adminModule.update(admin_module_id, adminModuleData);
      logger.info('update completed successfully');
      return result;
    } catch (error) {
      logger.error('Error in adminModuleService.update', {
        error: error.message,
        stack: error.stack,
        admin_module_id,
        adminModuleData
      });
      throw error;
    }
  },

  delete: async (admin_module_id) => {
    try {
      logger.debug(`delete called with id: ${admin_module_id}`);
      const result = await models.adminModule.delete(admin_module_id);
      logger.info('delete completed successfully');
      return result;
    } catch (error) {
      logger.error('Error in adminModuleService.delete', {
        error: error.message,
        stack: error.stack,
        admin_module_id
      });
      throw error;
    }
  },
});