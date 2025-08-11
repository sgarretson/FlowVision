/* eslint-disable @typescript-eslint/no-var-requires */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
    },
  });

  await prisma.businessProfile.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      industry: 'Architecture',
      size: 100,
      metrics: { billableUtilization: 0.7, avgProjectDurationDays: 120 },
    },
  });

  // Create teams first
  const designTeam = await prisma.team.create({
    data: {
      name: 'Design Team',
      department: 'Creative',
      capacity: 40,
      skills: ['UI/UX Design', 'Graphic Design', 'User Research', 'Prototyping'],
    },
  });

  const devTeam = await prisma.team.create({
    data: {
      name: 'Development Team',
      department: 'Technology',
      capacity: 40,
      skills: ['Full Stack Development', 'Database Design', 'API Development', 'Testing'],
    },
  });

  const opsTeam = await prisma.team.create({
    data: {
      name: 'Operations Team',
      department: 'Operations',
      capacity: 40,
      skills: ['Process Management', 'Quality Assurance', 'Training', 'Documentation'],
    },
  });

  const marketingTeam = await prisma.team.create({
    data: {
      name: 'Marketing Team',
      department: 'Marketing',
      capacity: 32,
      skills: ['Digital Marketing', 'Content Creation', 'Brand Management', 'Analytics'],
    },
  });

  // Create comprehensive initiatives with realistic timelines
  const now = new Date();
  const q1Start = new Date(now.getFullYear(), 0, 1); // January 1
  const q1End = new Date(now.getFullYear(), 2, 31); // March 31
  const q2Start = new Date(now.getFullYear(), 3, 1); // April 1
  const q2End = new Date(now.getFullYear(), 5, 30); // June 30
  const q3Start = new Date(now.getFullYear(), 6, 1); // July 1
  const q3End = new Date(now.getFullYear(), 8, 30); // September 30
  const q4Start = new Date(now.getFullYear(), 9, 1); // October 1
  const q4End = new Date(now.getFullYear(), 11, 31); // December 31

  // Initiative 1: Client Portal Enhancement (Q1-Q2)
  const clientPortalInit = await prisma.initiative.create({
    data: {
      title: 'Client Portal Enhancement',
      problem: 'Client approval workflow inefficiencies causing project delays',
      goal: 'Reduce approval cycle time by 30% through automated workflow system',
      kpis: ['Cycle Time', 'On-Time Approvals', 'Client Satisfaction Score'],
      ownerId: admin.id,
      timelineStart: q1Start,
      timelineEnd: q2End,
      status: 'In Progress',
      progress: 65,
      difficulty: 7,
      roi: 8,
      priorityScore: 85,
      budget: 45000,
      estimatedHours: 320,
      actualHours: 208,
      phase: 'development',
      orderIndex: 1,
    },
  });

  // Initiative 2: Security Infrastructure Upgrade (Q1)
  const securityInit = await prisma.initiative.create({
    data: {
      title: 'Security Infrastructure Upgrade',
      problem: 'Critical security vulnerabilities in customer database access controls',
      goal: 'Implement comprehensive security framework with zero vulnerabilities',
      kpis: ['Security Score', 'Incident Count', 'Compliance Rating'],
      ownerId: admin.id,
      timelineStart: q1Start,
      timelineEnd: q1End,
      status: 'Done',
      progress: 100,
      difficulty: 9,
      roi: 9,
      priorityScore: 95,
      budget: 25000,
      estimatedHours: 180,
      actualHours: 195,
      phase: 'completed',
      orderIndex: 2,
    },
  });

  // Initiative 3: Training Documentation Overhaul (Q2-Q3)
  const trainingInit = await prisma.initiative.create({
    data: {
      title: 'Training Documentation Overhaul',
      problem: 'Staff training documentation is outdated and not user-friendly',
      goal: 'Create comprehensive, interactive training system',
      kpis: ['Training Completion Rate', 'Knowledge Retention Score', 'Time to Productivity'],
      ownerId: admin.id,
      timelineStart: q2Start,
      timelineEnd: q3End,
      status: 'Prioritize',
      progress: 25,
      difficulty: 5,
      roi: 6,
      priorityScore: 65,
      budget: 15000,
      estimatedHours: 120,
      actualHours: 30,
      phase: 'planning',
      orderIndex: 3,
    },
  });

  // Initiative 4: Digital Marketing Platform (Q3-Q4)
  const marketingInit = await prisma.initiative.create({
    data: {
      title: 'Digital Marketing Platform',
      problem: 'Limited online presence affecting new client acquisition',
      goal: 'Increase qualified leads by 40% through digital marketing automation',
      kpis: ['Lead Generation', 'Conversion Rate', 'Website Traffic'],
      ownerId: admin.id,
      timelineStart: q3Start,
      timelineEnd: q4End,
      status: 'Define',
      progress: 10,
      difficulty: 6,
      roi: 8,
      priorityScore: 75,
      budget: 35000,
      estimatedHours: 280,
      actualHours: 28,
      phase: 'planning',
      orderIndex: 4,
    },
  });

  // Initiative 5: Project Management Tool Integration (Q4)
  const pmToolInit = await prisma.initiative.create({
    data: {
      title: 'Project Management Tool Integration',
      problem: 'Project timeline management causing delays and client dissatisfaction',
      goal: 'Streamline project delivery with integrated management tools',
      kpis: ['On-Time Delivery', 'Resource Utilization', 'Client Satisfaction'],
      ownerId: admin.id,
      timelineStart: q4Start,
      timelineEnd: q4End,
      status: 'Define',
      progress: 5,
      difficulty: 4,
      roi: 7,
      priorityScore: 70,
      budget: 20000,
      estimatedHours: 160,
      actualHours: 8,
      phase: 'planning',
      orderIndex: 5,
    },
  });

  // Create dependencies
  await prisma.initiative.update({
    where: { id: trainingInit.id },
    data: {
      dependencies: {
        connect: { id: clientPortalInit.id }, // Training depends on portal completion
      },
    },
  });

  await prisma.initiative.update({
    where: { id: marketingInit.id },
    data: {
      dependencies: {
        connect: { id: securityInit.id }, // Marketing depends on security completion
      },
    },
  });

  // Create milestones for Client Portal initiative
  await prisma.milestone.create({
    data: {
      title: 'Requirements Gathering Complete',
      description: 'All client requirements documented and approved',
      dueDate: new Date(q1Start.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days after start
      status: 'completed',
      initiativeId: clientPortalInit.id,
      progress: 100,
    },
  });

  await prisma.milestone.create({
    data: {
      title: 'Design Prototype Approval',
      description: 'UI/UX designs approved by stakeholders',
      dueDate: new Date(q1Start.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days after start
      status: 'completed',
      initiativeId: clientPortalInit.id,
      progress: 100,
    },
  });

  await prisma.milestone.create({
    data: {
      title: 'Backend API Development',
      description: 'Core API functionality implemented and tested',
      dueDate: new Date(q1Start.getTime() + 120 * 24 * 60 * 60 * 1000), // 120 days after start
      status: 'in_progress',
      initiativeId: clientPortalInit.id,
      progress: 75,
    },
  });

  await prisma.milestone.create({
    data: {
      title: 'User Acceptance Testing',
      description: 'Client testing and feedback incorporation',
      dueDate: new Date(q2Start.getTime() + 45 * 24 * 60 * 60 * 1000), // 45 days into Q2
      status: 'pending',
      initiativeId: clientPortalInit.id,
      progress: 0,
    },
  });

  // Create milestones for Security initiative (completed)
  await prisma.milestone.create({
    data: {
      title: 'Security Audit Complete',
      description: 'Comprehensive security assessment finished',
      dueDate: new Date(q1Start.getTime() + 15 * 24 * 60 * 60 * 1000),
      status: 'completed',
      initiativeId: securityInit.id,
      progress: 100,
    },
  });

  await prisma.milestone.create({
    data: {
      title: 'Infrastructure Hardening',
      description: 'All security measures implemented',
      dueDate: new Date(q1Start.getTime() + 60 * 24 * 60 * 60 * 1000),
      status: 'completed',
      initiativeId: securityInit.id,
      progress: 100,
    },
  });

  // Create milestones for Training initiative
  await prisma.milestone.create({
    data: {
      title: 'Content Strategy Defined',
      description: 'Training curriculum and structure planned',
      dueDate: new Date(q2Start.getTime() + 30 * 24 * 60 * 60 * 1000),
      status: 'in_progress',
      initiativeId: trainingInit.id,
      progress: 80,
    },
  });

  // Create resource assignments
  await prisma.resourceAssignment.createMany({
    data: [
      // Client Portal assignments
      {
        initiativeId: clientPortalInit.id,
        teamId: designTeam.id,
        hoursAllocated: 120,
        startDate: q1Start,
        endDate: new Date(q1Start.getTime() + 75 * 24 * 60 * 60 * 1000),
        role: 'lead',
      },
      {
        initiativeId: clientPortalInit.id,
        teamId: devTeam.id,
        hoursAllocated: 200,
        startDate: new Date(q1Start.getTime() + 30 * 24 * 60 * 60 * 1000),
        endDate: q2End,
        role: 'lead',
      },
      // Security assignments
      {
        initiativeId: securityInit.id,
        teamId: devTeam.id,
        hoursAllocated: 160,
        startDate: q1Start,
        endDate: q1End,
        role: 'lead',
      },
      {
        initiativeId: securityInit.id,
        teamId: opsTeam.id,
        hoursAllocated: 40,
        startDate: q1Start,
        endDate: q1End,
        role: 'contributor',
      },
      // Training assignments
      {
        initiativeId: trainingInit.id,
        teamId: opsTeam.id,
        hoursAllocated: 80,
        startDate: q2Start,
        endDate: q3End,
        role: 'lead',
      },
      {
        initiativeId: trainingInit.id,
        teamId: designTeam.id,
        hoursAllocated: 40,
        startDate: q2Start,
        endDate: new Date(q2Start.getTime() + 60 * 24 * 60 * 60 * 1000),
        role: 'contributor',
      },
      // Marketing assignments
      {
        initiativeId: marketingInit.id,
        teamId: marketingTeam.id,
        hoursAllocated: 200,
        startDate: q3Start,
        endDate: q4End,
        role: 'lead',
      },
      {
        initiativeId: marketingInit.id,
        teamId: devTeam.id,
        hoursAllocated: 80,
        startDate: new Date(q3Start.getTime() + 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(q3Start.getTime() + 90 * 24 * 60 * 60 * 1000),
        role: 'contributor',
      },
      // PM Tool assignments
      {
        initiativeId: pmToolInit.id,
        teamId: opsTeam.id,
        hoursAllocated: 100,
        startDate: q4Start,
        endDate: q4End,
        role: 'lead',
      },
      {
        initiativeId: pmToolInit.id,
        teamId: devTeam.id,
        hoursAllocated: 60,
        startDate: q4Start,
        endDate: q4End,
        role: 'contributor',
      },
    ],
  });

  // Sample issues for demonstration
  await prisma.issue.create({
    data: {
      description:
        'Critical security vulnerability in customer database access controls needs immediate attention',
      votes: 15,
      heatmapScore: 95,
    },
  });

  await prisma.issue.create({
    data: {
      description:
        'Project timeline management process is causing delays and client dissatisfaction',
      votes: 8,
      heatmapScore: 75,
    },
  });

  await prisma.issue.create({
    data: {
      description: 'Staff training documentation is outdated and not user-friendly',
      votes: 5,
      heatmapScore: 45,
    },
  });

  await prisma.issue.create({
    data: {
      description: 'Office lighting in the design area could be improved for better productivity',
      votes: 3,
      heatmapScore: 25,
    },
  });

  // Create additional leadership team members for collaboration
  const ctoUser = await prisma.user.create({
    data: {
      email: 'cto@example.com',
      passwordHash: await bcrypt.hash('Password123!', 10),
      role: 'LEADER',
      name: 'Sarah Johnson',
    },
  });

  const vpUser = await prisma.user.create({
    data: {
      email: 'vp@example.com',
      passwordHash: await bcrypt.hash('Password123!', 10),
      role: 'LEADER',
      name: 'Michael Chen',
    },
  });

  const pmUser = await prisma.user.create({
    data: {
      email: 'pm@example.com',
      passwordHash: await bcrypt.hash('Password123!', 10),
      role: 'LEADER',
      name: 'Jessica Rodriguez',
    },
  });

  // Create comprehensive comments for initiatives showing collaboration
  await prisma.comment.create({
    data: {
      content:
        'I think we should prioritize the user feedback integration aspect of this portal. Our current approval process lacks visibility into client sentiment, which is causing delays.',
      authorId: ctoUser.id,
      initiativeId: clientPortalInit.id,
      mentions: [admin.id, vpUser.id],
    },
  });

  await prisma.comment.create({
    data: {
      content:
        '@Sarah makes a great point about client sentiment. We should also consider adding automated notifications to reduce the back-and-forth emails. This could cut approval time by 40%.',
      authorId: vpUser.id,
      initiativeId: clientPortalInit.id,
      mentions: [ctoUser.id, admin.id],
    },
  });

  await prisma.comment.create({
    data: {
      content:
        "From a project management perspective, the timeline looks aggressive. Based on our team's current capacity, I'd suggest adding 2-3 weeks buffer for thorough testing.",
      authorId: pmUser.id,
      initiativeId: clientPortalInit.id,
      mentions: [admin.id],
    },
  });

  // Add reply to demonstrate threaded conversations
  const parentComment = await prisma.comment.findFirst({
    where: { authorId: ctoUser.id },
  });

  await prisma.comment.create({
    data: {
      content:
        'Agreed on the sentiment tracking. I can work with the development team to scope out the technical requirements for real-time feedback integration.',
      authorId: admin.id,
      parentId: parentComment.id,
      initiativeId: clientPortalInit.id,
    },
  });

  // Create strategic ideas from leadership team
  const ideaPerformance = await prisma.idea.create({
    data: {
      title: 'Real-time Performance Dashboard',
      description:
        'Create a live dashboard showing key project metrics, team utilization, and client satisfaction scores. This would give leadership instant visibility into operations.',
      authorId: ctoUser.id,
      category: 'technology',
      priority: 'high',
      status: 'reviewing',
      votes: 0,
      tags: ['dashboard', 'metrics', 'real-time', 'leadership'],
    },
  });

  const ideaRemoteWork = await prisma.idea.create({
    data: {
      title: 'Hybrid Work Policy Enhancement',
      description:
        'Develop comprehensive remote collaboration tools and policies to improve team productivity and work-life balance. Include virtual brainstorming tools and async communication protocols.',
      authorId: vpUser.id,
      category: 'process',
      priority: 'medium',
      status: 'idea',
      votes: 0,
      tags: ['remote-work', 'collaboration', 'policy', 'productivity'],
    },
  });

  const ideaClientPortal = await prisma.idea.create({
    data: {
      title: 'Client Self-Service Portal',
      description:
        'Allow clients to track project progress, submit feedback, and access deliverables independently. This would reduce PM workload and improve client satisfaction.',
      authorId: pmUser.id,
      category: 'strategy',
      priority: 'high',
      status: 'approved',
      votes: 0,
      tags: ['client-experience', 'automation', 'self-service'],
      initiativeId: clientPortalInit.id, // Link to existing initiative
    },
  });

  const ideaTraining = await prisma.idea.create({
    data: {
      title: 'AI-Powered Skill Development Platform',
      description:
        'Implement personalized learning paths for team members based on project needs and career goals. Use AI to recommend training and track skill progression.',
      authorId: admin.id,
      category: 'technology',
      priority: 'medium',
      status: 'idea',
      votes: 0,
      tags: ['ai', 'training', 'skill-development', 'personalization'],
    },
  });

  // Create voting examples showing leadership engagement
  await prisma.vote.create({
    data: {
      userId: admin.id,
      ideaId: ideaPerformance.id,
      type: 'up',
      value: 1,
    },
  });

  await prisma.vote.create({
    data: {
      userId: vpUser.id,
      ideaId: ideaPerformance.id,
      type: 'up',
      value: 1,
    },
  });

  await prisma.vote.create({
    data: {
      userId: pmUser.id,
      ideaId: ideaClientPortal.id,
      type: 'priority',
      value: 2,
    },
  });

  await prisma.vote.create({
    data: {
      userId: ctoUser.id,
      ideaId: ideaRemoteWork.id,
      type: 'up',
      value: 1,
    },
  });

  // Add initiative voting for prioritization
  await prisma.vote.create({
    data: {
      userId: ctoUser.id,
      initiativeId: clientPortalInit.id,
      type: 'priority',
      value: 3,
    },
  });

  await prisma.vote.create({
    data: {
      userId: vpUser.id,
      initiativeId: marketingInit.id,
      type: 'priority',
      value: 2,
    },
  });

  // Add comments to issues showing collaborative problem-solving
  const criticalIssue = await prisma.issue.findFirst({
    where: { heatmapScore: 95 },
  });

  await prisma.comment.create({
    data: {
      content:
        'This is definitely our top priority. The security breach risk is too high to ignore. I recommend we allocate emergency resources to address this immediately.',
      authorId: ctoUser.id,
      issueId: criticalIssue.id,
      mentions: [admin.id, vpUser.id],
    },
  });

  await prisma.comment.create({
    data: {
      content:
        "Agreed. From a business continuity perspective, we should also conduct a full security audit while we're addressing this. Better to be proactive.",
      authorId: vpUser.id,
      issueId: criticalIssue.id,
      mentions: [ctoUser.id],
    },
  });

  // Add milestone comments showing progress updates
  const apiMilestone = await prisma.milestone.findFirst({
    where: { title: 'Backend API Development' },
  });

  await prisma.comment.create({
    data: {
      content:
        "Development is progressing well. We've completed the authentication module and are now working on the approval workflow APIs. On track for completion next week.",
      authorId: pmUser.id,
      milestoneId: apiMilestone.id,
      mentions: [admin.id],
    },
  });

  await prisma.comment.create({
    data: {
      content:
        'Excellent progress! Make sure we include comprehensive error handling and logging. This will be critical for debugging in production.',
      authorId: ctoUser.id,
      milestoneId: apiMilestone.id,
      mentions: [pmUser.id],
    },
  });

  // Update idea vote counts based on votes created
  await prisma.idea.update({
    where: { id: ideaPerformance.id },
    data: { votes: 2 },
  });

  await prisma.idea.update({
    where: { id: ideaRemoteWork.id },
    data: { votes: 1 },
  });

  await prisma.idea.update({
    where: { id: ideaClientPortal.id },
    data: { votes: 1 },
  });

  console.log('Comprehensive seed data with collaboration features inserted');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
