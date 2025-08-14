const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function updateUserToAdmin() {
  console.log('🔄 Updating david.morrison@morrisonae.com to admin access...');

  try {
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: 'david.morrison@morrisonae.com' },
    });

    if (user) {
      // Update existing user to admin
      user = await prisma.user.update({
        where: { email: 'david.morrison@morrisonae.com' },
        data: {
          role: 'ADMIN',
          name: 'David Morrison',
        },
      });
      console.log('✅ Updated existing user to admin role');
    } else {
      // Create new admin user
      user = await prisma.user.create({
        data: {
          email: 'david.morrison@morrisonae.com',
          passwordHash: await bcrypt.hash('Admin123!', 10),
          role: 'ADMIN',
          name: 'David Morrison',
        },
      });
      console.log('✅ Created new admin user');
    }

    console.log('\n👤 User Details:');
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  ID: ${user.id}`);

    console.log('\n🔑 Admin Access Credentials:');
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: Admin123!`);
    console.log('\n🎯 This user can now access ALL comprehensive demo data:');
    console.log('  • All 4 strategic initiatives');
    console.log('  • All 9 solutions across initiatives');
    console.log('  • All 40 detailed tasks');
    console.log('  • All 42 employee feedback issues');
    console.log('  • All 7 strategic issue clusters');
    console.log('  • Complete AI analysis and insights');
  } catch (error) {
    console.error('❌ Error updating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserToAdmin();
