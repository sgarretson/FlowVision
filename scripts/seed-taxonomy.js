const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const BUSINESS_AREAS = [
  {
    name: 'Operations',
    description: 'Day-to-day business operations, workflows, and processes',
    type: 'PROCESS',
  },
  {
    name: 'People & Culture',
    description: 'Human resources, team dynamics, and organizational culture',
    type: 'PROCESS',
  },
  {
    name: 'Technology',
    description: 'Software, hardware, and technical infrastructure',
    type: 'PROCESS',
  },
  {
    name: 'Financial',
    description: 'Budget, costs, revenue, and financial management',
    type: 'PROCESS',
  },
  {
    name: 'Strategy',
    description: 'Strategic planning, long-term goals, and business development',
    type: 'PROCESS',
  },
  {
    name: 'Compliance',
    description: 'Regulatory compliance, standards, and governance',
    type: 'PROCESS',
  },
];

const DEPARTMENTS = [
  {
    name: 'Engineering',
    description: 'Engineering and technical teams',
    type: 'PEOPLE',
  },
  {
    name: 'Sales',
    description: 'Sales and business development teams',
    type: 'PEOPLE',
  },
  {
    name: 'Marketing',
    description: 'Marketing and communications teams',
    type: 'PEOPLE',
  },
  {
    name: 'HR',
    description: 'Human resources and people operations',
    type: 'PEOPLE',
  },
  {
    name: 'Finance',
    description: 'Finance and accounting teams',
    type: 'PEOPLE',
  },
  {
    name: 'Operations',
    description: 'Operations and logistics teams',
    type: 'PEOPLE',
  },
  {
    name: 'Leadership',
    description: 'Executive and management teams',
    type: 'PEOPLE',
  },
  {
    name: 'Customer Service',
    description: 'Customer support and service teams',
    type: 'PEOPLE',
  },
  {
    name: 'Legal',
    description: 'Legal and compliance teams',
    type: 'PEOPLE',
  },
  {
    name: 'IT',
    description: 'Information technology and systems teams',
    type: 'PEOPLE',
  },
];

const IMPACT_TYPES = [
  {
    name: 'Productivity Loss',
    description: 'Issues that reduce team or individual productivity',
    type: 'PROCESS',
  },
  {
    name: 'Employee Satisfaction',
    description: 'Issues affecting employee morale and satisfaction',
    type: 'PROCESS',
  },
  {
    name: 'Customer Impact',
    description: 'Issues that affect customer experience or satisfaction',
    type: 'PROCESS',
  },
  {
    name: 'Revenue Impact',
    description: 'Issues that directly affect revenue or sales',
    type: 'PROCESS',
  },
  {
    name: 'Cost Increase',
    description: 'Issues that lead to increased operational costs',
    type: 'PROCESS',
  },
  {
    name: 'Risk/Compliance',
    description: 'Issues that create regulatory or business risks',
    type: 'PROCESS',
  },
  {
    name: 'Quality Issues',
    description: 'Issues affecting product or service quality',
    type: 'PROCESS',
  },
  {
    name: 'Communication Problems',
    description: 'Issues related to internal or external communication',
    type: 'PROCESS',
  },
];

async function seedTaxonomy() {
  console.log('🌱 Seeding taxonomy data...');

  try {
    // Seed business areas
    for (const area of BUSINESS_AREAS) {
      const existing = await prisma.systemCategory.findFirst({
        where: {
          name: area.name,
          type: area.type,
          tags: { has: 'business-area' },
        },
      });

      if (existing) {
        await prisma.systemCategory.update({
          where: { id: existing.id },
          data: {
            description: area.description,
            isActive: true,
            isDefault: true,
          },
        });
      } else {
        await prisma.systemCategory.create({
          data: {
            name: area.name,
            description: area.description,
            type: area.type,
            isActive: true,
            isDefault: true,
            tags: ['business-area'],
          },
        });
      }
      console.log(`✅ Business Area: ${area.name}`);
    }

    // Seed departments
    for (const dept of DEPARTMENTS) {
      const existing = await prisma.systemCategory.findFirst({
        where: {
          name: dept.name,
          type: dept.type,
          tags: { has: 'department' },
        },
      });

      if (existing) {
        await prisma.systemCategory.update({
          where: { id: existing.id },
          data: {
            description: dept.description,
            isActive: true,
            isDefault: true,
          },
        });
      } else {
        await prisma.systemCategory.create({
          data: {
            name: dept.name,
            description: dept.description,
            type: dept.type,
            isActive: true,
            isDefault: true,
            tags: ['department'],
          },
        });
      }
      console.log(`✅ Department: ${dept.name}`);
    }

    // Seed impact types
    for (const impact of IMPACT_TYPES) {
      const existing = await prisma.systemCategory.findFirst({
        where: {
          name: impact.name,
          type: impact.type,
          tags: { has: 'impact-type' },
        },
      });

      if (existing) {
        await prisma.systemCategory.update({
          where: { id: existing.id },
          data: {
            description: impact.description,
            isActive: true,
            isDefault: true,
          },
        });
      } else {
        await prisma.systemCategory.create({
          data: {
            name: impact.name,
            description: impact.description,
            type: impact.type,
            isActive: true,
            isDefault: true,
            tags: ['impact-type'],
          },
        });
      }
      console.log(`✅ Impact Type: ${impact.name}`);
    }

    console.log('✅ Taxonomy data seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed taxonomy data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedTaxonomy()
  .then(() => {
    console.log('🎉 Taxonomy seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Taxonomy seeding failed:', error);
    process.exit(1);
  });
