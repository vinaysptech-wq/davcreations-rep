module.exports = (service, logger) => ({
  getUserTypes: async (req, res) => {
    logger.debug('Starting getUserTypes');
    try {
      const userTypes = await service.getAll();
      logger.info('getUserTypes completed successfully');
      res.json(userTypes);
    } catch (error) {
      logger.error('Error in getUserTypes:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  getUserType: async (req, res) => {
    logger.debug('Starting getUserType');
    try {
      const { id } = req.params;
      const userType = await service.getById(id);
      if (!userType) {
        logger.info('User type not found for getUserType');
        return res.status(404).json({ message: 'User type not found' });
      }
      logger.info('getUserType completed successfully');
      res.json(userType);
    } catch (error) {
      logger.error('Error in getUserType:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  createUserType: async (req, res) => {
    logger.debug('Starting createUserType');
    try {
      const Joi = require('joi');
      const createUserTypeSchema = Joi.object({
        user_type_name: Joi.string().required(),
        is_active: Joi.boolean().optional(),
      });

      const { error } = createUserTypeSchema.validate(req.body);
      if (error) {
        logger.info('Validation error in createUserType:', error.details[0].message);
        return res.status(400).json({ message: error.details[0].message });
      }
      const userTypeData = req.body;
      const userType = await service.create(userTypeData);
      logger.info(`AUDIT: User type created with ID ${userType.user_type_id} by user ${req.user.user_id}`);
      logger.info(`User type created successfully with ID: ${userType.user_type_id}`);
      res.status(201).json(userType);
    } catch (error) {
      logger.error('Error in createUserType:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  updateUserType: async (req, res) => {
    logger.debug('Starting updateUserType');
    try {
      const Joi = require('joi');
      const updateUserTypeSchema = Joi.object({
        user_type_name: Joi.string().required(),
        is_active: Joi.boolean().optional(),
      });

      const { error } = updateUserTypeSchema.validate(req.body);
      if (error) {
        logger.info('Validation error in updateUserType:', error.details[0].message);
        return res.status(400).json({ message: error.details[0].message });
      }
      const { id } = req.params;
      const userTypeData = req.body;
      const userType = await service.update(id, userTypeData);
      if (!userType) {
        logger.info('User type not found for updateUserType');
        return res.status(404).json({ message: 'User type not found' });
      }
      logger.info(`AUDIT: User type updated with ID ${id} by user ${req.user.user_id}`);
      logger.info('updateUserType completed successfully');
      res.json(userType);
    } catch (error) {
      logger.error('Error in updateUserType:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  deleteUserType: async (req, res) => {
    logger.debug('Starting deleteUserType');
    try {
      const { id } = req.params;
      await service.delete(id);
      logger.info('deleteUserType completed successfully');
      res.json({ message: 'User type deleted successfully' });
    } catch (error) {
      logger.error('Error in deleteUserType:', error.message);
      res.status(500).json({ message: error.message });
    }
  },
});