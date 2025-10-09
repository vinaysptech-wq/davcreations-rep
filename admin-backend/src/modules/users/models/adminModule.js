const prisma = require('../../../lib/prisma');

const create = async (data) => {
  try {
    const module = await prisma.adminModule.create({
      data: {
        module_name: data.module_name,
        description: data.description,
        is_active: data.is_active !== undefined ? data.is_active : true,
      },
    });
    return module;
  } catch (error) {
    throw new Error(`Failed to create admin module: ${error.message}`);
  }
};

const getAll = async () => {
  try {
    const modules = await prisma.adminModule.findMany({
      orderBy: {
        module_name: 'asc',
      },
    });
    return modules;
  } catch (error) {
    throw new Error(`Failed to get admin modules: ${error.message}`);
  }
};

const getById = async (id) => {
  try {
    const module = await prisma.adminModule.findUnique({
      where: {
        admin_module_id: parseInt(id),
      },
    });
    return module;
  } catch (error) {
    throw new Error(`Failed to get admin module: ${error.message}`);
  }
};

const update = async (id, data) => {
  try {
    const module = await prisma.adminModule.update({
      where: {
        admin_module_id: parseInt(id),
      },
      data: {
        module_name: data.module_name,
        description: data.description,
        is_active: data.is_active,
        last_updated_date: new Date(),
      },
    });
    return module;
  } catch (error) {
    throw new Error(`Failed to update admin module: ${error.message}`);
  }
};

const deleteModule = async (id) => {
  try {
    const module = await prisma.adminModule.update({
      where: {
        admin_module_id: parseInt(id),
      },
      data: {
        is_active: false,
        last_updated_date: new Date(),
      },
    });
    return module;
  } catch (error) {
    throw new Error(`Failed to delete admin module: ${error.message}`);
  }
};

const getActiveModules = async () => {
  try {
    const result = await prisma.adminModule.findMany({
      where: { is_active: true },
      orderBy: {
        module_name: 'asc',
      },
    });
    return result;
  } catch (error) {
    throw new Error(`Failed to get active modules: ${error.message}`);
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  delete: deleteModule,
  getActiveModules,
};