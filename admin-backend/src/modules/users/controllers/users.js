const { updatePreferencesSchema, bulkOperationsSchema } = require('../../../utils/validationSchemas');

module.exports = (service, logger, loggingService) => ({
  /**
   * Retrieves a paginated list of all users in the system
   * Supports pagination with configurable page size
   * @param {Object} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.page=1] - Page number for pagination
   * @param {number} [req.query.limit=10] - Number of users per page
   * @param {Object} res - Express response object
   * @returns {Promise<void>} JSON response with paginated user data
   */
  getUsers: async (req, res) => {
    logger.debug('Starting getUsers');
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await service.getAllUsers(page, limit);
      logger.info('getUsers completed successfully');
      res.json(result);
    } catch (error) {
      logger.error('Error in getUsers:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  /**
   * Retrieves a single user by their ID
   * Validates the user ID format and returns user details
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.id - User ID to retrieve (must be positive integer)
   * @param {Object} res - Express response object
   * @returns {Promise<void>} JSON response with user data or 404 if not found
   */
  getUser: async (req, res) => {
    logger.debug('Starting getUser');
    try {
      const { id } = req.params;
      logger.info(`getUser called with id: ${id}`);
      if (!id || isNaN(id) || parseInt(id) <= 0) {
        logger.warn(`Invalid user ID: ${id}`);
        return res.status(400).json({ message: 'Invalid user ID: must be a positive integer' });
      }
      const user = await service.getUserById(id);
      if (!user) {
        logger.info('User not found for getUser');
        return res.status(404).json({ message: 'User not found' });
      }
      logger.info('getUser completed successfully');
      res.json(user);
    } catch (error) {
      logger.error('Error in getUser:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  /**
   * Creates a new user in the system
   * Logs the creation action for audit purposes if performed by superadmin
   * @param {Object} req - Express request object
   * @param {Object} req.body - User data for creation
   * @param {Object} req.user - Authenticated user performing the action
   * @param {string} req.user.user_id - ID of the user creating the new account
   * @param {string} req.user.user_type_name - Type of user performing creation
   * @param {Object} res - Express response object
   * @returns {Promise<void>} JSON response with created user data
   */
  createUser: async (req, res) => {
    logger.debug('Starting createUserController');
    try {
      const userData = req.body;
      const user = await service.createUser(userData, req.user.user_id);
      logger.info(`AUDIT: User created with ID ${user.user_id} by user ${req.user.user_id}`);
      // Log to DB if superadmin
      if (req.user.user_type_name === 'Superadmin') {
        await loggingService.createLog('info', `Superadmin created user ${user.user_id}`, req.user.user_id, 'USER_CREATE', JSON.stringify({ created_user_id: user.user_id }));
      }
      logger.info('createUserController completed successfully');
      res.status(201).json(user);
    } catch (error) {
      logger.error('Error in createUserController:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  /**
   * Updates an existing user's information
   * Logs the update action for audit purposes if performed by superadmin
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.id - ID of the user to update
   * @param {Object} req.body - Updated user data
   * @param {Object} req.user - Authenticated user performing the action
   * @param {string} req.user.user_id - ID of the user making the update
   * @param {string} req.user.user_type_name - Type of user performing update
   * @param {Object} res - Express response object
   * @returns {Promise<void>} JSON response with updated user data or 404 if not found
   */
  updateUser: async (req, res) => {
    logger.debug('Starting updateUserController');
    try {
      const { id } = req.params;
      const userData = req.body;
      const user = await service.updateUser(id, userData, req.user.user_id);
      if (!user) {
        logger.info('User not found for updateUserController');
        return res.status(404).json({ message: 'User not found' });
      }
      logger.info(`AUDIT: User updated with ID ${id} by user ${req.user.user_id}`);
      // Log to DB if superadmin
      if (req.user.user_type_name === 'Superadmin') {
        await loggingService.createLog('info', `Superadmin updated user ${id}`, req.user.user_id, 'USER_UPDATE', JSON.stringify({ updated_user_id: id }));
      }
      logger.info('updateUserController completed successfully');
      res.json(user);
    } catch (error) {
      logger.error('Error in updateUserController:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  /**
   * Deletes a user from the system
   * @param {Object} req - Express request object
   * @param {Object} req.params - Route parameters
   * @param {string} req.params.id - ID of the user to delete
   * @param {Object} res - Express response object
   * @returns {Promise<void>} JSON response confirming deletion
   */
  deleteUser: async (req, res) => {
    logger.debug('Starting deleteUserController');
    try {
      const { id } = req.params;
      await service.deleteUser(id);
      logger.info('deleteUserController completed successfully');
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      logger.error('Error in deleteUserController:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  getUserTypes: async (req, res) => {
    logger.debug('Starting getUserTypesController');
    try {
      const userTypes = await service.getUserTypes();
      logger.info('getUserTypesController completed successfully');
      res.json(userTypes);
    } catch (error) {
      logger.error('Error in getUserTypesController:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  getModules: async (req, res) => {
    logger.debug('Starting getModulesController - route matched');
    logger.info('getModules controller called for /modules endpoint');
    try {
      const modules = await service.getActiveModules();
      logger.info('getModulesController completed successfully');
      res.json(modules);
    } catch (error) {
      logger.error('Error in getModulesController:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  getUserModules: async (req, res) => {
    logger.debug('Starting getUserModules');
    try {
      const { id } = req.params;
      const modules = await service.getModulesByUserId(id);
      logger.info('getUserModules completed successfully');
      res.json({ modules: modules.map(m => m.admin_module_id) });
    } catch (error) {
      logger.error('Error in getUserModules:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  updateUserModules: async (req, res) => {
    logger.debug('Starting updateUserModulesController');
    try {
      const { id } = req.params;
      const { modules } = req.body;
      if (!Array.isArray(modules)) {
        logger.info('Modules must be an array for updateUserModulesController');
        return res.status(400).json({ message: 'Modules must be an array of admin_module_ids' });
      }
      await service.updateUserModules(id, modules, req.user.user_id);
      logger.info(`AUDIT: User modules updated for user ID ${id} by user ${req.user.user_id}, modules: ${modules.join(', ')}`);
      // Log to DB if superadmin
      if (req.user.user_type_name === 'Superadmin') {
        await loggingService.createLog('info', `Superadmin updated modules for user ${id}`, req.user.user_id, 'USER_MODULES_UPDATE', JSON.stringify({ user_id: id, modules }));
      }
      logger.info('updateUserModulesController completed successfully');
      res.json({ message: 'User modules updated successfully' });
    } catch (error) {
      logger.error('Error in updateUserModulesController:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  getProfile: async (req, res) => {
    logger.debug('Starting getProfile');
    try {
      const userId = req.user.user_id;
      const profile = await service.getProfile(userId);
      logger.info('getProfile completed successfully');
      res.json(profile);
    } catch (error) {
      logger.error('Error in getProfile:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  updateProfile: async (req, res) => {
    logger.debug('Starting updateProfile');
    try {
      const userId = req.user.user_id;
      const profileData = req.body;
      const profile = await service.updateProfile(userId, profileData);
      logger.info(`AUDIT: Profile updated for user ${userId} by user ${req.user.user_id}`);
      // Log to DB if superadmin
      if (req.user.user_type_name === 'Superadmin') {
        await loggingService.createLog('info', 'Superadmin updated own profile', req.user.user_id, 'PROFILE_UPDATE', JSON.stringify({ user_id: userId }));
      }
      logger.info('updateProfile completed successfully');
      res.json(profile);
    } catch (error) {
      logger.error('Error in updateProfile:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  updatePassword: async (req, res) => {
    logger.debug('Starting updatePassword');
    try {
      const userId = req.user.user_id;
      const { old_password, new_password, confirm_password } = req.body;
      await service.updatePassword(userId, old_password, new_password, confirm_password);
      logger.info(`AUDIT: Password updated for user ${userId} by user ${req.user.user_id}`);
      // Log to DB if superadmin
      if (req.user.user_type_name === 'Superadmin') {
        await loggingService.createLog('info', 'Superadmin updated password', req.user.user_id, 'PASSWORD_UPDATE', JSON.stringify({ user_id: userId }));
      }
      logger.info('updatePassword completed successfully');
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      logger.error('Error in updatePassword:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  uploadImage: async (req, res) => {
    logger.debug('Starting uploadImage');
    try {
      if (!req.file) {
        logger.info('No file uploaded in uploadImage');
        return res.status(400).json({ message: 'No file uploaded' });
      }
      const userId = req.user.user_id;
      const imagePath = `/uploads/${req.file.filename}`;
      await service.updateProfile(userId, { image: imagePath });
      logger.info(`AUDIT: Image uploaded for user ${userId} by user ${req.user.user_id}`);
      logger.info('uploadImage completed successfully');
      res.json({ message: 'Image uploaded successfully', image: imagePath });
    } catch (error) {
      logger.error('Error in uploadImage:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  getUserPreferences: async (req, res) => {
    logger.debug('Starting getUserPreferences');
    try {
      const userId = req.user.user_id;
      const preferences = await service.getUserPreferences(userId);
      logger.info('getUserPreferences completed successfully');
      res.json(preferences);
    } catch (error) {
      logger.error('Error in getUserPreferences:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  updateUserPreferences: async (req, res) => {
    logger.debug('Starting updateUserPreferences');
    try {
      const { createValidationErrorResponse } = require('../../../utils/validationErrorHandler');

      const { error } = updatePreferencesSchema.validate(req.body);
      if (error) {
        logger.info('Validation error in updateUserPreferences:', error.details[0].message);
        return res.status(400).json(createValidationErrorResponse(error));
      }

      const userId = req.user.user_id;
      const preferencesData = req.body;
      const preferences = await service.updateUserPreferences(userId, preferencesData);
      logger.info(`AUDIT: User preferences updated for user ${userId} by user ${req.user.user_id}`);
      logger.info('updateUserPreferences completed successfully');
      res.json(preferences);
    } catch (error) {
      logger.error('Error in updateUserPreferences:', error.message);
      res.status(500).json({ message: 'Failed to update user preferences' });
    }
  },

  bulkAssignPermissions: async (req, res) => {
    logger.debug('Starting bulkAssignPermissions for user');
    try {
      const { createValidationErrorResponse } = require('../../../utils/validationErrorHandler');

      const { error } = bulkOperationsSchema.validate(req.body);
      if (error) {
        logger.info('Validation error in bulkAssignPermissions:', error.details[0].message);
        return res.status(400).json(createValidationErrorResponse(error));
      }

      const { id } = req.params;
      const { moduleIds } = req.body;
      const results = await service.bulkAssignPermissions(id, moduleIds, req.user.user_id);
      logger.info(`AUDIT: Bulk permissions assigned to user ${id} by user ${req.user.user_id}`);
      logger.info('bulkAssignPermissions completed successfully');
      res.status(201).json(results);
    } catch (error) {
      logger.error('Error in bulkAssignPermissions:', error.message);
      res.status(500).json({ message: 'Failed to assign permissions' });
    }
  },

  bulkRemovePermissions: async (req, res) => {
    logger.debug('Starting bulkRemovePermissions for user');
    try {
      const { createValidationErrorResponse } = require('../../../utils/validationErrorHandler');

      const { error } = bulkOperationsSchema.validate(req.body);
      if (error) {
        logger.info('Validation error in bulkRemovePermissions:', error.details[0].message);
        return res.status(400).json(createValidationErrorResponse(error));
      }

      const { id } = req.params;
      const { moduleIds } = req.body;
      const results = await service.bulkRemovePermissions(id, moduleIds, req.user.user_id);
      logger.info(`AUDIT: Bulk permissions removed from user ${id} by user ${req.user.user_id}`);
      logger.info('bulkRemovePermissions completed successfully');
      res.json(results);
    } catch (error) {
      logger.error('Error in bulkRemovePermissions:', error.message);
      res.status(500).json({ message: 'Failed to remove permissions' });
    }
  },
});