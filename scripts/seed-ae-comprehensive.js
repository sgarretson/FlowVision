const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🏗️ Creating comprehensive A&E firm seed data...');

  // Clear existing data in correct order to avoid foreign key constraints
  console.log('🧹 Cleaning existing data...');
  await prisma.auditLog.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.vote.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.idea.deleteMany({});
  await prisma.resourceAssignment.deleteMany({});
  await prisma.milestone.deleteMany({});
  await prisma.initiative.deleteMany({});
  await prisma.issue.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.businessProfile.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});

  // Create users across different departments
  const users = [
    {
      email: 'admin@flowvision.com',
      name: 'Sarah Chen',
      role: 'ADMIN',
      password: 'admin123',
      department: 'Leadership',
    },
    {
      email: 'principal@morrarch.com',
      name: 'Michael Morrison',
      role: 'LEADER',
      password: 'principal123',
      department: 'Executive',
    },
    {
      email: 'pm.lead@morrarch.com',
      name: 'Jennifer Rodriguez',
      role: 'LEADER',
      password: 'pm123',
      department: 'Project Management',
    },
    {
      email: 'design.director@morrarch.com',
      name: 'David Kim',
      role: 'LEADER',
      password: 'design123',
      department: 'Design',
    },
    {
      email: 'eng.lead@morrarch.com',
      name: 'Amanda Foster',
      role: 'LEADER',
      password: 'eng123',
      department: 'Engineering',
    },
    {
      email: 'operations@morrarch.com',
      name: 'Robert Thompson',
      role: 'ADMIN',
      password: 'ops123',
      department: 'Operations',
    },
  ];

  const createdUsers = [];
  for (const user of users) {
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        name: user.name,
        passwordHash: await bcrypt.hash(user.password, 10),
        role: user.role,
        preferences: {
          timezone: 'America/New_York',
          department: user.department,
          notifications: {
            email: true,
            browser: true,
            aiInsights: true,
          },
          theme: 'light',
        },
      },
    });
    createdUsers.push(createdUser);
  }

  const adminUser = createdUsers[0];

  // Create comprehensive business profile
  const businessProfile = await prisma.businessProfile.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      industry: 'Architecture & Engineering',
      size: 125,
      metrics: {
        companyName: 'Morrison Architecture & Engineering',
        description:
          'Full-service architecture and engineering firm specializing in commercial, residential, and institutional projects',
        founded: '2008',
        locations: ['New York', 'Boston', 'Philadelphia'],
        specialties: [
          'Sustainable Design',
          'Historic Preservation',
          'Mixed-Use Development',
          'Educational Facilities',
        ],
        goals: [
          'Reduce project delivery time by 20%',
          'Improve client satisfaction scores to 95%+',
          'Enhance cross-department collaboration',
          'Implement sustainable design standards',
          'Expand into new markets',
        ],
        challenges: [
          'Complex regulatory approval processes',
          'Coordination between multiple stakeholders',
          'Resource allocation across concurrent projects',
          'Quality control and version management',
          'Client communication and expectation management',
          'Technology integration and training',
        ],
        departments: [
          'Executive Leadership',
          'Project Management',
          'Architecture Design',
          'Structural Engineering',
          'MEP Engineering',
          'Interior Design',
          'Business Development',
          'Operations & IT',
        ],
        projectTypes: [
          'Commercial Office Buildings',
          'Mixed-Use Developments',
          'Educational Facilities',
          'Healthcare Centers',
          'Residential Complexes',
          'Historic Renovations',
        ],
        context:
          'Mid-size A&E firm focused on high-quality design, sustainable practices, and client satisfaction in the Northeast market',
      },
    },
  });

  // Comprehensive A&E industry issues across all departments
  const issues = [
    // Project Management Issues
    {
      description:
        'Design review cycles with municipal authorities are unpredictable and can take 6-12 weeks. We lack visibility into review status, feedback timing, and revision requirements. This creates cascade delays across all project phases and impacts client expectations. Multiple departments are affected when approvals are delayed.',
      votes: 12,
      heatmapScore: 88,
      department: 'Project Management',
      category: 'Regulatory & Approvals',
    },
    {
      description:
        'Resource allocation across 15+ concurrent projects is managed through spreadsheets and personal knowledge. Project managers struggle to identify available architects, engineers, and specialists with the right skills and availability. This leads to overallocation, burnout, and missed deadlines.',
      votes: 9,
      heatmapScore: 84,
      department: 'Project Management',
      category: 'Resource Management',
    },
    {
      description:
        'Client change requests often arrive mid-project without proper impact assessment on timeline, budget, and scope. These changes ripple through design, engineering, and documentation phases, causing scope creep and budget overruns.',
      votes: 8,
      heatmapScore: 76,
      department: 'Project Management',
      category: 'Scope Management',
    },

    // Architecture & Design Issues
    {
      description:
        'CAD file version control is manual and error-prone. Architects work on outdated drawings, leading to coordination conflicts between architectural, structural, and MEP designs. We have had instances where structural elements conflicted with architectural features in final drawings.',
      votes: 11,
      heatmapScore: 91,
      department: 'Architecture Design',
      category: 'Documentation & Coordination',
    },
    {
      description:
        'Design standards and firm guidelines are scattered across different documents and not consistently applied. New team members struggle to understand design preferences, leading to rework and inconsistent deliverables.',
      votes: 6,
      heatmapScore: 67,
      department: 'Architecture Design',
      category: 'Standards & Quality',
    },
    {
      description:
        'Client presentations require significant time to prepare renderings, drawings, and materials. The process is manual and time-intensive, often requiring 20-30 hours of preparation for major presentations.',
      votes: 7,
      heatmapScore: 63,
      department: 'Architecture Design',
      category: 'Client Communication',
    },

    // Engineering Issues
    {
      description:
        'Coordination between structural, mechanical, electrical, and plumbing systems happens too late in the design process. Conflicts are discovered during documentation phase, requiring significant rework and design modifications.',
      votes: 10,
      heatmapScore: 86,
      department: 'Engineering',
      category: 'MEP Coordination',
    },
    {
      description:
        'Engineering calculations and analysis are performed in multiple software tools without central coordination. Results are difficult to verify, update, and share across the team, leading to potential errors and rework.',
      votes: 8,
      heatmapScore: 79,
      department: 'Engineering',
      category: 'Technical Analysis',
    },
    {
      description:
        'Code compliance verification is manual and depends heavily on individual engineer expertise. Code updates and changes are not systematically tracked, creating risk of non-compliance in projects.',
      votes: 9,
      heatmapScore: 82,
      department: 'Engineering',
      category: 'Code Compliance',
    },

    // Business Operations Issues
    {
      description:
        'Project profitability tracking is done post-completion, making it impossible to course-correct during execution. We lack real-time visibility into labor costs, consultant fees, and project margins.',
      votes: 7,
      heatmapScore: 74,
      department: 'Operations',
      category: 'Financial Management',
    },
    {
      description:
        'Marketing materials and project portfolios become outdated quickly. Maintaining current project photos, descriptions, and case studies requires significant effort and often falls behind.',
      votes: 5,
      heatmapScore: 58,
      department: 'Business Development',
      category: 'Marketing & Proposals',
    },
    {
      description:
        'Knowledge management is informal and relies on institutional memory. When senior staff leave, critical project knowledge and client relationships are at risk of being lost.',
      votes: 8,
      heatmapScore: 77,
      department: 'Operations',
      category: 'Knowledge Management',
    },

    // Technology & IT Issues
    {
      description:
        'Software licenses and tool access vary by department, creating compatibility issues when sharing files. CAD, BIM, engineering analysis, and project management tools do not integrate well.',
      votes: 9,
      heatmapScore: 81,
      department: 'Operations',
      category: 'Technology Integration',
    },
    {
      description:
        'Remote work capabilities are inconsistent across teams. Some staff can access all necessary tools remotely while others are limited, affecting collaboration and flexibility.',
      votes: 6,
      heatmapScore: 69,
      department: 'Operations',
      category: 'Remote Work Infrastructure',
    },
  ];

  const createdIssues = [];
  for (const issue of issues) {
    const createdIssue = await prisma.issue.create({
      data: {
        description: issue.description,
        votes: issue.votes,
        heatmapScore: issue.heatmapScore,
      },
    });
    createdIssues.push(createdIssue);
  }

  // Comprehensive initiatives across workflow phases
  const initiatives = [
    // IDENTIFY Phase - Problem Discovery
    {
      title: 'Municipal Approval Tracking System',
      problem:
        'Design review cycles with municipal authorities are unpredictable and lack visibility',
      goal: 'Implement tracking system for municipal reviews with status updates and timeline predictions',
      phase: 'IDENTIFY',
      status: 'ACTIVE',
      progress: 15,
      type: 'Technology',
      department: 'Project Management',
      kpis: ['Reduce review cycle uncertainty by 60%', 'Improve timeline accuracy to 90%'],
      estimatedDuration: 90,
      priority: 'HIGH',
    },
    {
      title: 'Design Coordination Process Assessment',
      problem: 'MEP coordination happens too late causing rework and conflicts',
      goal: 'Map current coordination workflows and identify integration points for earlier collaboration',
      phase: 'IDENTIFY',
      status: 'ACTIVE',
      progress: 35,
      type: 'Process Improvement',
      department: 'Engineering',
      kpis: [
        'Document 100% of coordination touchpoints',
        'Identify 5+ early integration opportunities',
      ],
      estimatedDuration: 60,
      priority: 'HIGH',
    },

    // PLAN Phase - Solution Development
    {
      title: 'Digital Client Portal Implementation',
      problem: 'Client approval process is slow and disorganized',
      goal: 'Create secure portal for design reviews, approvals, and project communication',
      phase: 'PLAN',
      status: 'ACTIVE',
      progress: 45,
      type: 'Technology',
      department: 'Project Management',
      kpis: [
        'Reduce approval cycle time by 40%',
        'Increase client satisfaction by 25%',
        '100% of projects use portal',
      ],
      estimatedDuration: 120,
      priority: 'HIGH',
    },
    {
      title: 'CAD/BIM Standardization Program',
      problem: 'Inconsistent CAD standards leading to coordination conflicts',
      goal: 'Develop unified CAD/BIM standards and templates for all disciplines',
      phase: 'PLAN',
      status: 'ACTIVE',
      progress: 60,
      type: 'Quality',
      department: 'Architecture Design',
      kpis: ['95% compliance with new standards', 'Reduce coordination conflicts by 70%'],
      estimatedDuration: 180,
      priority: 'MEDIUM',
    },
    {
      title: 'Resource Management Dashboard',
      problem: 'Poor visibility into team capacity and workload distribution',
      goal: 'Build real-time dashboard for resource allocation across all projects',
      phase: 'PLAN',
      status: 'ACTIVE',
      progress: 30,
      department: 'Project Management',
      kpis: ['Improve resource utilization to 85%', 'Reduce project manager planning time by 50%'],
      estimatedDuration: 90,
      priority: 'HIGH',
    },

    // EXECUTE Phase - Implementation
    {
      title: 'Unified File Management System',
      problem: 'Project files scattered across multiple platforms causing version control issues',
      goal: 'Implement centralized file management with version control and access permissions',
      phase: 'EXECUTE',
      status: 'ACTIVE',
      progress: 70,
      department: 'Operations',
      kpis: [
        'Reduce file search time by 75%',
        '100% version control compliance',
        'Zero version conflicts',
      ],
      estimatedDuration: 150,
      priority: 'HIGH',
    },
    {
      title: 'Engineering Analysis Integration',
      problem: 'Engineering calculations performed in isolated tools without coordination',
      goal: 'Integrate structural, MEP, and sustainability analysis tools with central data model',
      phase: 'EXECUTE',
      status: 'ACTIVE',
      progress: 25,
      department: 'Engineering',
      kpis: ['90% calculation accuracy verification', 'Reduce analysis time by 30%'],
      estimatedDuration: 200,
      priority: 'MEDIUM',
    },
    {
      title: 'Code Compliance Database',
      problem: 'Manual code compliance verification creates risk of non-compliance',
      goal: 'Build database of current codes with automated compliance checking',
      phase: 'EXECUTE',
      status: 'ACTIVE',
      progress: 40,
      department: 'Engineering',
      kpis: ['100% code compliance verification', 'Reduce compliance review time by 60%'],
      estimatedDuration: 120,
      priority: 'MEDIUM',
    },

    // ANALYZE Phase - Monitoring & Optimization
    {
      title: 'Project Profitability Analytics',
      problem: 'Project profitability tracked only post-completion',
      goal: 'Implement real-time project cost tracking and profitability analytics',
      phase: 'ANALYZE',
      status: 'COMPLETED',
      progress: 100,
      department: 'Operations',
      kpis: ['Real-time cost visibility for 100% of projects', 'Improve profit margins by 15%'],
      estimatedDuration: 90,
      priority: 'HIGH',
    },
    {
      title: 'Design Quality Metrics Program',
      problem: 'No systematic measurement of design quality and client satisfaction',
      goal: 'Establish metrics and feedback loops for design quality improvement',
      phase: 'ANALYZE',
      status: 'COMPLETED',
      progress: 100,
      department: 'Architecture Design',
      kpis: ['Client satisfaction score > 95%', 'Design revision cycles < 3 per project'],
      estimatedDuration: 60,
      priority: 'MEDIUM',
    },
    {
      title: 'Knowledge Management System',
      problem: 'Critical project knowledge at risk when staff leave',
      goal: 'Create comprehensive knowledge base with project lessons learned and best practices',
      phase: 'ANALYZE',
      status: 'ACTIVE',
      progress: 55,
      department: 'Operations',
      kpis: ['Capture 90% of project lessons learned', 'Reduce onboarding time by 40%'],
      estimatedDuration: 180,
      priority: 'MEDIUM',
    },
  ];

  const createdInitiatives = [];
  for (let i = 0; i < initiatives.length; i++) {
    const initiative = initiatives[i];
    const ownerUser = createdUsers[i % createdUsers.length]; // Distribute across users

    const createdInitiative = await prisma.initiative.create({
      data: {
        title: initiative.title,
        problem: initiative.problem,
        goal: initiative.goal,
        phase: initiative.phase,
        status: initiative.status,
        progress: initiative.progress,
        type: initiative.type || 'Process Improvement',
        ownerId: ownerUser.id,
        orderIndex: i,
        kpis: initiative.kpis || [],
      },
    });
    createdInitiatives.push(createdInitiative);
  }

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

  // Create ideas for future initiatives
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

  // Map users by department for idea assignment
  const usersByDept = {
    Leadership: createdUsers.find((u) => u.preferences?.department === 'Leadership'),
    Executive: createdUsers.find((u) => u.preferences?.department === 'Executive'),
    'Project Management': createdUsers.find(
      (u) => u.preferences?.department === 'Project Management'
    ),
    Design: createdUsers.find((u) => u.preferences?.department === 'Design'),
    Engineering: createdUsers.find((u) => u.preferences?.department === 'Engineering'),
    Operations: createdUsers.find((u) => u.preferences?.department === 'Operations'),
  };

  const createdIdeas = [];
  for (const ideaData of ideas) {
    const author = usersByDept[ideaData.authorDept] || createdUsers[0];

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
    const voters = createdUsers.sort(() => 0.5 - Math.random()).slice(0, numVoters);

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
    const author = usersByDept[commentData.authorDept] || createdUsers[0];

    await prisma.comment.create({
      data: {
        content: commentData.content,
        authorId: author.id,
        ideaId: idea.id,
      },
    });
  }

  // Create comprehensive audit logs showing realistic A&E firm activity
  const auditActions = [
    'AI_ISSUE_ANALYSIS',
    'AI_INITIATIVE_RECOMMENDATIONS',
    'AI_INITIATIVE_REQUIREMENTS',
    'OPENAI_CONNECTION_TEST',
    'INITIATIVE_CREATED',
    'INITIATIVE_UPDATED',
    'ISSUE_CREATED',
    'ISSUE_VOTED',
    'PROJECT_MILESTONE_COMPLETED',
    'DESIGN_REVIEW_SUBMITTED',
    'CLIENT_APPROVAL_RECEIVED',
    'COORDINATION_CONFLICT_RESOLVED',
    'CODE_COMPLIANCE_VERIFIED',
  ];

  // Create 30 days of activity logs
  for (let i = 0; i < 45; i++) {
    const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    const randomAction = auditActions[Math.floor(Math.random() * auditActions.length)];
    const daysAgo = Math.floor(Math.random() * 30);

    let details = {};

    if (randomAction.includes('AI_')) {
      details = {
        tokens: Math.floor(Math.random() * 1500) + 200,
        model: 'gpt-4',
        cost: (Math.random() * 0.08).toFixed(4),
        success: Math.random() > 0.1, // 90% success rate
        processingTime: (Math.random() * 3).toFixed(2) + 's',
      };
    } else if (randomAction.includes('INITIATIVE')) {
      details = {
        initiativeId: createdInitiatives[Math.floor(Math.random() * createdInitiatives.length)].id,
        phase: ['IDENTIFY', 'PLAN', 'EXECUTE', 'ANALYZE'][Math.floor(Math.random() * 4)],
        department: ['Project Management', 'Architecture Design', 'Engineering', 'Operations'][
          Math.floor(Math.random() * 4)
        ],
      };
    } else if (randomAction.includes('DESIGN')) {
      details = {
        projectType: ['Commercial', 'Residential', 'Educational', 'Healthcare'][
          Math.floor(Math.random() * 4)
        ],
        reviewCycle: Math.floor(Math.random() * 5) + 1,
        stakeholders: Math.floor(Math.random() * 8) + 3,
      };
    }

    await prisma.auditLog.create({
      data: {
        userId: randomUser.id,
        action: randomAction,
        details: details,
        timestamp: new Date(
          Date.now() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 24 * 60 * 60 * 1000
        ),
      },
    });
  }

  console.log('✅ Comprehensive A&E firm seed data created successfully!');
  console.log('');
  console.log('🏢 Morrison Architecture & Engineering Profile:');
  console.log(`   Company: ${businessProfile.metrics.companyName}`);
  console.log(`   Size: ${businessProfile.size} employees`);
  console.log(`   Locations: ${businessProfile.metrics.locations.join(', ')}`);
  console.log('');
  console.log('👥 Department Leaders Created:');
  createdUsers.forEach((user) => {
    console.log(`   ${user.name} (${user.email}) - ${user.preferences.department}`);
  });
  console.log('');
  console.log('📊 Issues by Department:');
  const issueCounts = issues.reduce((acc, issue) => {
    acc[issue.department] = (acc[issue.department] || 0) + 1;
    return acc;
  }, {});
  Object.entries(issueCounts).forEach(([dept, count]) => {
    console.log(`   ${dept}: ${count} issues`);
  });
  console.log('');
  console.log('🎯 Initiatives by Phase:');
  const phaseCounts = initiatives.reduce((acc, init) => {
    acc[init.phase] = (acc[init.phase] || 0) + 1;
    return acc;
  }, {});
  Object.entries(phaseCounts).forEach(([phase, count]) => {
    console.log(`   ${phase}: ${count} initiatives`);
  });
  console.log('');
  console.log('👥 Teams Created:');
  createdTeams.forEach((team) => {
    console.log(`   ${team.name} (${team.department}) - ${team.capacity} hours/week`);
  });
  console.log('');
  console.log('💡 Ideas by Status:');
  const ideaStatusCounts = createdIdeas.reduce((acc, idea) => {
    acc[idea.status] = (acc[idea.status] || 0) + 1;
    return acc;
  }, {});
  Object.entries(ideaStatusCounts).forEach(([status, count]) => {
    console.log(`   ${status}: ${count} ideas`);
  });
  console.log('');
  console.log(
    `📈 Total entries: ${createdIssues.length} issues, ${createdInitiatives.length} initiatives, ${createdTeams.length} teams, ${createdIdeas.length} ideas, 45+ audit logs`
  );
}

main()
  .catch((e) => {
    console.error('❌ Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
