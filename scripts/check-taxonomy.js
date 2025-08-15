const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTaxonomy() {
  try {
    console.log('🔍 Checking Taxonomy in Database...\n');

    // Check business areas
    const businessAreas = await prisma.systemCategory.findMany({
      where: {
        type: 'PROCESS',
        isActive: true,
        tags: { has: 'business-area' },
      },
      select: { id: true, name: true, description: true, tags: true },
      orderBy: { name: 'asc' },
    });

    console.log('📊 Business Areas Found:', businessAreas.length);
    businessAreas.forEach((area) => {
      console.log(`  - ${area.name} (tags: ${area.tags.join(', ')})`);
    });

    // Check departments
    const departments = await prisma.systemCategory.findMany({
      where: {
        type: 'PEOPLE',
        isActive: true,
        tags: { has: 'department' },
      },
      select: { id: true, name: true, description: true, tags: true },
      orderBy: { name: 'asc' },
    });

    console.log('\n👥 Departments Found:', departments.length);
    departments.forEach((dept) => {
      console.log(`  - ${dept.name} (tags: ${dept.tags.join(', ')})`);
    });

    // Check impact types
    const impactTypes = await prisma.systemCategory.findMany({
      where: {
        type: 'PROCESS',
        isActive: true,
        tags: { has: 'impact-type' },
      },
      select: { id: true, name: true, description: true, tags: true },
      orderBy: { name: 'asc' },
    });

    console.log('\n⚡ Impact Types Found:', impactTypes.length);
    impactTypes.forEach((impact) => {
      console.log(`  - ${impact.name} (tags: ${impact.tags.join(', ')})`);
    });

    // Check total categories
    const totalCategories = await prisma.systemCategory.count({
      where: { isActive: true },
    });

    console.log(`\n📈 Total Active Categories: ${totalCategories}`);
  } catch (error) {
    console.error('❌ Error checking taxonomy:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTaxonomy();
