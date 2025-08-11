const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('💡 Adding ideas, teams, and additional workflow data...');

  // Get all users and initiatives
  const users = await prisma.user.findMany();
  const initiatives = await prisma.initiative.findMany();

  // Map users by department
  const usersByDept = {
    Leadership: users.find((u) => u.preferences?.department === 'Leadership'),
    Executive: users.find((u) => u.preferences?.department === 'Executive'),
    'Project Management': users.find((u) => u.preferences?.department === 'Project Management'),
    Design: users.find((u) => u.preferences?.department === 'Design'),
    Engineering: users.find((u) => u.preferences?.department === 'Engineering'),
    Operations: users.find((u) => u.preferences?.department === 'Operations'),
  };

  // Create teams for resource management
  const teams = [
    {
      name: 'Architecture Design Team',
      department: 'Design',
      capacity: 160, // 4 architects * 40 hours
      skills: ['Architectural Design', 'AutoCAD', 'Revit', 'SketchUp', 'Rendering', 'Code Review'],
    },
    {
      name: 'Structural Engineering',
      department: 'Engineering',
      capacity: 120, // 3 engineers * 40 hours
      skills: [
        'Structural Analysis',
        'ETABS',
        'SAP2000',
        'Steel Design',
        'Concrete Design',
        'Seismic Design',
      ],
    },
    {
      name: 'MEP Engineering',
      department: 'Engineering',
      capacity: 80, // 2 engineers * 40 hours
      skills: [
        'HVAC Design',
        'Electrical Systems',
        'Plumbing Design',
        'AutoCAD MEP',
        'Energy Modeling',
      ],
    },
    {
      name: 'Project Management Office',
      department: 'Project Management',
      capacity: 200, // 5 PMs * 40 hours
      skills: [
        'Project Coordination',
        'Scheduling',
        'Budget Management',
        'Client Relations',
        'Quality Control',
      ],
    },
    {
      name: 'Interior Design',
      department: 'Design',
      capacity: 80, // 2 designers * 40 hours
      skills: [
        'Space Planning',
        'Material Selection',
        'FF&E Specification',
        '3D Visualization',
        'Color Theory',
      ],
    },
  ];

  const createdTeams = [];
  for (const teamData of teams) {
    const team = await prisma.team.create({
      data: teamData,
    });
    createdTeams.push(team);
  }

  // Create ideas that could become future initiatives
  const ideas = [
    {
      title: 'Virtual Reality Client Presentations',
      description:
        'Implement VR technology for immersive client presentations of architectural designs. This would allow clients to walk through spaces before construction and make more informed decisions about design changes.',
      authorDept: 'Design',
      category: 'technology',
      priority: 'medium',
      status: 'idea',
      tags: ['VR', 'client-experience', 'presentations', 'technology'],
    },
    {
      title: 'Automated Building Code Checker',
      description:
        'Develop AI-powered system to automatically check designs against current building codes and zoning requirements. This would catch compliance issues early and reduce review cycles.',
      authorDept: 'Engineering',
      category: 'process',
      priority: 'high',
      status: 'reviewing',
      tags: ['automation', 'compliance', 'AI', 'efficiency'],
    },
    {
      title: 'Sustainable Design Scoring System',
      description:
        'Create automated scoring system for design sustainability that tracks LEED points, energy efficiency, and environmental impact in real-time during the design process.',
      authorDept: 'Design',
      category: 'strategy',
      priority: 'medium',
      status: 'approved',
      tags: ['sustainability', 'LEED', 'environmental', 'scoring'],
    },
    {
      title: 'Client Portal Mobile App',
      description:
        'Develop mobile application for clients to review designs, approve changes, and communicate with project teams from their smartphones and tablets.',
      authorDept: 'Operations',
      category: 'technology',
      priority: 'high',
      status: 'idea',
      tags: ['mobile', 'client-portal', 'communication', 'accessibility'],
    },
    {
      title: 'Integrated Project Delivery (IPD) Workflow',
      description:
        'Implement IPD methodology to improve collaboration between architects, engineers, and contractors from project inception through completion.',
      authorDept: 'Project Management',
      category: 'process',
      priority: 'high',
      status: 'reviewing',
      tags: ['IPD', 'collaboration', 'workflow', 'integration'],
    },
    {
      title: 'Drone Site Survey Integration',
      description:
        'Use drone technology for site surveys and progress monitoring, integrating aerial photography and 3D mapping into our design workflow.',
      authorDept: 'Engineering',
      category: 'technology',
      priority: 'low',
      status: 'idea',
      tags: ['drones', 'surveying', '3D-mapping', 'monitoring'],
    },
    {
      title: 'Knowledge Base Search System',
      description:
        'Create intelligent search system for internal knowledge base that can find relevant project details, lessons learned, and best practices using natural language queries.',
      authorDept: 'Operations',
      category: 'process',
      priority: 'medium',
      status: 'idea',
      tags: ['knowledge-management', 'search', 'AI', 'documentation'],
    },
    {
      title: 'Contractor Qualification Platform',
      description:
        'Develop platform to evaluate and track contractor performance, qualifications, and project history to improve selection and partnership decisions.',
      authorDept: 'Project Management',
      category: 'process',
      priority: 'medium',
      status: 'approved',
      tags: ['contractors', 'evaluation', 'partnerships', 'tracking'],
    },
  ];

  const createdIdeas = [];
  for (const ideaData of ideas) {
    const author = usersByDept[ideaData.authorDept] || users[0];

    const idea = await prisma.idea.create({
      data: {
        title: ideaData.title,
        description: ideaData.description,
        authorId: author.id,
        category: ideaData.category,
        priority: ideaData.priority,
        status: ideaData.status,
        tags: ideaData.tags,
        votes: Math.floor(Math.random() * 8) + 2, // 2-9 votes
      },
    });

    createdIdeas.push(idea);
  }

  // Create votes on ideas
  for (const idea of createdIdeas) {
    const numVoters = Math.floor(Math.random() * 4) + 2; // 2-5 voters per idea
    const voters = users.sort(() => 0.5 - Math.random()).slice(0, numVoters);

    for (const voter of voters) {
      await prisma.vote.create({
        data: {
          userId: voter.id,
          ideaId: idea.id,
          type: 'up',
          value: 1,
        },
      });
    }
  }

  // Create comments on ideas
  const ideaComments = [
    {
      ideaIndex: 0, // VR Presentations
      authorDept: 'Executive',
      content:
        'This could be a major differentiator for us. Several competitors are starting to offer VR. We should evaluate the ROI and client feedback potential.',
    },
    {
      ideaIndex: 0,
      authorDept: 'Operations',
      content:
        'Initial cost would be significant - VR equipment, software licenses, and training. But it could reduce design changes late in the process.',
    },
    {
      ideaIndex: 1, // Code Checker
      authorDept: 'Executive',
      content:
        'Automated code checking could save us thousands in review costs and reduce liability. This should be high priority.',
    },
    {
      ideaIndex: 1,
      authorDept: 'Engineering',
      content:
        'The technology exists but needs customization for our local codes. Would need to maintain code database updates regularly.',
    },
    {
      ideaIndex: 2, // Sustainability Scoring
      authorDept: 'Design',
      content:
        'More clients are requesting sustainable design. Real-time scoring would help us optimize designs during the process rather than retrofitting.',
    },
    {
      ideaIndex: 4, // IPD Workflow
      authorDept: 'Project Management',
      content:
        'IPD requires significant process changes but the collaboration benefits are proven. We should pilot this on a smaller project first.',
    },
  ];

  for (const commentData of ideaComments) {
    const idea = createdIdeas[commentData.ideaIndex];
    const author = usersByDept[commentData.authorDept] || users[0];

    await prisma.comment.create({
      data: {
        content: commentData.content,
        authorId: author.id,
        ideaId: idea.id,
      },
    });
  }

  // Create resource assignments for initiatives
  const resourceAssignments = [
    {
      initiativeIndex: 0, // Municipal Portal
      teamIndex: 3, // PMO
      hoursAllocated: 120,
      role: 'lead',
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
    {
      initiativeIndex: 1, // Resource Optimization
      teamIndex: 3, // PMO
      hoursAllocated: 200,
      role: 'lead',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
    {
      initiativeIndex: 2, // CAD Version Control
      teamIndex: 0, // Architecture
      hoursAllocated: 160,
      role: 'lead',
      startDate: new Date(),
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
    {
      initiativeIndex: 2,
      teamIndex: 1, // Structural
      hoursAllocated: 80,
      role: 'contributor',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
    {
      initiativeIndex: 3, // MEP Coordination
      teamIndex: 2, // MEP
      hoursAllocated: 100,
      role: 'lead',
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
    {
      initiativeIndex: 3,
      teamIndex: 0, // Architecture
      hoursAllocated: 60,
      role: 'contributor',
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const assignment of resourceAssignments) {
    const initiative =
      initiatives[initiatives.length - resourceAssignments.length + assignment.initiativeIndex];
    const team = createdTeams[assignment.teamIndex];

    await prisma.resourceAssignment.create({
      data: {
        initiativeId: initiative.id,
        teamId: team.id,
        hoursAllocated: assignment.hoursAllocated,
        role: assignment.role,
        startDate: assignment.startDate,
        endDate: assignment.endDate,
      },
    });
  }

  // Create additional audit logs for ideas and team activities
  const additionalLogs = [
    {
      userId: usersByDept['Design'].id,
      action: 'IDEA_SUBMITTED',
      details: {
        ideaTitle: 'Virtual Reality Client Presentations',
        category: 'technology',
        expectedImpact: 'Improved client satisfaction and reduced design changes',
      },
    },
    {
      userId: usersByDept['Engineering'].id,
      action: 'IDEA_APPROVED',
      details: {
        ideaTitle: 'Automated Building Code Checker',
        approvalReason: 'High ROI potential and risk reduction',
        nextSteps: 'Create initiative for Q2 implementation',
      },
    },
    {
      userId: usersByDept['Project Management'].id,
      action: 'TEAM_RESOURCE_ALLOCATED',
      details: {
        team: 'Project Management Office',
        initiative: 'Municipal Review Portal Integration',
        hoursAllocated: 120,
        duration: '8 weeks',
      },
    },
    {
      userId: usersByDept['Operations'].id,
      action: 'RESOURCE_UTILIZATION_OPTIMIZED',
      details: {
        previousUtilization: '67%',
        newUtilization: '84%',
        improvementFactors: ['Better skills matching', 'Reduced planning overhead'],
      },
    },
  ];

  for (const logData of additionalLogs) {
    await prisma.auditLog.create({
      data: {
        userId: logData.userId,
        action: logData.action,
        details: logData.details,
        timestamp: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000), // Within last 5 days
      },
    });
  }

  console.log('✅ Successfully added ideas, teams, and workflow data!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   • Created ${createdTeams.length} teams with realistic capacity and skills`);
  console.log(`   • Added ${createdIdeas.length} ideas for future initiatives`);
  console.log(`   • Created resource assignments linking teams to initiatives`);
  console.log(`   • Added comments and votes on ideas showing collaboration`);
  console.log(`   • Generated additional audit logs for recent activities`);
  console.log('');
  console.log('👥 Teams Created:');
  createdTeams.forEach((team) => {
    console.log(`   ${team.name} (${team.department}) - ${team.capacity} hours/week`);
  });
  console.log('');
  console.log('💡 Ideas by Status:');
  const statusCounts = createdIdeas.reduce((acc, idea) => {
    acc[idea.status] = (acc[idea.status] || 0) + 1;
    return acc;
  }, {});
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   ${status}: ${count} ideas`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
