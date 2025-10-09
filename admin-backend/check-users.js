require('dotenv').config({ path: './.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Checking users in the database...');

    // Query all users
    const users = await prisma.user.findMany({
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        created_date: true,
        is_active: true,
        user_type: {
          select: {
            user_type_name: true,
          },
        },
      },
    });

    const userCount = users.length;
    console.log(`Total number of users found: ${userCount}`);

    // Check for superadmin
    const superadminEmail = process.env.DEFAULT_SUPERADMIN_EMAIL || 'superadmin@example.com';
    const superadmin = users.find(user => user.email === superadminEmail);

    if (superadmin) {
      console.log('Superadmin user found:');
      console.log(`- User ID: ${superadmin.user_id}`);
      console.log(`- Name: ${superadmin.first_name} ${superadmin.last_name}`);
      console.log(`- Email: ${superadmin.email}`);
      console.log(`- Phone: ${superadmin.phone || 'N/A'}`);
      console.log(`- User Type: ${superadmin.user_type.user_type_name}`);
      console.log(`- Created Date: ${superadmin.created_date}`);
      console.log(`- Is Active: ${superadmin.is_active}`);
    } else {
      console.log(`Superadmin user with email '${superadminEmail}' not found.`);
    }

    if (userCount > 0) {
      console.log('\nAll users:');
      users.forEach(user => {
        console.log(`- ${user.first_name} ${user.last_name} (${user.email}) - ${user.user_type.user_type_name}`);
      });
    }

  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();