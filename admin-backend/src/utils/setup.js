require('dotenv').config();
const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const logger = require('./logger');

async function setup() {
  try {
    console.log('Setup script is running');
    logger.info('Starting database setup process...');

    // Test database connection
    try {
      await prisma.$connect();
      logger.info('Database connection successful');
    } catch (dbError) {
      logger.error('Database connection failed:', dbError.message);
      throw new Error(`Database connection failed: ${dbError.message}`);
    }

    // Check if setup already completed
    const existingSuperadmin = await prisma.user.findFirst({ where: { email: process.env.DEFAULT_SUPERADMIN_EMAIL } });
    if (existingSuperadmin) {
      logger.info('Setup already completed, skipping.');
      return;
    }
    // Insert user types
    const userTypes = ['Superadmin', 'Staff', 'Marketing', 'Seller', 'Normal User'];
    await prisma.userType.createMany({
      data: userTypes.map(name => ({ user_type_name: name })),
      skipDuplicates: true,
    });

    // Get Superadmin user_type_id
    const superadminType = await prisma.userType.findFirst({ where: { user_type_name: 'Superadmin' } });
    const superadminTypeId = superadminType.user_type_id;

    // Hash password
    const hashedPassword = await bcrypt.hash(process.env.DEFAULT_SUPERADMIN_PASSWORD, 10);

    // Insert superadmin user
    const superadmin = await prisma.user.upsert({
      where: { email: process.env.DEFAULT_SUPERADMIN_EMAIL },
      update: {},
      create: {
        first_name: process.env.DEFAULT_SUPERADMIN_FIRST_NAME,
        last_name: process.env.DEFAULT_SUPERADMIN_LAST_NAME,
        user_typeid: superadminTypeId,
        address: process.env.DEFAULT_SUPERADMIN_ADDRESS,
        email: process.env.DEFAULT_SUPERADMIN_EMAIL,
        phone: process.env.DEFAULT_SUPERADMIN_PHONE,
        user_password: hashedPassword,
        bank_name: process.env.DEFAULT_SUPERADMIN_BANK_NAME,
        bank_ifsc_code: process.env.DEFAULT_SUPERADMIN_BANK_IFSC,
        bank_account_number: process.env.DEFAULT_SUPERADMIN_BANK_ACCOUNT,
        bank_address: process.env.DEFAULT_SUPERADMIN_BANK_ADDRESS,
        is_active: true,
      },
    });

    // Insert admin modules with URL slugs
    let userModule = await prisma.adminModules.findFirst({ where: { module_name: 'Users' } });
    if (!userModule) {
      userModule = await prisma.adminModules.create({
        data: {
          module_name: 'Users',
          url_slug: 'users',
          short_description: 'User management',
          category: 'Admin',
          is_active: true,
        },
      });
    } else if (!userModule.url_slug) {
      // Update existing module if url_slug is missing
      userModule = await prisma.adminModules.update({
        where: { admin_module_id: userModule.admin_module_id },
        data: { url_slug: 'users' },
      });
    }

    let adminModulesModule = await prisma.adminModules.findFirst({ where: { module_name: 'Admin Modules' } });
    if (!adminModulesModule) {
      adminModulesModule = await prisma.adminModules.create({
        data: {
          module_name: 'Admin Modules',
          url_slug: 'modules',
          short_description: 'Admin modules management',
          category: 'Admin',
          is_active: true,
        },
      });
    } else if (!adminModulesModule.url_slug) {
      // Update existing module if url_slug is missing
      adminModulesModule = await prisma.adminModules.update({
        where: { admin_module_id: adminModulesModule.admin_module_id },
        data: { url_slug: 'modules' },
      });
    }

    // Insert user_access for superadmin
    const existingAccess = await prisma.userAccess.findFirst({
      where: {
        user_id: superadmin.user_id,
        admin_module_id: userModule.admin_module_id,
      },
    });
    if (!existingAccess) {
      await prisma.userAccess.create({
        data: {
          user_id: superadmin.user_id,
          admin_module_id: userModule.admin_module_id,
          created_by: superadmin.user_id,
          is_active: true,
        },
      });
    }

    logger.info('Database setup completed successfully.');
  } catch (error) {
    logger.error('Error during setup:', error);
  } finally {
    if (prisma && typeof prisma.$disconnect === 'function') {
      await prisma.$disconnect();
    }
  }
}

module.exports = setup;