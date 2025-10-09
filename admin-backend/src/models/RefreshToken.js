const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');
const db = require('../lib/prisma');

module.exports = {
  createRefreshToken: async (userId, token, expiresAt) => {
    try {
      const hashedToken = await bcrypt.hash(token, 12);
      const refreshToken = await db.refreshToken.create({
        data: {
          user_id: userId,
          token: hashedToken,
          expires_at: expiresAt,
        },
      });
      return refreshToken;
    } catch (error) {
      logger.error('Error in refreshTokenModel.createRefreshToken', {
        error: error.message,
        stack: error.stack,
        userId,
      });
      throw error;
    }
  },

  findRefreshToken: async (token) => {
    try {
      const tokens = await db.refreshToken.findMany({
        where: {
          is_revoked: false,
          expires_at: {
            gt: new Date(),
          },
        },
      });

      for (const t of tokens) {
        const isMatch = await bcrypt.compare(token, t.token);
        if (isMatch) {
          return t;
        }
      }
      return null;
    } catch (error) {
      logger.error('Error in refreshTokenModel.findRefreshToken', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  },

  revokeRefreshToken: async (token) => {
    try {
      // Find the token first
      const refreshToken = await this.findRefreshToken(token);
      if (!refreshToken) {
        return false;
      }

      await db.refreshToken.update({
        where: { refresh_token_id: refreshToken.refresh_token_id },
        data: { is_revoked: true },
      });
      return true;
    } catch (error) {
      logger.error('Error in refreshTokenModel.revokeRefreshToken', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  },

  revokeAllUserTokens: async (userId) => {
    try {
      await db.refreshToken.updateMany({
        where: { user_id: userId },
        data: { is_revoked: true },
      });
      return true;
    } catch (error) {
      logger.error('Error in refreshTokenModel.revokeAllUserTokens', {
        error: error.message,
        stack: error.stack,
        userId,
      });
      throw error;
    }
  },

  rotateRefreshToken: async (oldToken, newToken, newExpiresAt) => {
    try {
      const refreshToken = await this.findRefreshToken(oldToken);
      if (!refreshToken) {
        return null;
      }

      const hashedNewToken = await bcrypt.hash(newToken, 12);

      const updatedToken = await db.refreshToken.update({
        where: { refresh_token_id: refreshToken.refresh_token_id },
        data: {
          token: hashedNewToken,
          expires_at: newExpiresAt,
          is_revoked: false,
        },
      });
      return updatedToken;
    } catch (error) {
      logger.error('Error in refreshTokenModel.rotateRefreshToken', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  },
};