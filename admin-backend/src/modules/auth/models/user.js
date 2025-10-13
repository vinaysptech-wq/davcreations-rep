const userModel = (db) => {
  const getByEmail = async (email) => {
    try {
      return await db.user.findUnique({
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
      return await db.userType.findUnique({
        where: { user_type_id: parseInt(user_type_id) },
      });
    } catch (error) {
      throw new Error(`Failed to get user type by ID: ${error.message}`);
    }
  };

  const createUser = async (userData) => {
    try {
      return await db.user.create({
        data: userData,
      });
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  };

  const getById = async (userId) => {
    try {
      return await db.user.findUnique({
        where: { user_id: parseInt(userId) },
        include: {
          user_type: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to get user by ID: ${error.message}`);
    }
  };

  return {
    getByEmail,
    getUserTypeById,
    createUser,
    getById,
  };
};

module.exports = userModel;