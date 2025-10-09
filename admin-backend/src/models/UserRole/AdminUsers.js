const prisma = require('../../lib/prisma');
const bcrypt = require('bcryptjs');

const createUser = async (userData) => {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.user_password, 10);

    const user = await prisma.user.create({
      data: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        user_typeid: userData.user_type_id,
        address: userData.address,
        city: userData.city,
        state: userData.state,
        email: userData.email,
        phone: userData.phone,
        user_password: hashedPassword,
        bank_name: userData.bank_name,
        bank_ifsc_code: userData.bank_ifsc_code,
        bank_account_number: userData.bank_account_number,
        bank_address: userData.bank_address,
        is_active: userData.is_active !== undefined ? userData.is_active : true,
      },
      include: {
        user_type: true,
      },
    });

    return user;
  } catch (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }
};

const getAllUsers = async (page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone: true,
          created_date: true,
          last_updated_date: true,
          is_active: true,
          user_type: {
            select: {
              user_type_name: true,
            },
          },
        },
        where: {
          is_active: true,
        },
        orderBy: {
          created_date: 'desc',
        },
      }),
      prisma.user.count({
        where: {
          is_active: true,
        },
      }),
    ]);

    return { users, total };
  } catch (error) {
    throw new Error(`Failed to get users: ${error.message}`);
  }
};

const getUserById = async (id) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        user_id: parseInt(id),
        is_active: true,
      },
      include: {
        user_type: true,
      },
    });

    return user;
  } catch (error) {
    throw new Error(`Failed to get user: ${error.message}`);
  }
};

const updateUser = async (id, userData) => {
  try {
    const updateData = {
      first_name: userData.first_name,
      last_name: userData.last_name,
      user_typeid: userData.user_type_id,
      address: userData.address,
      city: userData.city,
      state: userData.state,
      email: userData.email,
      phone: userData.phone,
      bank_name: userData.bank_name,
      bank_ifsc_code: userData.bank_ifsc_code,
      bank_account_number: userData.bank_account_number,
      bank_address: userData.bank_address,
      is_active: userData.is_active,
      last_updated_date: new Date(),
    };

    // Only update password if provided
    if (userData.user_password) {
      updateData.user_password = await bcrypt.hash(userData.user_password, 10);
    }

    const user = await prisma.user.update({
      where: {
        user_id: parseInt(id),
        is_active: true,
      },
      data: updateData,
      include: {
        user_type: true,
      },
    });

    return user;
  } catch (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
};

const deleteUser = async (id) => {
  try {
    const user = await prisma.user.update({
      where: {
        user_id: parseInt(id),
        is_active: true,
      },
      data: {
        is_active: false,
        last_updated_date: new Date(),
      },
    });

    return user;
  } catch (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
};

const getUserTypes = async () => {
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

const getActiveModules = async () => {
  try {
    const modules = await prisma.adminModule.findMany({
      where: {
        is_active: true,
      },
      orderBy: {
        module_name: 'asc',
      },
    });

    return modules;
  } catch (error) {
    throw new Error(`Failed to get active modules: ${error.message}`);
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserTypes,
  getActiveModules,
};