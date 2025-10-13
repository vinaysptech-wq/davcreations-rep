module.exports = (config, logger, models) => ({
  create: async (userTypeData) => {
    try {
      logger.debug(`Creating user type with name: ${userTypeData.user_type_name}`);
      // Basic validation
      if (!userTypeData.user_type_name || !userTypeData.user_type_name.trim()) {
        throw new Error('user_type_name is required');
      }
      userTypeData.user_type_name = userTypeData.user_type_name.trim();
      const result = await models.userType.create(userTypeData);
      logger.info(`User type created successfully with ID: ${result.user_type_id}`);
      return result;
    } catch (error) {
      logger.error('Error in userTypeService.create', {
        error: error.message,
        stack: error.stack,
        userTypeData
      });
      throw error;
    }
  },

  getAll: async () => {
    try {
      logger.debug('getAll called');
      const result = await models.userType.getAll();
      logger.info('getAll completed successfully');
      logger.info(`User types fetched: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      logger.error('Error in userTypeService.getAll', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  getById: async (user_type_id) => {
    try {
      logger.debug(`getById called with id: ${user_type_id}`);
      const result = await models.userType.getById(user_type_id);
      logger.info('getById completed successfully');
      return result;
    } catch (error) {
      logger.error('Error in userTypeService.getById', {
        error: error.message,
        stack: error.stack,
        user_type_id
      });
      throw error;
    }
  },

  update: async (user_type_id, userTypeData) => {
    try {
      logger.debug(`update called with id: ${user_type_id}, data: ${JSON.stringify(userTypeData)}`);
      // Basic validation
      if (!userTypeData.user_type_name || !userTypeData.user_type_name.trim()) {
        throw new Error('user_type_name is required');
      }
      userTypeData.user_type_name = userTypeData.user_type_name.trim();
      const result = await models.userType.update(user_type_id, userTypeData);
      logger.info('update completed successfully');
      return result;
    } catch (error) {
      logger.error('Error in userTypeService.update', {
        error: error.message,
        stack: error.stack,
        user_type_id,
        userTypeData
      });
      throw error;
    }
  },

  delete: async (user_type_id) => {
    try {
      logger.debug(`delete called with id: ${user_type_id}`);
      const result = await models.userType.delete(user_type_id);
      logger.info('delete completed successfully');
      return result;
    } catch (error) {
      logger.error('Error in userTypeService.delete', {
        error: error.message,
        stack: error.stack,
        user_type_id
      });
      throw error;
    }
  },
});