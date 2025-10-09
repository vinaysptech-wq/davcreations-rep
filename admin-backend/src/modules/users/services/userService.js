const bcrypt = require('bcryptjs');

module.exports = (config, logger, models) => ({
  createUser: async (userData, created_by) => {
    try {
      logger.debug(`Creating user with email: ${userData.email}`);

      // Basic validation
      if (!userData.first_name || !userData.last_name || !userData.email || !userData.user_password || !userData.user_type_id) {
        throw new Error('Required fields missing');
      }
      // Check password confirmation
      if (userData.user_password !== userData.confirm_password) {
        throw new Error('Passwords do not match');
      }

      // Model handles hashing
      const user = await models.user.createUser(userData);
      logger.info(`User created successfully with ID: ${user.user_id}, email: ${userData.email}`);
      return user;
    } catch (error) {
      logger.error('Error in userService.createUser', {
        error: error.message,
        stack: error.stack,
        userData: { ...userData, user_password: '[REDACTED]', confirm_password: '[REDACTED]' },
        created_by
      });
      throw error;
    }
  },

  getAllUsers: async (page, limit) => {
    try {
      logger.debug(`getAllUsers called with page: ${page}, limit: ${limit}`);
      const result = await models.user.getAllUsers(page, limit);
      logger.info('getAllUsers completed successfully');
      return result;
    } catch (error) {
      logger.error('Error in userService.getAllUsers', {
        error: error.message,
        stack: error.stack,
        page,
        limit
      });
      throw error;
    }
  },

  getUserById: async (user_id) => {
    try {
      logger.debug(`getUserById called with id: ${user_id}`);
      const result = await models.user.getUserById(user_id);
      logger.info('getUserById completed successfully');
      return result;
    } catch (error) {
      logger.error('Error in userService.getUserById', {
        error: error.message,
        stack: error.stack,
        user_id
      });
      throw error;
    }
  },

  updateUser: async (user_id, userData, created_by) => {
    try {
      logger.debug(`updateUser called with id: ${user_id}, data: ${JSON.stringify(userData)}`);

      // Basic validation
      if (userData.user_password && userData.user_password !== userData.confirm_password) {
        throw new Error('Passwords do not match');
      }

      const user = await models.user.updateUser(user_id, userData);
      logger.info('updateUser completed successfully');
      return user;
    } catch (error) {
      logger.error('Error in userService.updateUser', {
        error: error.message,
        stack: error.stack,
        user_id,
        userData: userData ? { ...userData, user_password: '[REDACTED]', confirm_password: '[REDACTED]' } : userData,
        created_by
      });
      throw error;
    }
  },

  deleteUser: async (user_id) => {
    try {
      logger.debug(`deleteUser called with id: ${user_id}`);
      const result = await models.user.deleteUser(user_id);
      logger.info('deleteUser completed successfully');
      return result;
    } catch (error) {
      logger.error('Error in userService.deleteUser', {
        error: error.message,
        stack: error.stack,
        user_id
      });
      throw error;
    }
  },

  getUserTypes: async () => {
    try {
      logger.debug('getUserTypes called');
      const result = await models.userType.getAll();
      logger.info('getUserTypes completed successfully');
      return result;
    } catch (error) {
      logger.error('Error in userService.getUserTypes', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  getActiveModules: async () => {
    try {
      logger.debug('getActiveModules called');
      const result = await models.adminModule.getActiveModules();
      logger.info('getActiveModules completed successfully');
      return result;
    } catch (error) {
      logger.error('Error in userService.getActiveModules', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  getModulesByUserId: async (user_id) => {
    try {
      logger.debug(`getModulesByUserId called with user_id: ${user_id}`);
      const result = await models.userAccess.getModulesByUserId(user_id);
      logger.info('getModulesByUserId completed successfully');
      return result;
    } catch (error) {
      logger.error('Error in userService.getModulesByUserId', {
        error: error.message,
        stack: error.stack,
        user_id
      });
      throw error;
    }
  },

  updateUserModules: async (user_id, modules, created_by) => {
    try {
      logger.debug(`updateUserModules called with user_id: ${user_id}, modules: ${JSON.stringify(modules)}, created_by: ${created_by}`);
      const result = await models.userAccess.updateUserModules(user_id, modules, created_by);
      logger.info('updateUserModules completed successfully');
      return result;
    } catch (error) {
      logger.error('Error in userService.updateUserModules', {
        error: error.message,
        stack: error.stack,
        user_id,
        modules,
        created_by
      });
      throw error;
    }
  },

  getProfile: async (user_id) => {
    try {
      logger.debug(`getProfile called with user_id: ${user_id}`);
      const user = await models.user.getUserById(user_id);
      if (!user) {
        throw new Error('User not found');
      }
      const profile = {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
      };
      logger.info('getProfile completed successfully');
      return profile;
    } catch (error) {
      logger.error('Error in userService.getProfile', {
        error: error.message,
        stack: error.stack,
        user_id
      });
      throw error;
    }
  },

  updateProfile: async (user_id, profileData) => {
    try {
      logger.debug(`updateProfile called with user_id: ${user_id}, data: ${JSON.stringify(profileData)}`);

      // Basic validation
      if (!profileData.first_name || !profileData.last_name || !profileData.email) {
        throw new Error('Required fields missing: first_name, last_name, email');
      }

      // Check email uniqueness if email is being updated
      const existingUser = await models.user.getByEmail(profileData.email);
      if (existingUser && existingUser.user_id !== parseInt(user_id)) {
        throw new Error('Email already exists');
      }

      const updateData = {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address,
        city: profileData.city,
        state: profileData.state,
      };

      const user = await models.user.updateUser(user_id, updateData, user_id);
      logger.info('updateProfile completed successfully');
      return user;
    } catch (error) {
      logger.error('Error in userService.updateProfile', {
        error: error.message,
        stack: error.stack,
        user_id,
        profileData
      });
      throw error;
    }
  },

  updatePassword: async (user_id, old_password, new_password, confirm_password) => {
    try {
      logger.debug(`updatePassword called with user_id: ${user_id}`);

      // Basic validation
      if (new_password !== confirm_password) {
        throw new Error('New passwords do not match');
      }

      const user = await models.user.getUserById(user_id);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify old password
      const isMatch = await bcrypt.compare(old_password, user.user_password);
      if (!isMatch) {
        throw new Error('Old password is incorrect');
      }

      // Update password - model handles hashing
      await models.user.updateUser(user_id, { user_password: new_password });
      logger.info('updatePassword completed successfully');
    } catch (error) {
      logger.error('Error in userService.updatePassword', {
        error: error.message,
        stack: error.stack,
        user_id
      });
      throw error;
    }
  },

  getUserPreferences: async (user_id) => {
    try {
      logger.debug(`getUserPreferences called with user_id: ${user_id}`);
      const result = await models.userPreferences.getUserPreferences(user_id);
      logger.info('getUserPreferences completed successfully');
      return result;
    } catch (error) {
      logger.error('Error in userService.getUserPreferences', {
        error: error.message,
        stack: error.stack,
        user_id
      });
      throw error;
    }
  },

  updateUserPreferences: async (user_id, preferencesData) => {
    try {
      logger.debug(`updateUserPreferences called with user_id: ${user_id}, data: ${JSON.stringify(preferencesData)}`);

      // Basic validation
      if (!preferencesData || typeof preferencesData !== 'object') {
        throw new Error('Invalid preferences data');
      }

      const result = await models.userPreferences.updateUserPreferences(user_id, preferencesData);
      logger.info(`AUDIT: User preferences updated for user ${user_id}`);
      logger.info('updateUserPreferences completed successfully');
      return result;
    } catch (error) {
      logger.error('Error in userService.updateUserPreferences', {
        error: error.message,
        stack: error.stack,
        user_id,
        preferencesData
      });
      throw error;
    }
  },

  createAuditLog: async (level, message, userId, action, details) => {
    try {
      logger.debug(`createAuditLog called with level: ${level}, message: ${message}, userId: ${userId}, action: ${action}`);
      const result = await models.logs.createLog(level, message, userId, action, details);
      logger.info('createAuditLog completed successfully');
      return result;
    } catch (error) {
      logger.error('Error in userService.createAuditLog', {
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
});