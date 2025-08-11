/* eslint-disable @typescript-eslint/no-var-requires */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creating advanced requirement card scenarios...');

  // Get existing users and initiatives
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const ctoUser = await prisma.user.findFirst({ where: { email: 'cto@example.com' } });
  const vpUser = await prisma.user.findFirst({ where: { email: 'vp@example.com' } });
  const pmUser = await prisma.user.findFirst({ where: { email: 'pm@example.com' } });

  const clientPortalInit = await prisma.initiative.findFirst({ where: { title: 'Client Portal Enhancement' } });
  const trainingInit = await prisma.initiative.findFirst({ where: { title: 'Training Documentation Overhaul' } });

  // ===== ADVANCED SCENARIO 1: COMPLEX APPROVAL WORKFLOW =====
  console.log('⚡ Creating complex approval workflow cards...');

  const complexCard = await prisma.requirementCard.create({
    data: {
      initiativeId: clientPortalInit.id,
      type: 'BUSINESS',
      title: 'Cross-Department Budget Approval Matrix',
      description: 'For projects exceeding $10K, implement a complex approval matrix requiring sign-off from Finance, Legal, and department heads. The system must support parallel approvals with escalation paths and automatic delegation during absences.',
      priority: 'CRITICAL',
      status: 'REVIEW',
      category: 'Governance',
      assignedToId: vpUser.id,
      createdById: admin.id,
      orderIndex: 5,
    },
  });

  // Add multiple stakeholder comments showing different perspectives
  await prisma.comment.create({
    data: {
      content: "This is essential for our SOX compliance. Finance needs visibility into all significant expenditures before they're committed. The approval matrix should also include automatic routing based on GL account codes.",
      authorId: admin.id,
      requirementCardId: complexCard.id,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.comment.create({
    data: {
      content: "From a technical perspective, this will require integration with our HR system to get current org chart and delegation settings. We also need to handle edge cases like circular delegation chains.",
      authorId: ctoUser.id,
      requirementCardId: complexCard.id,
      mentions: [admin.id],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.comment.create({
    data: {
      content: "Legal review shows we need audit trails for all approvals including timestamps, IP addresses, and digital signatures for contracts over $50K. This should integrate with DocuSign or similar.",
      authorId: vpUser.id,
      requirementCardId: complexCard.id,
      mentions: [ctoUser.id, admin.id],
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
  });

  await prisma.comment.create({
    data: {
      content: "Let's also consider mobile approval workflows. Department heads are often traveling and need to approve from their phones. Push notifications with approval preview would be helpful.",
      authorId: pmUser.id,
      requirementCardId: complexCard.id,
      mentions: [vpUser.id],
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
  });

  await prisma.comment.create({
    data: {
      content: "Good points all around. I'll break this down into smaller cards: 1) Core approval matrix, 2) HR integration, 3) Legal compliance features, 4) Mobile optimization. This is too complex for a single requirement.",
      authorId: vpUser.id,
      requirementCardId: complexCard.id,
      mentions: [admin.id, ctoUser.id, pmUser.id],
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
  });

  // ===== ADVANCED SCENARIO 2: REJECTED CARD WITH FEEDBACK =====
  console.log('❌ Creating rejected card scenario...');

  const rejectedCard = await prisma.requirementCard.create({
    data: {
      initiativeId: trainingInit.id,
      type: 'FUNCTIONAL',
      title: 'AI-Powered Personalized Learning Paths',
      description: 'Implement machine learning algorithms to create personalized learning paths based on user behavior, learning speed, knowledge gaps, and career goals. The system should continuously adapt content difficulty and pacing.',
      priority: 'LOW',
      status: 'REJECTED',
      category: 'AI/ML',
      assignedToId: ctoUser.id,
      createdById: pmUser.id,
      orderIndex: 4,
    },
  });

  await prisma.comment.create({
    data: {
      content: "While this sounds amazing, the complexity and cost would be enormous. We'd need a dedicated AI team, massive amounts of training data, and at least 12-18 months of development. Let's focus on the core training platform first.",
      authorId: ctoUser.id,
      requirementCardId: rejectedCard.id,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.comment.create({
    data: {
      content: "I agree with @sarah. This is a phase 3 or 4 feature at best. For our MVP, simple role-based learning paths would meet 90% of our needs. We can add basic recommendations later based on completion patterns.",
      authorId: admin.id,
      requirementCardId: rejectedCard.id,
      mentions: [ctoUser.id],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.comment.create({
    data: {
      content: "Fair points. I'll create a simpler requirement for role-based learning tracks with basic progress-based recommendations. We can revisit AI personalization once we have data and proven ROI from the basic system.",
      authorId: pmUser.id,
      requirementCardId: rejectedCard.id,
      mentions: [admin.id, ctoUser.id],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // ===== ADVANCED SCENARIO 3: HIGH-URGENCY SECURITY REQUIREMENT =====
  console.log('🔥 Creating urgent security requirement...');

  const urgentCard = await prisma.requirementCard.create({
    data: {
      initiativeId: clientPortalInit.id,
      type: 'FUNCTIONAL',
      title: 'Emergency Data Breach Response System',
      description: 'Implement automated data breach detection and response system with immediate client notification capabilities, data forensics logging, and regulatory compliance reporting. Must include kill switches for immediate system lockdown.',
      priority: 'CRITICAL',
      status: 'APPROVED',
      category: 'Security',
      assignedToId: ctoUser.id,
      createdById: admin.id,
      approvedById: vpUser.id,
      approvedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      orderIndex: 6,
    },
  });

  await prisma.comment.create({
    data: {
      content: "URGENT: This came out of our security audit findings. We need this implemented ASAP. The auditors specifically called out our lack of automated breach response. This is now a critical compliance requirement.",
      authorId: admin.id,
      requirementCardId: urgentCard.id,
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    },
  });

  await prisma.comment.create({
    data: {
      content: "I've already started researching solutions. AWS GuardDuty + custom Lambda functions for response automation looks promising. I'll have a technical design ready by Friday.",
      authorId: ctoUser.id,
      requirementCardId: urgentCard.id,
      mentions: [admin.id],
      createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000),
    },
  });

  await prisma.comment.create({
    data: {
      content: "Approved for emergency implementation. Let's pull resources from the marketing platform project if needed. Security compliance is non-negotiable.",
      authorId: vpUser.id,
      requirementCardId: urgentCard.id,
      mentions: [ctoUser.id, admin.id],
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
  });

  // ===== ADVANCED SCENARIO 4: DETAILED ACCEPTANCE CRITERIA =====
  console.log('✅ Creating detailed acceptance criteria card...');

  const acceptanceCard = await prisma.requirementCard.create({
    data: {
      initiativeId: clientPortalInit.id,
      type: 'ACCEPTANCE',
      title: 'Performance and Load Testing Criteria',
      description: `System must meet the following performance criteria under load:
      
• Page load times: <2 seconds for 95% of requests
• API response times: <500ms for 99% of endpoints  
• Concurrent users: Support 1000+ simultaneous users
• Database queries: <100ms for 95% of queries
• File uploads: Support 100MB files with progress indicators
• Search functionality: <1 second for complex searches
• Mobile performance: Same criteria on 3G connections
• Uptime: 99.9% availability with <5 minute MTTR
• Browser support: Chrome, Firefox, Safari, Edge (latest 2 versions)
• Accessibility: WCAG 2.1 AA compliance validated by automated testing`,
      priority: 'HIGH',
      status: 'APPROVED',
      category: 'Performance',
      assignedToId: ctoUser.id,
      createdById: pmUser.id,
      approvedById: admin.id,
      approvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      orderIndex: 7,
    },
  });

  await prisma.comment.create({
    data: {
      content: "These are aggressive but achievable targets. I recommend we implement performance monitoring from day one and set up automated alerts if we fall below these thresholds.",
      authorId: ctoUser.id,
      requirementCardId: acceptanceCard.id,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.comment.create({
    data: {
      content: "For load testing, let's use a combination of synthetic and real-world scenarios. I'll work with the QA team to create user journey scripts that simulate actual client workflows.",
      authorId: pmUser.id,
      requirementCardId: acceptanceCard.id,
      mentions: [ctoUser.id],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.comment.create({
    data: {
      content: "Don't forget to test with realistic data volumes. Our largest client has 50K+ projects in their database. Performance testing should include data migration scenarios too.",
      authorId: admin.id,
      requirementCardId: acceptanceCard.id,
      mentions: [pmUser.id],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // ===== ADVANCED SCENARIO 5: INTEGRATION COMPLEXITY =====
  console.log('🔗 Creating complex integration requirement...');

  const integrationComplexCard = await prisma.requirementCard.create({
    data: {
      initiativeId: clientPortalInit.id,
      type: 'FUNCTIONAL',
      title: 'Legacy System Integration Bridge',
      description: 'Create integration layer for 3 legacy systems: Mainframe AS/400 for financial data (COBOL/DB2), Oracle ERP for resource management, and custom FileMaker database for historical projects. Must handle data transformation, conflict resolution, and maintain referential integrity across systems.',
      priority: 'HIGH',
      status: 'REVIEW',
      category: 'Integration',
      assignedToId: ctoUser.id,
      createdById: vpUser.id,
      orderIndex: 8,
    },
  });

  await prisma.comment.create({
    data: {
      content: "This is going to be the most challenging part of the project. The AS/400 system dates back to 1995 and has no modern APIs. We'll need to set up job queues and file-based data exchange.",
      authorId: ctoUser.id,
      requirementCardId: integrationComplexCard.id,
      createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
    },
  });

  await prisma.comment.create({
    data: {
      content: "Can we phase out the AS/400 dependency? It's been on our technical debt list for years. This might be the perfect opportunity to migrate that financial data to a modern system.",
      authorId: vpUser.id,
      requirementCardId: integrationComplexCard.id,
      mentions: [ctoUser.id],
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    },
  });

  await prisma.comment.create({
    data: {
      content: "Migration would take 6-12 months and require accounting team training. For this project timeline, let's build the integration bridge and plan AS/400 migration as a separate initiative.",
      authorId: admin.id,
      requirementCardId: integrationComplexCard.id,
      mentions: [vpUser.id, ctoUser.id],
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
  });

  await prisma.comment.create({
    data: {
      content: "Agreed. I'll design the integration layer to be loosely coupled so we can swap out the AS/400 connection later without affecting the portal. ETL pipeline with error handling and data validation will be key.",
      authorId: ctoUser.id,
      requirementCardId: integrationComplexCard.id,
      mentions: [admin.id],
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
  });

  // ===== ADVANCED SCENARIO 6: USER EXPERIENCE FOCUS =====
  console.log('🎨 Creating UX-focused requirement...');

  const uxCard = await prisma.requirementCard.create({
    data: {
      initiativeId: trainingInit.id,
      type: 'BUSINESS',
      title: 'Inclusive Learning Experience Design',
      description: 'Design learning interface that accommodates diverse learning styles, disabilities, and cultural backgrounds. Include support for dyslexia-friendly fonts, high contrast modes, keyboard navigation, screen reader compatibility, and multi-language content with RTL text support.',
      priority: 'MEDIUM',
      status: 'DRAFT',
      category: 'Accessibility',
      assignedToId: pmUser.id,
      createdById: vpUser.id,
      orderIndex: 5,
    },
  });

  await prisma.comment.create({
    data: {
      content: "This aligns perfectly with our DEI initiatives. We should also consider cognitive load factors - some team members have ADHD and need content broken into smaller chunks with progress indicators.",
      authorId: vpUser.id,
      requirementCardId: uxCard.id,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
  });

  await prisma.comment.create({
    data: {
      content: "From a technical standpoint, we should follow WCAG 2.1 AAA guidelines where possible. I recommend user testing with actual users who have disabilities, not just automated accessibility tools.",
      authorId: ctoUser.id,
      requirementCardId: uxCard.id,
      mentions: [vpUser.id],
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
  });

  await prisma.comment.create({
    data: {
      content: "Great suggestions! I'll reach out to our employee resource groups to get volunteers for usability testing. We should also budget for professional accessibility consultants to review our designs.",
      authorId: pmUser.id,
      requirementCardId: uxCard.id,
      mentions: [ctoUser.id, vpUser.id],
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Advanced requirement card scenarios created!');
  console.log(`
🎯 Advanced scenarios added:
• Complex approval workflow with multi-stakeholder input
• Rejected AI requirement with constructive feedback
• Urgent security requirement with fast-track approval
• Detailed acceptance criteria with comprehensive metrics
• Legacy system integration challenges and solutions
• Inclusive UX design with accessibility focus

💡 These scenarios demonstrate:
• Real-world complexity and stakeholder dynamics
• Different approval paths and timelines
• Technical constraints and business trade-offs
• Collaborative problem-solving in comments
• Diverse requirement types and priorities
• Professional communication patterns
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error creating advanced scenarios:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });