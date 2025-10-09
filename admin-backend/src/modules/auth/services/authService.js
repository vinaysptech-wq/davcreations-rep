const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

module.exports = (config, logger, model, userAccessModel, refreshTokenModel) => ({
  login: async (email, password) => {
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

      // Fetch user module permissions
      const userAccess = await userAccessModel.getModulesByUserId(user.user_id);
      const modulePermissions = userAccess.map(access => access.admin_module_id);

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
      logger.error('Error in authService.login', {
        error: error.message,
        stack: error.stack,
        email
      });
      throw error;
    }
  },
});