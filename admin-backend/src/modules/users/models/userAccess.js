const prisma = require('../../../lib/prisma');

const getModulesByUserId = async (userId) => {
  try {
    const userAccessRecords = await prisma.userAccess.findMany({
      where: {
        user_id: parseInt(userId),
        is_active: true,
      },
      include: {
        admin_module: true,
      },
    });

    return userAccessRecords;
  } catch (error) {
    throw new Error(`Failed to get modules by user ID: ${error.message}`);
  }
};

const updateUserModules = async (userId, moduleIds, createdBy) => {
  try {
    await prisma.$transaction(async (prisma) => {
      // Soft delete existing user access records
      await prisma.userAccess.updateMany({
        where: {
          user_id: parseInt(userId),
          is_active: true,
        },
        data: {
          is_active: false,
          last_updated_date: new Date(),
        },
      });

      // Create new user access records
      const newAccessRecords = moduleIds.map(moduleId => ({
        user_id: parseInt(userId),
        admin_module_id: parseInt(moduleId),
        created_by: parseInt(createdBy),
      }));

      await prisma.userAccess.createMany({
        data: newAccessRecords,
      });
    });
  } catch (error) {
    throw new Error(`Failed to update user modules: ${error.message}`);
  }
};

module.exports = {
  getModulesByUserId,
  updateUserModules,
};