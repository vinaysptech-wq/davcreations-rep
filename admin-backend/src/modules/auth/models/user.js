const prisma = require('../../../lib/prisma');

const getByEmail = async (email) => {
  try {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        user_type: true,
      },
    });
  } catch (error) {
    throw new Error(`Failed to get user by email: ${error.message}`);
  }
};

const getUserTypeById = async (user_type_id) => {
  try {
    return await prisma.userType.findUnique({
      where: { user_type_id: parseInt(user_type_id) },
    });
  } catch (error) {
    throw new Error(`Failed to get user type by ID: ${error.message}`);
  }
};

module.exports = {
  getByEmail,
  getUserTypeById,
};