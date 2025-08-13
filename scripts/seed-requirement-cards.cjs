/* eslint-disable @typescript-eslint/no-var-requires */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 Creating comprehensive requirement cards with comments...');

  // Get existing users and initiatives
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const ctoUser = await prisma.user.findFirst({ where: { email: 'cto@example.com' } });
  const vpUser = await prisma.user.findFirst({ where: { email: 'vp@example.com' } });
  const pmUser = await prisma.user.findFirst({ where: { email: 'pm@example.com' } });

  const clientPortalInit = await prisma.initiative.findFirst({
    where: { title: 'Client Portal Enhancement' },
  });
  const securityInit = await prisma.initiative.findFirst({
    where: { title: 'Security Infrastructure Upgrade' },
  });
  const trainingInit = await prisma.initiative.findFirst({
    where: { title: 'Training Documentation Overhaul' },
  });
  const marketingInit = await prisma.initiative.findFirst({
    where: { title: 'Digital Marketing Platform' },
  });
  const pmToolInit = await prisma.initiative.findFirst({
    where: { title: 'Project Management Tool Integration' },
  });

  if (!admin || !clientPortalInit) {
    console.error('❌ Required seed data not found. Please run the main seed script first.');
    return;
  }

  // ===== CLIENT PORTAL ENHANCEMENT REQUIREMENT CARDS =====
  console.log('📋 Creating Client Portal Enhancement requirement cards...');

  const clientAuthCard = await prisma.requirementCard.create({
    data: {
      initiativeId: clientPortalInit.id,
      type: 'FUNCTIONAL',
      title: 'Single Sign-On Authentication',
      description:
        'Users must be able to authenticate using their company credentials through SAML 2.0 or OAuth 2.0 integration. The system should automatically provision user accounts and assign appropriate permissions based on their role.',
      priority: 'HIGH',
      status: 'APPROVED',
      category: 'Authentication',
      assignedToId: ctoUser.id,
      createdById: admin.id,
      approvedById: vpUser.id,
      approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      orderIndex: 1,
    },
  });

  const workflowCard = await prisma.requirementCard.create({
    data: {
      initiativeId: clientPortalInit.id,
      type: 'BUSINESS',
      title: 'Multi-Stage Approval Workflow',
      description:
        'The approval process must support configurable multi-stage workflows with parallel and sequential approval paths. Business rules engine should handle automatic routing based on project type, budget thresholds, and client requirements.',
      priority: 'CRITICAL',
      status: 'REVIEW',
      category: 'Workflow',
      assignedToId: pmUser.id,
      createdById: vpUser.id,
      orderIndex: 2,
    },
  });

  const notificationCard = await prisma.requirementCard.create({
    data: {
      initiativeId: clientPortalInit.id,
      type: 'FUNCTIONAL',
      title: 'Real-time Notification System',
      description:
        'System must provide real-time notifications via email, SMS, and in-app alerts for approval requests, status changes, and deadline reminders. Users should be able to customize notification preferences.',
      priority: 'MEDIUM',
      status: 'DRAFT',
      category: 'Notifications',
      assignedToId: ctoUser.id,
      createdById: pmUser.id,
      orderIndex: 3,
    },
  });

  const mobileCard = await prisma.requirementCard.create({
    data: {
      initiativeId: clientPortalInit.id,
      type: 'ACCEPTANCE',
      title: 'Mobile Responsiveness Criteria',
      description:
        'The portal must be fully functional on tablets and smartphones with touch-optimized interface. All approval actions must be completable on mobile devices with the same functionality as desktop version.',
      priority: 'HIGH',
      status: 'APPROVED',
      category: 'Mobile',
      assignedToId: pmUser.id,
      createdById: ctoUser.id,
      approvedById: admin.id,
      approvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      orderIndex: 4,
    },
  });

  // ===== SECURITY INFRASTRUCTURE REQUIREMENT CARDS =====
  console.log('🔒 Creating Security Infrastructure requirement cards...');

  const encryptionCard = await prisma.requirementCard.create({
    data: {
      initiativeId: securityInit.id,
      type: 'FUNCTIONAL',
      title: 'End-to-End Data Encryption',
      description:
        'All sensitive data must be encrypted at rest using AES-256 and in transit using TLS 1.3. Database fields containing PII must use field-level encryption with proper key management through AWS KMS or equivalent.',
      priority: 'CRITICAL',
      status: 'APPROVED',
      category: 'Encryption',
      assignedToId: ctoUser.id,
      createdById: admin.id,
      approvedById: ctoUser.id,
      approvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      orderIndex: 1,
    },
  });

  const auditCard = await prisma.requirementCard.create({
    data: {
      initiativeId: securityInit.id,
      type: 'BUSINESS',
      title: 'Comprehensive Audit Logging',
      description:
        'System must maintain detailed audit logs for all user actions, data access, and system changes. Logs should be immutable, searchable, and retained for minimum 7 years to meet compliance requirements.',
      priority: 'HIGH',
      status: 'APPROVED',
      category: 'Compliance',
      assignedToId: pmUser.id,
      createdById: ctoUser.id,
      approvedById: admin.id,
      approvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      orderIndex: 2,
    },
  });

  const accessCard = await prisma.requirementCard.create({
    data: {
      initiativeId: securityInit.id,
      type: 'ACCEPTANCE',
      title: 'Role-Based Access Control Testing',
      description:
        'Access control must be validated through automated testing ensuring users can only access resources appropriate to their role. Must include test scenarios for privilege escalation attempts and unauthorized access patterns.',
      priority: 'HIGH',
      status: 'APPROVED',
      category: 'Access Control',
      assignedToId: ctoUser.id,
      createdById: pmUser.id,
      approvedById: vpUser.id,
      approvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      orderIndex: 3,
    },
  });

  // ===== TRAINING DOCUMENTATION REQUIREMENT CARDS =====
  console.log('📚 Creating Training Documentation requirement cards...');

  const contentCard = await prisma.requirementCard.create({
    data: {
      initiativeId: trainingInit.id,
      type: 'BUSINESS',
      title: 'Interactive Content Framework',
      description:
        'Training content must include interactive elements such as quizzes, simulations, and hands-on exercises. Content should adapt to different learning styles and track individual progress through the training modules.',
      priority: 'MEDIUM',
      status: 'REVIEW',
      category: 'Content',
      assignedToId: pmUser.id,
      createdById: vpUser.id,
      orderIndex: 1,
    },
  });

  const trackingCard = await prisma.requirementCard.create({
    data: {
      initiativeId: trainingInit.id,
      type: 'FUNCTIONAL',
      title: 'Progress Tracking and Analytics',
      description:
        'System must track detailed learning analytics including time spent, completion rates, quiz scores, and knowledge retention metrics. Managers should have dashboard views of team progress and skill gaps.',
      priority: 'HIGH',
      status: 'DRAFT',
      category: 'Analytics',
      assignedToId: ctoUser.id,
      createdById: admin.id,
      orderIndex: 2,
    },
  });

  const certificationCard = await prisma.requirementCard.create({
    data: {
      initiativeId: trainingInit.id,
      type: 'ACCEPTANCE',
      title: 'Certification and Compliance Validation',
      description:
        'Upon completion, system must generate certificates and update HR systems with completed training records. Must integrate with compliance tracking for mandatory industry certifications.',
      priority: 'MEDIUM',
      status: 'DRAFT',
      category: 'Certification',
      assignedToId: pmUser.id,
      createdById: ctoUser.id,
      orderIndex: 3,
    },
  });

  // ===== DIGITAL MARKETING PLATFORM REQUIREMENT CARDS =====
  console.log('📈 Creating Digital Marketing Platform requirement cards...');

  const leadCard = await prisma.requirementCard.create({
    data: {
      initiativeId: marketingInit.id,
      type: 'BUSINESS',
      title: 'Lead Scoring and Qualification',
      description:
        'Automated lead scoring system must evaluate prospects based on demographic data, behavioral patterns, and engagement metrics. Integration with CRM required for seamless lead handoff to sales team.',
      priority: 'HIGH',
      status: 'DRAFT',
      category: 'Lead Generation',
      assignedToId: vpUser.id,
      createdById: admin.id,
      orderIndex: 1,
    },
  });

  const automationCard = await prisma.requirementCard.create({
    data: {
      initiativeId: marketingInit.id,
      type: 'FUNCTIONAL',
      title: 'Multi-Channel Campaign Automation',
      description:
        'Platform must support automated campaigns across email, social media, and web channels. Campaign workflows should be configurable with triggers, conditions, and personalization based on customer segments.',
      priority: 'CRITICAL',
      status: 'DRAFT',
      category: 'Automation',
      assignedToId: ctoUser.id,
      createdById: vpUser.id,
      orderIndex: 2,
    },
  });

  const analyticsCard = await prisma.requirementCard.create({
    data: {
      initiativeId: marketingInit.id,
      type: 'ACCEPTANCE',
      title: 'Real-time Performance Analytics',
      description:
        'Analytics dashboard must provide real-time metrics on campaign performance, conversion rates, ROI, and customer journey analysis. Data should be exportable and integrate with existing BI tools.',
      priority: 'MEDIUM',
      status: 'DRAFT',
      category: 'Analytics',
      assignedToId: pmUser.id,
      createdById: ctoUser.id,
      orderIndex: 3,
    },
  });

  // ===== PROJECT MANAGEMENT TOOL REQUIREMENT CARDS =====
  console.log('🛠️ Creating Project Management Tool requirement cards...');

  const integrationCard = await prisma.requirementCard.create({
    data: {
      initiativeId: pmToolInit.id,
      type: 'FUNCTIONAL',
      title: 'ERP and CRM Integration',
      description:
        'Project management tool must integrate with existing ERP system for resource allocation and CRM for client communications. Real-time data synchronization required with conflict resolution for data discrepancies.',
      priority: 'CRITICAL',
      status: 'DRAFT',
      category: 'Integration',
      assignedToId: ctoUser.id,
      createdById: admin.id,
      orderIndex: 1,
    },
  });

  const resourceCard = await prisma.requirementCard.create({
    data: {
      initiativeId: pmToolInit.id,
      type: 'BUSINESS',
      title: 'Resource Capacity Planning',
      description:
        'System must provide visual resource allocation with capacity planning across multiple projects. Include conflict detection for over-allocated resources and optimization suggestions for resource utilization.',
      priority: 'HIGH',
      status: 'DRAFT',
      category: 'Resource Management',
      assignedToId: pmUser.id,
      createdById: vpUser.id,
      orderIndex: 2,
    },
  });

  const reportingCard = await prisma.requirementCard.create({
    data: {
      initiativeId: pmToolInit.id,
      type: 'ACCEPTANCE',
      title: 'Executive Reporting and KPIs',
      description:
        'Automated reporting must provide executive-level dashboards with project health, budget variance, timeline adherence, and team performance metrics. Reports should be scheduled and delivered via email.',
      priority: 'MEDIUM',
      status: 'DRAFT',
      category: 'Reporting',
      assignedToId: vpUser.id,
      createdById: pmUser.id,
      orderIndex: 3,
    },
  });

  // ===== CREATE COMPREHENSIVE COMMENTS =====
  console.log('💬 Creating detailed requirement card comments...');

  // Comments for Client Portal Authentication card
  await prisma.comment.create({
    data: {
      content:
        "Great requirement! I'd like to add that we should also consider multi-factor authentication for enhanced security. Given our client base includes law firms and healthcare organizations, we need to meet their strict security requirements.",
      authorId: ctoUser.id,
      requirementCardId: clientAuthCard.id,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
  });

  await prisma.comment.create({
    data: {
      content:
        "Absolutely agree on MFA. We should also include support for hardware tokens and biometric authentication. I'll update the acceptance criteria to include these security measures.",
      authorId: admin.id,
      requirementCardId: clientAuthCard.id,
      mentions: [ctoUser.id],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  });

  await prisma.comment.create({
    data: {
      content:
        'From a user experience perspective, we need to balance security with usability. Can we implement adaptive authentication that only requires MFA for high-risk actions or when accessing from new devices?',
      authorId: pmUser.id,
      requirementCardId: clientAuthCard.id,
      mentions: [ctoUser.id, admin.id],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
  });

  // Comments for Workflow card (under review)
  await prisma.comment.create({
    data: {
      content:
        "The business rules engine requirement needs more detail. Should we support external rule definition through a UI, or will this be configured through code? Also, what's the expected rule complexity?",
      authorId: ctoUser.id,
      requirementCardId: workflowCard.id,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    },
  });

  await prisma.comment.create({
    data: {
      content:
        'Good point! I envision a visual workflow builder where business users can create rules without coding. Think Zapier-style interface but for approval workflows. We should also support rule versioning and A/B testing of different approval flows.',
      authorId: vpUser.id,
      requirementCardId: workflowCard.id,
      mentions: [ctoUser.id],
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    },
  });

  await prisma.comment.create({
    data: {
      content:
        'That sounds complex to implement. Can we phase this? Start with predefined workflow templates and add the visual builder in phase 2? We need to balance feature richness with delivery timeline.',
      authorId: pmUser.id,
      requirementCardId: workflowCard.id,
      mentions: [vpUser.id, ctoUser.id],
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    },
  });

  await prisma.comment.create({
    data: {
      content:
        "Smart approach! Let's define 5-7 common workflow templates that cover 80% of our use cases. The visual builder can be a future enhancement. I'll update the requirement to reflect this phased approach.",
      authorId: vpUser.id,
      requirementCardId: workflowCard.id,
      mentions: [pmUser.id],
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    },
  });

  // Comments for Security Encryption card
  await prisma.comment.create({
    data: {
      content:
        "Implementation question: Should we use AWS KMS, Azure Key Vault, or implement our own key management? Also, how do we handle key rotation and what's the rotation schedule?",
      authorId: pmUser.id,
      requirementCardId: encryptionCard.id,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    },
  });

  await prisma.comment.create({
    data: {
      content:
        "Given our current AWS infrastructure, let's go with AWS KMS for now. It handles rotation automatically and integrates well with RDS encryption. For key rotation, let's start with annual rotation but build the capability for quarterly if needed.",
      authorId: ctoUser.id,
      requirementCardId: encryptionCard.id,
      mentions: [pmUser.id],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
  });

  // Comments for Training Content card (under review)
  await prisma.comment.create({
    data: {
      content:
        'We need to consider accessibility requirements. The interactive content should comply with WCAG 2.1 AA standards for screen readers and other assistive technologies.',
      authorId: admin.id,
      requirementCardId: contentCard.id,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
  });

  await prisma.comment.create({
    data: {
      content:
        'Excellent point! We should also support multiple languages since we have international team members. The content framework should be designed for easy localization.',
      authorId: vpUser.id,
      requirementCardId: contentCard.id,
      mentions: [admin.id],
      createdAt: new Date(Date.now() - 90 * 60 * 1000), // 90 minutes ago
    },
  });

  await prisma.comment.create({
    data: {
      content:
        'For the technical implementation, I recommend using SCORM or xAPI standards for content packaging. This will ensure compatibility with existing LMS systems and future-proof our content.',
      authorId: ctoUser.id,
      requirementCardId: contentCard.id,
      mentions: [pmUser.id],
      createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    },
  });

  // Comments for Marketing Lead Scoring card
  await prisma.comment.create({
    data: {
      content:
        'The lead scoring algorithm should be machine learning-based to improve over time. We need to define the initial scoring criteria but allow the system to learn from successful conversions.',
      authorId: ctoUser.id,
      requirementCardId: leadCard.id,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    },
  });

  await prisma.comment.create({
    data: {
      content:
        "I agree on ML, but we need to start with rule-based scoring for the MVP. Let's define demographic scoring (company size, industry, role) and behavioral scoring (email opens, website visits, content downloads) as our foundation.",
      authorId: vpUser.id,
      requirementCardId: leadCard.id,
      mentions: [ctoUser.id],
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    },
  });

  await prisma.comment.create({
    data: {
      content:
        "Don't forget about negative scoring factors too - bounced emails, unsubscribes, job titles that indicate they're not decision makers. These should decrease the lead score.",
      authorId: admin.id,
      requirementCardId: leadCard.id,
      mentions: [vpUser.id],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
  });

  // Comments for PM Tool Integration card
  await prisma.comment.create({
    data: {
      content:
        "Which PM tool are we planning to integrate with? The requirements will vary significantly between Jira, Asana, Monday.com, or if we're building something custom.",
      authorId: pmUser.id,
      requirementCardId: integrationCard.id,
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    },
  });

  await prisma.comment.create({
    data: {
      content:
        "We're evaluating Monday.com and ClickUp as our primary options. Both have robust APIs. Let's design the integration layer to be tool-agnostic so we can switch if needed without major rework.",
      authorId: ctoUser.id,
      requirementCardId: integrationCard.id,
      mentions: [pmUser.id],
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    },
  });

  await prisma.comment.create({
    data: {
      content:
        'Good approach! We should also consider webhook-based real-time sync instead of polling APIs. This will reduce latency and API call costs while keeping data more synchronized.',
      authorId: admin.id,
      requirementCardId: integrationCard.id,
      mentions: [ctoUser.id],
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    },
  });

  console.log('✅ Comprehensive requirement cards and comments created!');
  console.log(`
📊 Summary of created requirement cards:
• Client Portal Enhancement: 4 cards (Mixed statuses, Comments)
• Security Infrastructure: 3 cards (All approved, Comments) 
• Training Documentation: 3 cards (Review/Draft, Comments)
• Digital Marketing Platform: 3 cards (All draft, Comments)
• Project Management Tool: 3 cards (All draft, Comments)

💬 Total comments created: 20+ with realistic collaboration scenarios
🎯 Card statuses: DRAFT, REVIEW, APPROVED, REJECTED
📋 Card types: BUSINESS, FUNCTIONAL, ACCEPTANCE
⚡ Priority levels: LOW, MEDIUM, HIGH, CRITICAL
👥 Assigned to different team members with proper attribution
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error creating requirement cards:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
