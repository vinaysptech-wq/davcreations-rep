const prisma = require('../../../lib/prisma');

const create = async (adminModuleData) => {
  try {
    const adminModule = await prisma.AdminModules.create({
      data: {
        module_name: adminModuleData.module_name,
        parent_id: adminModuleData.parent_id,
        url_slug: adminModuleData.url_slug,
        is_active: adminModuleData.is_active !== undefined ? adminModuleData.is_active : true,
        user_id: adminModuleData.user_id,
      },
    });

    return adminModule;
  } catch (error) {
    throw new Error(`Failed to create admin module: ${error.message}`);
  }
};

const getAll = async () => {
  try {
    const adminModules = await prisma.AdminModules.findMany({
      select: {
        admin_module_id: true,
        module_name: true,
        created_date: true,
        last_updated_date: true,
        is_active: true,
      },
      where: {
        is_active: true,
      },
      orderBy: {
        module_name: 'asc',
      },
    });

    return adminModules;
  } catch (error) {
    throw new Error(`Failed to get admin modules: ${error.message}`);
  }
};

const getById = async (id) => {
  try {
    const adminModule = await prisma.AdminModules.findUnique({
      where: {
        admin_module_id: parseInt(id),
        is_active: true,
      },
    });

    return adminModule;
  } catch (error) {
    throw new Error(`Failed to get admin module: ${error.message}`);
  }
};

const update = async (id, adminModuleData) => {
  try {
    const updateData = {
      module_name: adminModuleData.module_name,
      parent_id: adminModuleData.parent_id,
      url_slug: adminModuleData.url_slug,
      is_active: adminModuleData.is_active,
      user_id: adminModuleData.user_id,
      last_updated_date: new Date(),
    };

    const adminModule = await prisma.AdminModules.update({
      where: {
        admin_module_id: parseInt(id),
        is_active: true,
      },
      data: updateData,
    });

    return adminModule;
  } catch (error) {
    throw new Error(`Failed to update admin module: ${error.message}`);
  }
};

const deleteAdminModule = async (id) => {
  try {
    const adminModule = await prisma.AdminModules.update({
      where: {
        admin_module_id: parseInt(id),
        is_active: true,
      },
      data: {
        is_active: false,
        last_updated_date: new Date(),
      },
    });

    return adminModule;
  } catch (error) {
    throw new Error(`Failed to delete admin module: ${error.message}`);
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  delete: deleteAdminModule,
};