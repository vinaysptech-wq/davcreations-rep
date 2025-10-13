const { createValidationErrorResponse } = require('../../../utils/validationErrorHandler');
const { loginSchema, registerSchema } = require('../../../utils/validationSchemas');

module.exports = (service, logger) => ({
  /**
   * Handles user login authentication
   * Validates credentials, creates session token, and sets HTTP-only cookie
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body containing login credentials
   * @param {string} req.body.email - User's email address
   * @param {string} req.body.password - User's password
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Sends JSON response with token and user data on success
   */
  login: async (req, res) => {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      logger.warn(`Login validation failed: ${error.details[0].message}`);
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = req.body;

    logger.debug(`Login attempt for email: ${email}`);

    try {
      const result = await service.login(email, password);
      logger.info(`Login successful for user: ${email}`);
      res.cookie('authToken', result.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
      res.json({
        token: result.token,
        user: result.user,
        message: 'Login successful'
      });
    } catch (error) {
      logger.error(`Login failed for email: ${email}, error: ${error.message}`);
      if (error.message === 'Invalid email or password') {
        res.status(401).json({ message: error.message });
      } else {
        res.status(500).json({ message: error.message });
      }
    }
  },

  /**
   * Retrieves effective permissions for the authenticated user
   * Combines role-based and user-specific permissions
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object from middleware
   * @param {string} req.user.user_id - User's unique identifier
   * @param {string} req.user.user_typeid - User's type/role identifier
   * @param {Object} res - Express response object
   * @returns {Promise<void>} JSON response with user permissions data
   */
  getEffectivePermissions: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const userTypeId = req.user.user_typeid;

      logger.debug(`Getting effective permissions for user ${userId}`);

      const permissions = await service.getEffectivePermissions(userId, userTypeId);

      res.json({
        success: true,
        data: {
          userId,
          userTypeId,
          permissions,
          totalModules: permissions.length
        }
      });
    } catch (error) {
      logger.error(`Error getting effective permissions: ${error.message}`);
      res.status(500).json({ message: 'Failed to get effective permissions', error: error.message });
    }
  },

  /**
   * Retrieves detailed permission information for the authenticated user
   * Includes both role permissions and user-specific overrides
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object from middleware
   * @param {string} req.user.user_id - User's unique identifier
   * @param {string} req.user.user_typeid - User's type/role identifier
   * @param {Object} res - Express response object
   * @returns {Promise<void>} JSON response with detailed permission breakdown
   */
  getPermissionDetails: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const userTypeId = req.user.user_typeid;

      logger.debug(`Getting permission details for user ${userId}`);

      const details = await service.getPermissionDetails(userId, userTypeId);

      res.json({
        success: true,
        data: details
      });
    } catch (error) {
      logger.error(`Error getting permission details: ${error.message}`);
      res.status(500).json({ message: 'Failed to get permission details', error: error.message });
    }
  },

  /**
   * Handles user registration for new accounts
   * Validates input data and creates a new user in the system
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body containing user registration data
   * @param {Object} res - Express response object
   * @returns {Promise<void>} JSON response with created user data on success
   */
  register: async (req, res) => {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      logger.warn(`Registration validation failed: ${error.details[0].message}`);
      return res.status(400).json(createValidationErrorResponse(error));
    }

    try {
      const userData = req.body;
      const result = await service.register(userData);
      logger.info(`User registered successfully: ${userData.email}`);
      res.status(201).json(result);
    } catch (error) {
      logger.error(`Registration failed for email: ${req.body.email}, error: ${error.message}`);
      res.status(400).json({ message: error.message });
    }
  },

  /**
   * Handles user logout by clearing authentication tokens
   * Invalidates the current session and clears auth cookies
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user object from middleware (optional)
   * @param {Object} res - Express response object
   * @returns {Promise<void>} JSON response confirming logout
   */
  logout: async (req, res) => {
    try {
      const userId = req.user?.user_id;
      if (userId) {
        await service.logout(userId);
        logger.info(`User logged out: ${userId}`);
      }
      res.clearCookie('authToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
      res.json({ message: 'Logout successful' });
    } catch (error) {
      logger.error(`Logout failed for user: ${req.user?.user_id}, error: ${error.message}`);
      res.status(500).json({ message: 'Logout failed' });
    }
  },

  /**
   * Handles token refresh using a valid refresh token
   * Generates new access token without requiring re-authentication
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body containing refresh token
   * @param {string} req.body.refreshToken - Valid refresh token
   * @param {Object} res - Express response object
   * @returns {Promise<void>} JSON response with new token data on success
   */
  refresh: async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      logger.warn('Refresh token missing in request');
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    try {
      const result = await service.refresh(refreshToken);
      logger.info(`Token refresh successful for user: ${result.user.email}`);
      res.json(result);
    } catch (error) {
      logger.error(`Token refresh failed: ${error.message}`);
      res.status(401).json({ message: error.message });
    }
  },
});