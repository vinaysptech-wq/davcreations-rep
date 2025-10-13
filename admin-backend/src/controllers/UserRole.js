const Joi = require('joi');

const createUserSchema = Joi.object({
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  user_type_id: Joi.number().integer().required(),
  address: Joi.string().optional(),
  email: Joi.string().email().required(),
  phone: Joi.string().optional(),
  user_password: Joi.string().min(6).required(),
  confirm_password: Joi.string().valid(Joi.ref('user_password')).required(),
  bank_name: Joi.string().optional(),
  bank_ifsc_code: Joi.string().optional(),
  bank_account_number: Joi.string().optional(),
  bank_address: Joi.string().optional(),
  is_active: Joi.boolean().optional(),
  modules: Joi.array().items(Joi.number().integer()).optional(),
});

const updateUserSchema = Joi.object({
  first_name: Joi.string().optional(),
  last_name: Joi.string().optional(),
  user_type_id: Joi.number().integer().optional(),
  address: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  user_password: Joi.string().min(6).optional(),
  confirm_password: Joi.string().when('user_password', {
    is: Joi.exist(),
    then: Joi.string().valid(Joi.ref('user_password')).required(),
    otherwise: Joi.forbidden(),
  }),
  bank_name: Joi.string().optional(),
  bank_ifsc_code: Joi.string().optional(),
  bank_account_number: Joi.string().optional(),
  bank_address: Joi.string().optional(),
  is_active: Joi.boolean().optional(),
  modules: Joi.array().items(Joi.number().integer()).optional(),
});

const updateProfileSchema = Joi.object({
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().optional(),
  address: Joi.string().optional(),
  city: Joi.string().optional(),
  state: Joi.string().optional(),
  image: Joi.string().optional(),
});

const updatePasswordSchema = Joi.object({
  old_password: Joi.string().required(),
  new_password: Joi.string().min(6).required(),
  confirm_password: Joi.string().valid(Joi.ref('new_password')).required(),
});

const updatePreferencesSchema = Joi.object({
  theme: Joi.string().valid('light', 'dark').optional(),
  language: Joi.string().min(2).max(10).optional(),
  email_notifications: Joi.boolean().optional(),
  push_notifications: Joi.boolean().optional(),
});

const createUserTypeSchema = Joi.object({
  user_type_name: Joi.string().required(),
});

const updateUserTypeSchema = Joi.object({
  user_type_name: Joi.string().required(),
});

const createAdminModuleSchema = Joi.object({
  module_name: Joi.string().required(),
  tool_tip: Joi.string().optional(),
  short_description: Joi.string().optional(),
  category: Joi.string().optional(),
});

const updateAdminModuleSchema = Joi.object({
  module_name: Joi.string().required(),
  tool_tip: Joi.string().optional(),
  short_description: Joi.string().optional(),
  category: Joi.string().optional(),
});

const setLogLevelSchema = Joi.object({
  level: Joi.string().valid('error', 'warn', 'info', 'debug').required(),
});

const clientErrorSchema = Joi.object({
  level: Joi.string().valid('error', 'warn', 'info', 'debug').required(),
  message: Joi.string().required(),
  stack: Joi.string().optional(),
  userAgent: Joi.string().optional(),
  url: Joi.string().optional(),
});

module.exports = (service, logger, loggingService) => ({
  getUsers: async (req, res) => {
    logger.debug('Starting getUsers');
    try {
      const { page = 1, limit = 10 } = req.query;
      const { users, total } = await service.getAllUsers(parseInt(page), parseInt(limit));
      logger.info('getUsers completed successfully');
      res.json({ users, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
      logger.error('Error in getUsers', {
        error: error.message,
        stack: error.stack,
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        user: req.user ? req.user.user_id : null
      });
      // SECURITY: Check if error message contains sensitive information
      const sanitizedMessage = error.message.includes('SQL') || error.message.includes('database') || error.message.includes('prisma')
        ? 'Internal server error'
        : error.message;
      logger.warn(`SECURITY AUDIT: Error response sanitized - original: "${error.message}", sent: "${sanitizedMessage}"`);
      res.status(500).json({ message: sanitizedMessage });
    }
  },

  getUser: async (req, res) => {
    logger.debug('Starting getUser');
    try {
      const { id } = req.params;
      const user = await service.getUserById(id);
      if (!user) {
        logger.info('User not found for getUser');
        return res.status(404).json({ message: 'User not found' });
      }
      logger.info('getUser completed successfully');
      res.json(user);
    } catch (error) {
      logger.error('Error in getUser', {
        error: error.message,
        stack: error.stack,
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        user: req.user ? req.user.user_id : null
      });
      res.status(500).json({ message: error.message });
    }
  },

  createUser: async (req, res) => {
    logger.debug('Starting createUser');
    try {
      const { error } = createUserSchema.validate(req.body);
      if (error) {
        logger.info('Validation error in createUser:', error.details[0].message);
        return res.status(400).json({ message: error.details[0].message });
      }
      const userData = req.body;
      const user = await service.createUser(userData, req.user.user_id);
      await loggingService.createAuditLog('info', `User created with ID ${user.user_id}`, req.user.user_id, 'CREATE_USER', JSON.stringify({ user_id: user.user_id, ...userData }));
      logger.info(`AUDIT: User created with ID ${user.user_id} by user ${req.user.user_id}`);
      logger.info('createUser completed successfully');
      res.status(201).json(user);
    } catch (error) {
      logger.error('Error in createUser', {
        error: error.message,
        stack: error.stack,
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        user: req.user ? req.user.user_id : null
      });
      res.status(500).json({ message: error.message });
    }
  },

  updateUser: async (req, res) => {
    logger.debug('Starting updateUser');
    try {
      const { error } = updateUserSchema.validate(req.body);
      if (error) {
        logger.info('Validation error in updateUser:', error.details[0].message);
        return res.status(400).json({ message: error.details[0].message });
      }
      const { id } = req.params;
      const userData = req.body;
      const user = await service.updateUser(id, userData, req.user.user_id);
      await loggingService.createAuditLog('info', `User updated with ID ${id}`, req.user.user_id, 'UPDATE_USER', JSON.stringify({ user_id: parseInt(id), ...userData }));
      if (!user) {
        logger.info('User not found for updateUser');
        return res.status(404).json({ message: 'User not found' });
      }
      logger.info(`AUDIT: User updated with ID ${id} by user ${req.user.user_id}`);
      logger.info('updateUser completed successfully');
      res.json(user);
    } catch (error) {
      logger.error('Error in updateUser', {
        error: error.message,
        stack: error.stack,
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        user: req.user ? req.user.user_id : null
      });
      res.status(500).json({ message: error.message });
    }
  },

  deleteUser: async (req, res) => {
    logger.debug('Starting deleteUser');
    try {
      const { id } = req.params;
      const user = await service.deleteUser(id);
      if (!user) {
        logger.info('User not found for deleteUser');
        return res.status(404).json({ message: 'User not found' });
      }
      await loggingService.createAuditLog('info', `User deleted with ID ${id}`, req.user.user_id, 'DELETE_USER', JSON.stringify({ user_id: parseInt(id) }));
      logger.info(`AUDIT: User deleted with ID ${id} by user ${req.user.user_id}`);
      logger.info('deleteUser completed successfully');
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      logger.error('Error in deleteUser', {
        error: error.message,
        stack: error.stack,
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        user: req.user ? req.user.user_id : null
      });
      res.status(500).json({ message: error.message });
    }
  },

  getUserTypes: async (req, res) => {
    logger.debug('Starting getUserTypes');
    try {
      const userTypes = await service.getUserTypes();
      logger.info('getUserTypes completed successfully');
      res.json(userTypes);
    } catch (error) {
      logger.error('Error in getUserTypes', {
        error: error.message,
        stack: error.stack,
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        user: req.user ? req.user.user_id : null
      });
      res.status(500).json({ message: error.message });
    }
  },

  getModules: async (req, res) => {
    logger.debug('Starting getModules');
    try {
      const modules = await service.getActiveModules();
      logger.info('getModules completed successfully');
      res.json(modules);
    } catch (error) {
      logger.error('Error in getModules', {
        error: error.message,
        stack: error.stack,
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        user: req.user ? req.user.user_id : null
      });
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
      logger.error('Error in getUserModules', {
        error: error.message,
        stack: error.stack,
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        user: req.user ? req.user.user_id : null
      });
      res.status(500).json({ message: error.message });
    }
  },

  updateUserModules: async (req, res) => {
    logger.debug('Starting updateUserModules');
    try {
      const { id } = req.params;
      const { modules } = req.body;
      if (!Array.isArray(modules)) {
        logger.info('Modules must be an array for updateUserModules');
        return res.status(400).json({ message: 'Modules must be an array of admin_module_ids' });
      }
      await service.updateUserModules(id, modules, req.user.user_id);
      logger.info(`AUDIT: User modules updated for user ID ${id} by user ${req.user.user_id}, modules: ${modules.join(', ')}`);
      logger.info('updateUserModules completed successfully');
      res.json({ message: 'User modules updated successfully' });
    } catch (error) {
      logger.error('Error in updateUserModules', {
        error: error.message,
        stack: error.stack,
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        user: req.user ? req.user.user_id : null
      });
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
      logger.error('Error in getProfile', {
        error: error.message,
        stack: error.stack,
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        user: req.user ? req.user.user_id : null
      });
      res.status(500).json({ message: error.message });
    }
  },

  updateProfile: async (req, res) => {
    logger.debug('Starting updateProfile');
    try {
      const { error } = updateProfileSchema.validate(req.body);
      if (error) {
        logger.info('Validation error in updateProfile:', error.details[0].message);
        return res.status(400).json({ message: error.details[0].message });
      }
      const userId = req.user.user_id;
      const profileData = req.body;
      const user = await service.updateProfile(userId, profileData);
      logger.info(`AUDIT: Profile updated for user ${userId} by user ${req.user.user_id}`);
      logger.info('updateProfile completed successfully');
      res.json(user);
    } catch (error) {
      logger.error('Error in updateProfile', {
        error: error.message,
        stack: error.stack,
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        user: req.user ? req.user.user_id : null
      });
      res.status(500).json({ message: error.message });
    }
  },

  updatePassword: async (req, res) => {
    logger.debug('Starting updatePassword');
    try {
      const { error } = updatePasswordSchema.validate(req.body);
      if (error) {
        logger.info('Validation error in updatePassword:', error.details[0].message);
        return res.status(400).json({ message: error.details[0].message });
      }
      const userId = req.user.user_id;
      const { old_password, new_password, confirm_password } = req.body;
      await service.updatePassword(userId, old_password, new_password, confirm_password);
      logger.info(`AUDIT: Password updated for user ${userId} by user ${req.user.user_id}`);
      logger.info('updatePassword completed successfully');
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      logger.error('Error in updatePassword', {
        error: error.message,
        stack: error.stack,
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        user: req.user ? req.user.user_id : null
      });
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
      logger.error('Error in uploadImage', {
        error: error.message,
        stack: error.stack,
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        user: req.user ? req.user.user_id : null
      });
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
      logger.error('Error in getUserPreferences', {
        error: error.message,
        stack: error.stack,
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        user: req.user ? req.user.user_id : null
      });
      res.status(500).json({ message: error.message });
    }
  },

  updateUserPreferences: async (req, res) => {
    logger.debug('Starting updateUserPreferences');
    try {
      const { error } = updatePreferencesSchema.validate(req.body);
      if (error) {
        logger.info('Validation error in updateUserPreferences:', error.details[0].message);
        return res.status(400).json({ message: error.details[0].message });
      }
      const userId = req.user.user_id;
      const preferencesData = req.body;
      const preferences = await service.updateUserPreferences(userId, preferencesData);
      logger.info(`AUDIT: User preferences updated for user ${userId} by user ${req.user.user_id}`);
      logger.info('updateUserPreferences completed successfully');
      res.json(preferences);
    } catch (error) {
      logger.error('Error in updateUserPreferences', {
        error: error.message,
        stack: error.stack,
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        user: req.user ? req.user.user_id : null
      });
      res.status(500).json({ message: error.message });
    }
  },

  getAllUserTypes: async (req, res) => {
    logger.debug('Starting getAllUserTypes');
    try {
      const userTypes = await service.getAll();
      logger.info('getAllUserTypes completed successfully');
      res.json(userTypes);
    } catch (error) {
      logger.error('Error in getAllUserTypes', {
        error: error.message,
        stack: error.stack,
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        user: req.user ? req.user.user_id : null
      });
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
      logger.error('Error in getUserType', {
        error: error.message,
        stack: error.stack,
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        user: req.user ? req.user.user_id : null
      });
      res.status(500).json({ message: error.message });
    }
  },

  createUserType: async (req, res) => {
    logger.debug('Starting createUserType');
    try {
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
      logger.error('Error in createUserType', {
        error: error.message,
        stack: error.stack,
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        user: req.user ? req.user.user_id : null
      });
      res.status(500).json({ message: error.message });
    }
  },

  updateUserType: async (req, res) => {
    logger.debug('Starting updateUserType');
    try {
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
      logger.error('Error in updateUserType', {
        error: error.message,
        stack: error.stack,
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        user: req.user ? req.user.user_id : null
      });
      res.status(500).json({ message: error.message });
    }
  },

  deleteUserType: async (req, res) => {
    logger.debug('Starting deleteUserType');
    try {
      const { id } = req.params;
      const userType = await service.delete(id);
      if (!userType) {
        logger.info('User type not found for deleteUserType');
        return res.status(404).json({ message: 'User type not found' });
      }
      logger.info('deleteUserType completed successfully');
      res.json({ message: 'User type deleted successfully' });
    } catch (error) {
      logger.error('Error in deleteUserType', {
        error: error.message,
        stack: error.stack,
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        user: req.user ? req.user.user_id : null
      });
      res.status(500).json({ message: error.message });
    }
  },

  getAdminModules: async (req, res) => {
    logger.debug('Starting getAdminModules');
    try {
      const adminModules = await service.getAll();
      logger.info('getAdminModules completed successfully');
      res.json(adminModules);
    } catch (error) {
      logger.error('Error in getAdminModules:', {
        message: error.message,
        stack: error.stack,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
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
      logger.error('Error in getAdminModule:', {
        message: error.message,
        stack: error.stack,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(500).json({ message: error.message });
    }
  },

  createAdminModule: async (req, res) => {
    logger.debug('Starting createAdminModule');
    try {
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
      logger.error('Error in createAdminModule:', {
        message: error.message,
        stack: error.stack,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(500).json({ message: error.message });
    }
  },

  updateAdminModule: async (req, res) => {
    logger.debug('Starting updateAdminModule');
    try {
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
      logger.error('Error in updateAdminModule:', {
        message: error.message,
        stack: error.stack,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(500).json({ message: error.message });
    }
  },

  deleteAdminModule: async (req, res) => {
    logger.debug('Starting deleteAdminModule');
    try {
      const { id } = req.params;
      const adminModule = await service.delete(id);
      if (!adminModule) {
        logger.info('Admin module not found for deleteAdminModule');
        return res.status(404).json({ message: 'Admin module not found' });
      }
      logger.info('deleteAdminModule completed successfully');
      res.json({ message: 'Admin module deleted successfully' });
    } catch (error) {
      logger.error('Error in deleteAdminModule:', {
        message: error.message,
        stack: error.stack,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(500).json({ message: error.message });
    }
  },

  getLogs: async (req, res) => {
    try {
      const { page = 1, limit = 50, level, userId, startDate, endDate } = req.query;
      const logs = await service.getLogs(parseInt(page), parseInt(limit), level, userId ? parseInt(userId) : null, startDate, endDate);
      res.json(logs);
    } catch (error) {
      logger.error(`Failed to get logs: ${error.message}`, {
        stack: error.stack,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getLogLevel: async (req, res) => {
    try {
      const level = await service.getLogLevel();
      res.json({ logLevel: level });
    } catch (error) {
      logger.error(`Failed to get log level: ${error.message}`, {
        stack: error.stack,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  setLogLevel: async (req, res) => {
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
      logger.error(`Failed to set log level: ${error.message}`, {
        stack: error.stack,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  clientError: async (req, res) => {
    const { error } = clientErrorSchema.validate(req.body);
    if (error) {
      logger.warn(`Client error validation failed: ${error.details[0].message}`);
      return res.status(400).json({ message: error.details[0].message });
    }
    try {
      const { level, message, stack, userAgent, url } = req.body;
      await service.logClientError(level, message, stack, userAgent, url);
      logger.info(`Client error logged: ${level} - ${message}`);
      res.status(201).json({ message: 'Client error logged' });
    } catch (error) {
      logger.error(`Failed to log client error: ${error.message}`, {
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