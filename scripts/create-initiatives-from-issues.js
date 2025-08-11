const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 Creating initiatives and related data from reported issues...');

  // Get all users and existing issues
  const users = await prisma.user.findMany();
  const issues = await prisma.issue.findMany();

  console.log(`Found ${users.length} users and ${issues.length} issues`);

  // Map users by department for realistic assignment
  const usersByDept = {
    Leadership: users.find((u) => u.preferences?.department === 'Leadership'),
    Executive: users.find((u) => u.preferences?.department === 'Executive'),
    'Project Management': users.find((u) => u.preferences?.department === 'Project Management'),
    Design: users.find((u) => u.preferences?.department === 'Design'),
    Engineering: users.find((u) => u.preferences?.department === 'Engineering'),
    Operations: users.find((u) => u.preferences?.department === 'Operations'),
  };

  // Create initiatives based on the most critical issues
  const issueBasedInitiatives = [
    {
      issueIndex: 0, // Municipal approval tracking
      title: 'Municipal Review Portal Integration',
      problem:
        'Design review cycles with municipal authorities are unpredictable and lack visibility into status and timeline',
      goal: 'Create integrated system to track municipal reviews with automated status updates and timeline predictions',
      phase: 'PLAN',
      status: 'ACTIVE',
      progress: 25,
      department: 'Project Management',
      kpis: [
        'Reduce review cycle uncertainty from 6-12 weeks to 4-8 weeks',
        'Achieve 90% timeline prediction accuracy',
        'Implement status tracking for 100% of municipal submissions',
      ],
      estimatedHours: 320,
      budget: 45000,
      priority: 'HIGH',
    },
    {
      issueIndex: 1, // Resource allocation
      title: 'AI-Powered Resource Optimization System',
      problem:
        'Resource allocation across concurrent projects is manual and lacks visibility into team capacity and skills',
      goal: 'Implement intelligent resource management system with skill matching and capacity planning',
      phase: 'IDENTIFY',
      status: 'ACTIVE',
      progress: 40,
      department: 'Project Management',
      kpis: [
        'Improve resource utilization from 60% to 85%',
        'Reduce project overruns from 15% to 5%',
        'Decrease staff burnout incidents by 70%',
      ],
      estimatedHours: 480,
      budget: 65000,
      priority: 'CRITICAL',
    },
    {
      issueIndex: 3, // CAD version control
      title: 'Unified CAD/BIM Version Control Platform',
      problem:
        'CAD file version control is manual leading to coordination conflicts and design errors',
      goal: 'Implement automated version control system with real-time collaboration and conflict detection',
      phase: 'EXECUTE',
      status: 'ACTIVE',
      progress: 60,
      department: 'Design',
      kpis: [
        'Eliminate 100% of version conflicts',
        'Reduce coordination rework by 70%',
        'Improve design delivery speed by 30%',
      ],
      estimatedHours: 600,
      budget: 80000,
      priority: 'HIGH',
    },
    {
      issueIndex: 6, // MEP coordination
      title: 'Early-Stage MEP Coordination Framework',
      problem: 'MEP coordination happens too late causing significant rework and design conflicts',
      goal: 'Establish early-stage coordination protocols with integrated design validation',
      phase: 'PLAN',
      status: 'ACTIVE',
      progress: 35,
      department: 'Engineering',
      kpis: [
        'Move coordination from documentation to design phase',
        'Reduce MEP conflicts by 80%',
        'Decrease rework hours by 60%',
      ],
      estimatedHours: 240,
      budget: 35000,
      priority: 'HIGH',
    },
    {
      issueIndex: 9, // Project profitability
      title: 'Real-Time Project Financial Dashboard',
      problem:
        'Project profitability tracking only happens post-completion making course-correction impossible',
      goal: 'Create real-time financial tracking with automated alerts and margin optimization',
      phase: 'EXECUTE',
      status: 'ACTIVE',
      progress: 75,
      department: 'Operations',
      kpis: [
        'Real-time cost visibility for 100% of active projects',
        'Improve profit margins by 15%',
        'Reduce budget overruns by 50%',
      ],
      estimatedHours: 180,
      budget: 25000,
      priority: 'MEDIUM',
    },
    {
      issueIndex: 12, // Technology integration
      title: 'Software Integration and Standardization',
      problem:
        'Software tools across departments lack integration causing compatibility and workflow issues',
      goal: 'Standardize and integrate software tools with unified data exchange protocols',
      phase: 'IDENTIFY',
      status: 'ACTIVE',
      progress: 20,
      department: 'Operations',
      kpis: [
        'Achieve 95% software compatibility across departments',
        'Reduce file conversion time by 80%',
        'Implement single sign-on for all tools',
      ],
      estimatedHours: 400,
      budget: 55000,
      priority: 'MEDIUM',
    },
  ];

  const createdInitiatives = [];

  for (let i = 0; i < issueBasedInitiatives.length; i++) {
    const initData = issueBasedInitiatives[i];
    const owner = usersByDept[initData.department] || users[0];

    const initiative = await prisma.initiative.create({
      data: {
        title: initData.title,
        problem: initData.problem,
        goal: initData.goal,
        phase: initData.phase,
        status: initData.status,
        progress: initData.progress,
        ownerId: owner.id,
        orderIndex: i,
        kpis: initData.kpis,
        estimatedHours: initData.estimatedHours,
        budget: initData.budget,
      },
    });

    createdInitiatives.push({ ...initiative, department: initData.department });
  }

  // Create comments on issues showing discussion and initiative creation
  const issueComments = [
    {
      issueIndex: 0,
      authorDept: 'Project Management',
      content:
        'This is our biggest bottleneck right now. We had three projects delayed by 4+ weeks just this quarter due to unpredictable municipal reviews. We need better visibility into the review process and proactive communication with planning departments.',
    },
    {
      issueIndex: 0,
      authorDept: 'Executive',
      content:
        'Agreed. This impacts our client relationships and project margins significantly. Jennifer, can we explore some technology solutions that other firms are using? I heard Perkins+Will implemented something similar.',
    },
    {
      issueIndex: 1,
      authorDept: 'Project Management',
      content:
        'Our resource allocation is becoming increasingly difficult as we take on more projects. I spend 4-5 hours every Monday just trying to figure out who is available and what skills we need where.',
    },
    {
      issueIndex: 1,
      authorDept: 'Design',
      content:
        'From the design side, we often get pulled into projects without proper notice or understanding of our current workload. This leads to rushed work and quality issues.',
    },
    {
      issueIndex: 1,
      authorDept: 'Engineering',
      content:
        'Same issue here. MEP coordination requires specific engineers with experience in different building types, but that knowledge is not easily accessible when planning resources.',
    },
    {
      issueIndex: 3,
      authorDept: 'Design',
      content:
        'We had a major issue last week where structural changes were made to an architectural drawing without coordination. The MEP team worked on the old structural layout for two days before we caught the error.',
    },
    {
      issueIndex: 3,
      authorDept: 'Engineering',
      content:
        'Version control is critical for our liability and quality assurance. We need a system that prevents these conflicts from happening rather than just documenting them after the fact.',
    },
    {
      issueIndex: 6,
      authorDept: 'Engineering',
      content:
        'MEP coordination should start during schematic design, not construction documents. We need to change our entire workflow to catch conflicts early.',
    },
    {
      issueIndex: 6,
      authorDept: 'Project Management',
      content:
        'The challenge is that early coordination requires more upfront engineering time, which impacts our project budgets. We need to find ways to make this efficient.',
    },
    {
      issueIndex: 9,
      authorDept: 'Executive',
      content:
        'Financial visibility is crucial for our growth. We need to know immediately when a project is going over budget, not months later during reconciliation.',
    },
    {
      issueIndex: 9,
      authorDept: 'Operations',
      content:
        'I can provide daily reports, but they require manual data collection from multiple sources. Automation would save significant time and provide better accuracy.',
    },
  ];

  // Create comments
  for (const commentData of issueComments) {
    const issue = issues[commentData.issueIndex];
    const author = usersByDept[commentData.authorDept] || users[0];

    await prisma.comment.create({
      data: {
        content: commentData.content,
        authorId: author.id,
        issueId: issue.id,
      },
    });
  }

  // Create votes on issues from different users
  const voteData = [
    { issueIndex: 0, voterDepts: ['Project Management', 'Executive', 'Design', 'Operations'] },
    {
      issueIndex: 1,
      voterDepts: ['Project Management', 'Design', 'Engineering', 'Operations', 'Executive'],
    },
    { issueIndex: 3, voterDepts: ['Design', 'Engineering', 'Project Management', 'Operations'] },
    { issueIndex: 6, voterDepts: ['Engineering', 'Design', 'Project Management'] },
    { issueIndex: 9, voterDepts: ['Executive', 'Operations', 'Project Management'] },
    { issueIndex: 12, voterDepts: ['Operations', 'Design', 'Engineering'] },
  ];

  for (const vote of voteData) {
    const issue = issues[vote.issueIndex];
    for (const dept of vote.voterDepts) {
      const voter = usersByDept[dept];
      if (voter) {
        await prisma.vote.create({
          data: {
            userId: voter.id,
            issueId: issue.id,
            type: 'priority',
            value: 1,
          },
        });
      }
    }
  }

  // Create comments on initiatives showing progress and collaboration
  const initiativeComments = [
    {
      initiativeIndex: 0,
      authorDept: 'Project Management',
      content:
        'Started research on municipal portal APIs. Found that NYC has a pilot program for automated status updates. Reaching out to their IT department for integration possibilities.',
    },
    {
      initiativeIndex: 0,
      authorDept: 'Operations',
      content:
        'Budget approved for initial vendor evaluation. Recommended we also look at Boston and Philadelphia systems since we have active projects in all three cities.',
    },
    {
      initiativeIndex: 1,
      authorDept: 'Executive',
      content:
        'This is our top priority initiative. The ROI analysis shows we could save 200+ hours per month in resource planning alone.',
    },
    {
      initiativeIndex: 1,
      authorDept: 'Project Management',
      content:
        'Completed skills inventory for all team members. Next step is to integrate this with our project management system for automated matching.',
    },
    {
      initiativeIndex: 2,
      authorDept: 'Design',
      content:
        'CAD standards document is 80% complete. Working with engineering team to ensure MEP standards are properly integrated.',
    },
    {
      initiativeIndex: 2,
      authorDept: 'Engineering',
      content:
        'Tested the new version control system on the Community Center project. Zero conflicts so far after 2 weeks of use.',
    },
    {
      initiativeIndex: 3,
      authorDept: 'Engineering',
      content:
        'Revised our standard design process to include MEP review at 30% design development instead of 90%. Initial results are promising.',
    },
    {
      initiativeIndex: 4,
      authorDept: 'Operations',
      content:
        'Financial dashboard is live for 5 pilot projects. Project managers can now see real-time budget status and cost projections.',
    },
  ];

  // Create initiative comments
  for (const commentData of initiativeComments) {
    const initiative = createdInitiatives[commentData.initiativeIndex];
    const author = usersByDept[commentData.authorDept] || users[0];

    await prisma.comment.create({
      data: {
        content: commentData.content,
        authorId: author.id,
        initiativeId: initiative.id,
      },
    });
  }

  // Create votes on initiatives
  const initiativeVotes = [
    { initiativeIndex: 0, voterDepts: ['Project Management', 'Executive', 'Operations'] },
    {
      initiativeIndex: 1,
      voterDepts: ['Executive', 'Project Management', 'Design', 'Engineering'],
    },
    { initiativeIndex: 2, voterDepts: ['Design', 'Engineering', 'Project Management'] },
    { initiativeIndex: 3, voterDepts: ['Engineering', 'Design', 'Executive'] },
    { initiativeIndex: 4, voterDepts: ['Operations', 'Executive', 'Project Management'] },
    { initiativeIndex: 5, voterDepts: ['Operations', 'Design', 'Engineering'] },
  ];

  for (const vote of initiativeVotes) {
    const initiative = createdInitiatives[vote.initiativeIndex];
    for (const dept of vote.voterDepts) {
      const voter = usersByDept[dept];
      if (voter) {
        await prisma.vote.create({
          data: {
            userId: voter.id,
            initiativeId: initiative.id,
            type: 'priority',
            value: 1,
          },
        });
      }
    }
  }

  // Create milestones for initiatives
  const milestones = [
    {
      initiativeIndex: 0,
      title: 'Municipal API Research Complete',
      description: 'Complete evaluation of all municipal portal APIs and integration options',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
      status: 'in_progress',
      progress: 70,
    },
    {
      initiativeIndex: 0,
      title: 'Pilot Integration with NYC Portal',
      description: 'Implement and test integration with NYC municipal review portal',
      dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
      status: 'pending',
      progress: 0,
    },
    {
      initiativeIndex: 1,
      title: 'Resource Management MVP',
      description: 'Deploy basic resource allocation dashboard for project managers',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      status: 'in_progress',
      progress: 85,
    },
    {
      initiativeIndex: 2,
      title: 'CAD Version Control Rollout',
      description: 'Deploy version control system to all design teams',
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks
      status: 'in_progress',
      progress: 60,
    },
    {
      initiativeIndex: 3,
      title: 'Early MEP Review Process',
      description: 'Implement new early-stage MEP coordination workflow',
      dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days
      status: 'pending',
      progress: 0,
    },
    {
      initiativeIndex: 4,
      title: 'Financial Dashboard Full Deployment',
      description: 'Roll out real-time financial tracking to all active projects',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
      status: 'completed',
      progress: 100,
    },
  ];

  for (const milestoneData of milestones) {
    const initiative = createdInitiatives[milestoneData.initiativeIndex];

    await prisma.milestone.create({
      data: {
        title: milestoneData.title,
        description: milestoneData.description,
        dueDate: milestoneData.dueDate,
        status: milestoneData.status,
        progress: milestoneData.progress,
        initiativeId: initiative.id,
      },
    });
  }

  // Create additional audit logs for initiative creation and progress
  const additionalLogs = [
    {
      userId: usersByDept['Project Management'].id,
      action: 'INITIATIVE_CREATED_FROM_ISSUE',
      details: {
        initiativeTitle: 'Municipal Review Portal Integration',
        sourceIssue: 'Municipal approval tracking',
        priority: 'HIGH',
        estimatedBenefit: 'Reduce review uncertainty by 60%',
      },
    },
    {
      userId: usersByDept['Executive'].id,
      action: 'INITIATIVE_PRIORITY_UPDATED',
      details: {
        initiativeTitle: 'AI-Powered Resource Optimization System',
        newPriority: 'CRITICAL',
        reason: 'Directly impacts profitability and team satisfaction',
      },
    },
    {
      userId: usersByDept['Design'].id,
      action: 'MILESTONE_COMPLETED',
      details: {
        milestone: 'CAD Standards Documentation',
        completionDate: new Date().toISOString(),
        nextSteps: 'Begin pilot testing with Community Center project',
      },
    },
    {
      userId: usersByDept['Operations'].id,
      action: 'FINANCIAL_DASHBOARD_DEPLOYED',
      details: {
        projectsIncluded: 5,
        realTimeMetrics: ['Labor costs', 'Consultant fees', 'Project margins'],
        expectedROI: '15% margin improvement',
      },
    },
  ];

  for (const logData of additionalLogs) {
    await prisma.auditLog.create({
      data: {
        userId: logData.userId,
        action: logData.action,
        details: logData.details,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Within last week
      },
    });
  }

  console.log('✅ Successfully created initiatives and related data from issues!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   • Created ${createdInitiatives.length} new initiatives from critical issues`);
  console.log(`   • Added ${issueComments.length} comments on issues showing team discussion`);
  console.log(`   • Added ${initiativeComments.length} comments on initiatives showing progress`);
  console.log(`   • Created ${milestones.length} milestones with realistic timelines`);
  console.log(`   • Added voting data showing team prioritization`);
  console.log(`   • Generated additional audit logs for recent activity`);
  console.log('');
  console.log('🎯 New Initiatives by Phase:');
  const phaseCounts = createdInitiatives.reduce((acc, init) => {
    acc[init.phase] = (acc[init.phase] || 0) + 1;
    return acc;
  }, {});
  Object.entries(phaseCounts).forEach(([phase, count]) => {
    console.log(`   ${phase}: ${count} initiatives`);
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
