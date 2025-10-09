const prisma = require('../../../lib/prisma');

const create = async (userTypeData) => {
  try {
    const userType = await prisma.userType.create({
      data: {
        user_type_name: userTypeData.user_type_name,
      },
    });

    return userType;
  } catch (error) {
    throw new Error(`Failed to create user type: ${error.message}`);
  }
};

const getAll = async () => {
  try {
    const userTypes = await prisma.userType.findMany({
      where: {
        is_active: true,
      },
      orderBy: {
        user_type_name: 'asc',
      },
    });

    return userTypes;
  } catch (error) {
    throw new Error(`Failed to get user types: ${error.message}`);
  }
};

const getById = async (id) => {
  try {
    const userType = await prisma.userType.findUnique({
      where: {
        user_type_id: parseInt(id),
        is_active: true,
      },
    });

    return userType;
  } catch (error) {
    throw new Error(`Failed to get user type: ${error.message}`);
  }
};

const update = async (id, userTypeData) => {
  try {
    const updateData = {
      user_type_name: userTypeData.user_type_name,
      last_updated_date: new Date(),
    };

    const userType = await prisma.userType.update({
      where: {
        user_type_id: parseInt(id),
        is_active: true,
      },
      data: updateData,
    });

    return userType;
  } catch (error) {
    throw new Error(`Failed to update user type: ${error.message}`);
  }
};

const deleteUserType = async (id) => {
  try {
    const userType = await prisma.userType.update({
      where: {
        user_type_id: parseInt(id),
        is_active: true,
      },
      data: {
        is_active: false,
        last_updated_date: new Date(),
      },
    });

    return userType;
  } catch (error) {
    throw new Error(`Failed to delete user type: ${error.message}`);
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  delete: deleteUserType,
};