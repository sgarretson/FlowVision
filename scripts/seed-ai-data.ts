const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting AI feature seed data creation...');

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@flowvision.com' },
    update: {},
    create: {
      email: 'admin@flowvision.com',
      name: 'FlowVision Admin',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      preferences: {
        timezone: 'America/New_York',
        notifications: {
          email: true,
          browser: true,
          aiInsights: true,
        },
        theme: 'light',
      },
    },
  });

  // Create business profile for context
  const businessProfile = await prisma.businessProfile.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      industry: 'Architecture & Engineering',
      size: 100, // Number of employees
      metrics: {
        companyName: 'Morrison Architecture',
        description:
          'Professional architecture firm specializing in commercial and residential projects',
        goals: [
          'Improve client approval workflows',
          'Reduce project timeline delays',
          'Enhance team collaboration',
        ],
        challenges: [
          'Complex approval processes',
          'Communication bottlenecks',
          'Resource allocation',
        ],
        context:
          'Mid-size A&E firm focused on streamlining operations and improving client satisfaction',
      },
    },
  });

  // Create sample issues for AI analysis
  const issues = [
    {
      description:
        'Our current client approval process for design iterations is taking 3-4 weeks per round. Clients receive design proposals via email, often get lost in communication, multiple stakeholders need to coordinate, and we lack a centralized tracking system. This is causing project delays and client frustration. Impact: Delays project timelines by 20-30%, client satisfaction scores dropping.',
      votes: 8,
      heatmapScore: 85,
    },
    {
      description:
        'Project managers struggle to allocate architects and engineers effectively across multiple concurrent projects. We have visibility gaps into individual workloads, skill requirements, and availability. This leads to burnout, missed deadlines, and quality issues. Impact: Team utilization at 60%, 15% project overruns, staff burnout.',
      votes: 6,
      heatmapScore: 72,
    },
    {
      description:
        'Project files are scattered across email, shared drives, and various cloud platforms. Version control is manual and error-prone. Team members waste 2-3 hours daily searching for correct file versions, and we have had instances of presenting outdated designs to clients. Impact: Productivity loss, version control errors, client trust issues.',
      votes: 9,
      heatmapScore: 91,
    },
  ];

  const createdIssues = [];
  for (const issue of issues) {
    const createdIssue = await prisma.issue.create({
      data: issue,
    });
    createdIssues.push(createdIssue);
  }

  // Create sample initiatives for AI enhancement
  const initiatives = [
    {
      title: 'Implement Digital Client Portal',
      problem: 'Client approval process is slow and disorganized',
      goal: 'Create centralized portal for design reviews and approvals',
      phase: 'IDENTIFY',
    },
    {
      title: 'Resource Management Dashboard',
      problem: 'Poor visibility into team capacity and workload',
      goal: 'Build real-time dashboard for resource allocation',
      phase: 'PLAN',
    },
    {
      title: 'Unified File Management System',
      problem: 'Files scattered across multiple platforms',
      goal: 'Centralize all project documentation',
      phase: 'EXECUTE',
    },
  ];

  const createdInitiatives = [];
  for (let i = 0; i < initiatives.length; i++) {
    const initiative = initiatives[i];
    const createdInitiative = await prisma.initiative.create({
      data: {
        ...initiative,
        ownerId: adminUser.id,
        status: 'ACTIVE',
        progress: Math.floor(Math.random() * 30) + 10, // 10-40% progress
        orderIndex: i,
        kpis: [], // Initialize with empty array
      },
    });
    createdInitiatives.push(createdInitiative);
  }

  // Create audit logs for AI usage tracking
  const aiActions = [
    'AI_ISSUE_ANALYSIS',
    'AI_INITIATIVE_RECOMMENDATIONS',
    'AI_INITIATIVE_REQUIREMENTS',
    'OPENAI_CONNECTION_TEST',
  ];

  for (let i = 0; i < 15; i++) {
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: aiActions[Math.floor(Math.random() * aiActions.length)],
        details: {
          tokens: Math.floor(Math.random() * 1000) + 100,
          model: 'gpt-4',
          cost: (Math.random() * 0.05).toFixed(4),
          success: true,
        },
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    });
  }

  console.log('✅ Seed data created successfully!');
  console.log(`👤 Admin user: admin@flowvision.com / admin123`);
  console.log(`🏢 Business profile: ${(businessProfile.metrics as any).companyName}`);
  console.log(`❗ Issues created: ${createdIssues.length}`);
  console.log(`🎯 Initiatives created: ${createdInitiatives.length}`);
  console.log(`📊 AI usage logs: 15 entries`);
}

main()
  .catch((e) => {
    console.error('❌ Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
