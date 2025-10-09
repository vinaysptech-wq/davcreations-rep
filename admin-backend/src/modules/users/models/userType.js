const prisma = require('../../../lib/prisma');

const getAll = async () => {
  try {
    const result = await prisma.userType.findMany({
      where: {
        is_active: true,
      },
      orderBy: {
        user_type_name: 'asc',
      },
    });
    return result;
  } catch (error) {
    throw new Error(`Failed to get user types: ${error.message}`);
  }
};

module.exports = {
  getAll,
};