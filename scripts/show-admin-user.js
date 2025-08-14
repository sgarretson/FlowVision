const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showAdminUser() {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (adminUser) {
      console.log('👤 Admin User Details:');
      console.log(`  Email: ${adminUser.email}`);
      console.log(`  Name: ${adminUser.name}`);
      console.log(`  Role: ${adminUser.role}`);
      console.log(`  ID: ${adminUser.id}`);
      console.log('\n🔑 Credentials for login:');
      console.log(`  Email: ${adminUser.email}`);
      console.log(`  Password: Admin123!`);
    } else {
      console.log('❌ No admin user found');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showAdminUser();
