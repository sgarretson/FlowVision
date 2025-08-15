import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const BUSINESS_AREAS = [
  {
    name: 'Operations',
    description: 'Day-to-day business operations, workflows, and processes',
    type: 'PROCESS' as const,
  },
  {
    name: 'People & Culture',
    description: 'Human resources, team dynamics, and organizational culture',
    type: 'PROCESS' as const,
  },
  {
    name: 'Technology',
    description: 'Software, hardware, and technical infrastructure',
    type: 'PROCESS' as const,
  },
  {
    name: 'Financial',
    description: 'Budget, costs, revenue, and financial management',
    type: 'PROCESS' as const,
  },
  {
    name: 'Strategy',
    description: 'Strategic planning, long-term goals, and business development',
    type: 'PROCESS' as const,
  },
  {
    name: 'Compliance',
    description: 'Regulatory compliance, standards, and governance',
    type: 'PROCESS' as const,
  },
];

export const DEPARTMENTS = [
  {
    name: 'Engineering',
    description: 'Engineering and technical teams',
    type: 'PEOPLE' as const,
  },
  {
    name: 'Sales',
    description: 'Sales and business development teams',
    type: 'PEOPLE' as const,
  },
  {
    name: 'Marketing',
    description: 'Marketing and communications teams',
    type: 'PEOPLE' as const,
  },
  {
    name: 'HR',
    description: 'Human resources and people operations',
    type: 'PEOPLE' as const,
  },
  {
    name: 'Finance',
    description: 'Finance and accounting teams',
    type: 'PEOPLE' as const,
  },
  {
    name: 'Operations',
    description: 'Operations and logistics teams',
    type: 'PEOPLE' as const,
  },
  {
    name: 'Leadership',
    description: 'Executive and management teams',
    type: 'PEOPLE' as const,
  },
  {
    name: 'Customer Service',
    description: 'Customer support and service teams',
    type: 'PEOPLE' as const,
  },
  {
    name: 'Legal',
    description: 'Legal and compliance teams',
    type: 'PEOPLE' as const,
  },
  {
    name: 'IT',
    description: 'Information technology and systems teams',
    type: 'PEOPLE' as const,
  },
];

export const IMPACT_TYPES = [
  {
    name: 'Productivity Loss',
    description: 'Issues that reduce team or individual productivity',
    type: 'PROCESS' as const,
  },
  {
    name: 'Employee Satisfaction',
    description: 'Issues affecting employee morale and satisfaction',
    type: 'PROCESS' as const,
  },
  {
    name: 'Customer Impact',
    description: 'Issues that affect customer experience or satisfaction',
    type: 'PROCESS' as const,
  },
  {
    name: 'Revenue Impact',
    description: 'Issues that directly affect revenue or sales',
    type: 'PROCESS' as const,
  },
  {
    name: 'Cost Increase',
    description: 'Issues that lead to increased operational costs',
    type: 'PROCESS' as const,
  },
  {
    name: 'Risk/Compliance',
    description: 'Issues that create regulatory or business risks',
    type: 'PROCESS' as const,
  },
  {
    name: 'Quality Issues',
    description: 'Issues affecting product or service quality',
    type: 'PROCESS' as const,
  },
  {
    name: 'Communication Problems',
    description: 'Issues related to internal or external communication',
    type: 'PROCESS' as const,
  },
];

export async function seedTaxonomy(): Promise<void> {
  console.log('🌱 Seeding taxonomy data...');

  try {
    // Seed business areas
    for (const area of BUSINESS_AREAS) {
      await prisma.systemCategory.upsert({
        where: {
          name_type_organizationId: {
            name: area.name,
            type: area.type,
            organizationId: null,
          },
        },
        update: {
          description: area.description,
          isActive: true,
          isDefault: true,
        },
        create: {
          name: area.name,
          description: area.description,
          type: area.type,
          isActive: true,
          isDefault: true,
          tags: ['business-area'],
        },
      });
    }

    // Seed departments
    for (const dept of DEPARTMENTS) {
      await prisma.systemCategory.upsert({
        where: {
          name_type_organizationId: {
            name: dept.name,
            type: dept.type,
            organizationId: null,
          },
        },
        update: {
          description: dept.description,
          isActive: true,
          isDefault: true,
        },
        create: {
          name: dept.name,
          description: dept.description,
          type: dept.type,
          isActive: true,
          isDefault: true,
          tags: ['department'],
        },
      });
    }

    // Seed impact types
    for (const impact of IMPACT_TYPES) {
      await prisma.systemCategory.upsert({
        where: {
          name_type_organizationId: {
            name: impact.name,
            type: impact.type,
            organizationId: null,
          },
        },
        update: {
          description: impact.description,
          isActive: true,
          isDefault: true,
        },
        create: {
          name: impact.name,
          description: impact.description,
          type: impact.type,
          isActive: true,
          isDefault: true,
          tags: ['impact-type'],
        },
      });
    }

    console.log('✅ Taxonomy data seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed taxonomy data:', error);
    throw error;
  }
}

export default seedTaxonomy;
