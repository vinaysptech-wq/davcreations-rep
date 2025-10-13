const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

module.exports = (config, logger, model, userAccessModel, refreshTokenModel, permissionService) => ({
  login: async (email, password) => {
    console.log('Service login called for email:', email);
    logger.debug(`SECURITY AUDIT: Login attempt for email: ${email}`);
    console.log('DEBUG: authService.login called with userAccessModel:', !!userAccessModel);

    if (!userAccessModel) {
      logger.error('userAccessModel is undefined in authService');
      console.log('DEBUG: userAccessModel is null, throwing error');
      throw new Error('userAccessModel is not available');
    }

    if (!email || !password) {
      logger.warn(`SECURITY AUDIT: Login failed - missing credentials for email: ${email}`);
      throw new Error('Email and password are required');
    }

    try {
      const user = await model.getByEmail(email);
      if (!user) {
        logger.warn(`SECURITY AUDIT: Login failed - user not found for email: ${email}`);
        throw new Error('Invalid email or password');
      }

      const isPasswordValid = await bcrypt.compare(password, user.user_password);
      if (!isPasswordValid) {
        logger.warn(`SECURITY AUDIT: Login failed - invalid password for email: ${email}`);
        throw new Error('Invalid email or password');
      }

      // Fetch user type name
      const userType = await model.getUserTypeById(user.user_typeid);
      const userTypeName = userType ? userType.user_type_name : 'Unknown';

      // Fetch effective permissions (role + user-specific with inheritance)
      const modulePermissions = await permissionService.getEffectivePermissions(user.user_id, user.user_typeid);

      const token = jwt.sign(
        {
          user_id: user.user_id,
          email: user.email,
          user_typeid: user.user_typeid,
          user_type_name: userTypeName,
          module_permissions: modulePermissions
        },
        config.auth.jwtSecret,
        { expiresIn: config.auth.jwtExpiresIn }
      );

      // Generate refresh token
      const refreshTokenValue = crypto.randomBytes(64).toString('hex');
      const refreshTokenExpiresAt = new Date(Date.now() + require('ms')(config.auth.refreshTokenExpiresIn));

      await refreshTokenModel.createRefreshToken(user.user_id, refreshTokenValue, refreshTokenExpiresAt);

      logger.info(`SECURITY AUDIT: Login successful for user: ${email} (ID: ${user.user_id})`);

      return {
        token,
        refreshToken: refreshTokenValue,
        user: {
          user_id: user.user_id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          user_type_name: userTypeName
        },
        expiresIn: require('ms')(config.auth.jwtExpiresIn) / 1000 // seconds
      };
    } catch (error) {
      console.log('Service login error:', error.message);
      logger.error('Error in authService.login', {
        error: error.message,
        stack: error.stack,
        email
      });
      throw error;
    }
  },

  getEffectivePermissions: async (userId, userTypeId) => {
    logger.debug(`getEffectivePermissions called for user ${userId}, role ${userTypeId}`);

    try {
      const permissions = await permissionService.getEffectivePermissions(userId, userTypeId);
      logger.info(`Retrieved effective permissions for user ${userId}: ${permissions.length} modules`);
      return permissions;
    } catch (error) {
      logger.error('Error in authService.getEffectivePermissions', {
        error: error.message,
        stack: error.stack,
        userId,
        userTypeId
      });
      throw error;
    }
  },

  getPermissionDetails: async (userId, userTypeId) => {
    logger.debug(`getPermissionDetails called for user ${userId}, role ${userTypeId}`);

    try {
      const details = await permissionService.getPermissionDetails(userId, userTypeId);
      logger.info(`Retrieved permission details for user ${userId}`);
      return details;
    } catch (error) {
      logger.error('Error in authService.getPermissionDetails', {
        error: error.message,
        stack: error.stack,
        userId,
        userTypeId
      });
      throw error;
    }
  },

  register: async (userData) => {
    logger.debug(`SECURITY AUDIT: Registration attempt for email: ${userData.email}`);

    try {
      const { first_name, last_name, email, password, user_typeid, address, phone, city, state } = userData;

      // Check if user already exists
      const existingUser = await model.getByEmail(email);
      if (existingUser) {
        logger.warn(`SECURITY AUDIT: Registration failed - user already exists for email: ${email}`);
        throw new Error('User already exists with this email');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await model.createUser({
        first_name,
        last_name,
        email,
        user_password: hashedPassword,
        user_typeid: user_typeid || 2, // Default to regular user
        address,
        phone,
        city,
        state,
      });

      logger.info(`SECURITY AUDIT: User registered successfully: ${email} (ID: ${newUser.user_id})`);

      return {
        user_id: newUser.user_id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        user_type_name: 'User', // Default
      };
    } catch (error) {
      logger.error('Error in authService.register', {
        error: error.message,
        stack: error.stack,
        email: userData.email
      });
      throw error;
    }
  },

  logout: async (userId) => {
    logger.debug(`SECURITY AUDIT: Logout for user ID: ${userId}`);

    try {
      // Revoke all refresh tokens for the user
      await refreshTokenModel.revokeUserTokens(userId);
      logger.info(`SECURITY AUDIT: All refresh tokens revoked for user: ${userId}`);
      return { message: 'Logged out successfully' };
    } catch (error) {
      logger.error('Error in authService.logout', {
        error: error.message,
        stack: error.stack,
        userId
      });
      throw error;
    }
  },

  refresh: async (refreshToken) => {
    logger.debug('SECURITY AUDIT: Token refresh attempt');

    try {
      // Find the refresh token
      const tokenRecord = await refreshTokenModel.getRefreshToken(refreshToken);
      if (!tokenRecord || tokenRecord.is_revoked) {
        logger.warn('SECURITY AUDIT: Invalid or revoked refresh token');
        throw new Error('Invalid refresh token');
      }

      // Check if token is expired
      if (new Date() > tokenRecord.expires_at) {
        logger.warn(`SECURITY AUDIT: Expired refresh token for user: ${tokenRecord.user_id}`);
        throw new Error('Refresh token expired');
      }

      const user = await model.getById(tokenRecord.user_id);
      if (!user) {
        logger.warn(`SECURITY AUDIT: User not found for refresh token: ${tokenRecord.user_id}`);
        throw new Error('User not found');
      }

      // Fetch user type name
      const userType = await model.getUserTypeById(user.user_typeid);
      const userTypeName = userType ? userType.user_type_name : 'Unknown';

      // Fetch effective permissions
      const modulePermissions = await permissionService.getEffectivePermissions(user.user_id, user.user_typeid);

      // Generate new access token
      const newToken = jwt.sign(
        {
          user_id: user.user_id,
          email: user.email,
          user_typeid: user.user_typeid,
          user_type_name: userTypeName,
          module_permissions: modulePermissions
        },
        config.auth.jwtSecret,
        { expiresIn: config.auth.jwtExpiresIn }
      );

      // Generate new refresh token
      const newRefreshTokenValue = crypto.randomBytes(64).toString('hex');
      const newRefreshTokenExpiresAt = new Date(Date.now() + require('ms')(config.auth.refreshTokenExpiresIn));

      // Revoke old refresh token and create new one
      await refreshTokenModel.revokeToken(refreshToken);
      await refreshTokenModel.createRefreshToken(user.user_id, newRefreshTokenValue, newRefreshTokenExpiresAt);

      logger.info(`SECURITY AUDIT: Token refresh successful for user: ${user.email} (ID: ${user.user_id})`);

      return {
        token: newToken,
        refreshToken: newRefreshTokenValue,
        user: {
          user_id: user.user_id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          user_type_name: userTypeName
        },
        expiresIn: require('ms')(config.auth.jwtExpiresIn) / 1000
      };
    } catch (error) {
      logger.error('Error in authService.refresh', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  },
});