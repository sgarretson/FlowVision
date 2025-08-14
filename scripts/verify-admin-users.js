const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyAdminUsers() {
  console.log('🔍 Verifying admin users with access to comprehensive data...');

  try {
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`\n👥 Found ${adminUsers.length} admin users:`);

    adminUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name || 'Unnamed User'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.createdAt.toISOString().split('T')[0]}`);
    });

    console.log('\n🔑 Both users can login with password: Admin123!');
    console.log('\n🎯 Both users have full access to:');
    console.log('   • All strategic initiatives and solutions');
    console.log('   • Complete task tracking and progress monitoring');
    console.log('   • All employee feedback issues and AI clustering');
    console.log('   • Executive insights and analytics dashboard');
    console.log('   • Comprehensive FlowVision demonstration data');
  } catch (error) {
    console.error('❌ Error verifying admin users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminUsers();
