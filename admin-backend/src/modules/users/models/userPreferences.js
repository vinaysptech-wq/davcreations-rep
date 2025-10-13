const prisma = require('../../../lib/prisma');
const logger = require('../../../utils/logger');

const getUserPreferences = async (userId) => {
  try {
    let preferences = await prisma.userPreferences.findUnique({
      where: { user_id: parseInt(userId) },
    });

    // If no preferences exist, create default ones
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: {
          user_id: parseInt(userId),
          theme: 'light',
          language: 'en',
          email_notifications: true,
          push_notifications: false,
        },
      });
    }

    return {
      theme: preferences.theme,
      language: preferences.language,
      email_notifications: preferences.email_notifications,
      push_notifications: preferences.push_notifications,
    };
  } catch (error) {
    logger.error('Error in getUserPreferences:', error.message);
    throw new Error(`Failed to get user preferences: ${error.message}`);
  }
};

const updateUserPreferences = async (userId, preferencesData) => {
  try {
    const updatedPreferences = await prisma.userPreferences.upsert({
      where: { user_id: parseInt(userId) },
      update: {
        theme: preferencesData.theme,
        language: preferencesData.language,
        email_notifications: preferencesData.email_notifications,
        push_notifications: preferencesData.push_notifications,
        last_updated_date: new Date(),
      },
      create: {
        user_id: parseInt(userId),
        theme: preferencesData.theme || 'light',
        language: preferencesData.language || 'en',
        email_notifications: preferencesData.email_notifications !== undefined ? preferencesData.email_notifications : true,
        push_notifications: preferencesData.push_notifications !== undefined ? preferencesData.push_notifications : false,
      },
    });

    return {
      theme: updatedPreferences.theme,
      language: updatedPreferences.language,
      email_notifications: updatedPreferences.email_notifications,
      push_notifications: updatedPreferences.push_notifications,
    };
  } catch (error) {
    logger.error('Error in updateUserPreferences:', error.message);
    throw new Error(`Failed to update user preferences: ${error.message}`);
  }
};

module.exports = {
  getUserPreferences,
  updateUserPreferences,
};