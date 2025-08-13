/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * COMPREHENSIVE SHOWCASE SEED DATA FOR FLOWVISION
 * Morrison Architecture & Engineering - Digital Transformation Journey
 *
 * Expert Team Strategy: Complete user journeys showcasing all features
 * Scenarios: Critical failures, innovation, process improvement, quality, compliance
 * Coverage: Ideas → Issues → Clusters → Initiatives → Solutions → Tasks → Completion
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🏗️ COMPREHENSIVE FLOWVISION SHOWCASE - Morrison A&E Digital Transformation');
  console.log('📊 Creating realistic end-to-end scenarios with complete feature coverage...');

  // === CLEANUP: Complete data reset ===
  console.log('🧹 Clearing existing data...');

  await prisma.vote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.resourceAssignment.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.requirementCard.deleteMany();
  await prisma.idea.deleteMany();
  await prisma.issueSystemImpact.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.solutionTask.deleteMany();
  await prisma.initiativeSolution.deleteMany();
  await prisma.initiative.deleteMany();
  await prisma.issueCluster.deleteMany();
  await prisma.systemCategory.deleteMany();
  await prisma.team.deleteMany();
  await prisma.businessProfile.deleteMany();
  await prisma.auditLog.deleteMany();
  // AI-related tables
  await prisma.aIQualityFeedback.deleteMany();
  await prisma.aIUsageLog.deleteMany();
  await prisma.aIUserQuota.deleteMany();
  await prisma.aIPerformanceMetric.deleteMany();
  await prisma.aICacheEntry.deleteMany();
  await prisma.aIConfiguration.deleteMany();
  // NextAuth tables
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // === USERS & ORGANIZATIONAL STRUCTURE ===
  console.log('👥 Creating Morrison A&E team...');

  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  // Principal/CEO - Strategic oversight
  const principal = await prisma.user.create({
    data: {
      email: 'david.morrison@morrisonae.com',
      name: 'David Morrison',
      passwordHash,
      role: 'ADMIN',
      preferences: {
        dashboardLayout: 'executive',
        notificationPreferences: ['critical', 'strategic'],
        aiAssistanceLevel: 'high',
      },
    },
  });

  // Design Director - Creative and technical leadership
  const designDirector = await prisma.user.create({
    data: {
      email: 'sarah.chen@morrisonae.com',
      name: 'Sarah Chen',
      passwordHash,
      role: 'LEADER',
      preferences: {
        dashboardLayout: 'project-focused',
        notificationPreferences: ['design', 'client', 'deadlines'],
        aiAssistanceLevel: 'medium',
      },
    },
  });

  // Project Director - Operations and delivery
  const projectDirector = await prisma.user.create({
    data: {
      email: 'mike.rodriguez@morrisonae.com',
      name: 'Mike Rodriguez',
      passwordHash,
      role: 'LEADER',
      preferences: {
        dashboardLayout: 'operations',
        notificationPreferences: ['operations', 'deadlines', 'resources'],
        aiAssistanceLevel: 'high',
      },
    },
  });

  // Business Development Director - Growth and client relations
  const businessDev = await prisma.user.create({
    data: {
      email: 'jennifer.kim@morrisonae.com',
      name: 'Jennifer Kim',
      passwordHash,
      role: 'LEADER',
      preferences: {
        dashboardLayout: 'business-focused',
        notificationPreferences: ['client', 'opportunities', 'strategic'],
        aiAssistanceLevel: 'medium',
      },
    },
  });

  // Engineering Director - Technical systems and compliance
  const engineeringDirector = await prisma.user.create({
    data: {
      email: 'alex.thompson@morrisonae.com',
      name: 'Alex Thompson',
      passwordHash,
      role: 'LEADER',
      preferences: {
        dashboardLayout: 'technical',
        notificationPreferences: ['compliance', 'technical', 'quality'],
        aiAssistanceLevel: 'high',
      },
    },
  });

  // Business Profile for Morrison A&E
  await prisma.businessProfile.create({
    data: {
      userId: principal.id,
      industry: 'Architecture & Engineering',
      size: 125,
      metrics: {
        // Strategic Metrics
        clientSatisfactionScore: 8.2,
        projectDeliveryOnTime: 0.73,
        profitMarginTarget: 0.15,
        currentProfitMargin: 0.12,

        // Operational Metrics
        utilizationRate: 0.78,
        avgProjectDurationDays: 185,
        activeclientProjects: 28,

        // Growth Metrics
        revenueGrowthRate: 0.08,
        newClientAcquisition: 6,
        clientRetentionRate: 0.85,

        // Quality Metrics
        reworkPercentage: 0.14,
        codeComplianceRate: 0.96,
        safetyIncidents: 2,

        // Innovation Metrics
        digitalToolAdoption: 0.65,
        processImprovementInitiatives: 4,
        staffTrainingHours: 1240,
      },
    },
  });

  // === TEAMS & ORGANIZATIONAL STRUCTURE ===
  console.log('🏢 Creating department teams...');

  const architecturalDesign = await prisma.team.create({
    data: {
      name: 'Architectural Design',
      department: 'Design',
      capacity: 320, // 8 architects × 40 hours
      skills: [
        'Architectural Design',
        'AutoCAD',
        'Revit',
        'SketchUp',
        'Building Code Compliance',
        'Client Presentation',
        '3D Visualization',
        'Space Planning',
      ],
    },
  });

  const structuralEngineering = await prisma.team.create({
    data: {
      name: 'Structural Engineering',
      department: 'Engineering',
      capacity: 240, // 6 engineers × 40 hours
      skills: [
        'Structural Analysis',
        'Steel Design',
        'Concrete Design',
        'Foundation Design',
        'Seismic Design',
        'Load Calculations',
        'Engineering Software',
        'Code Compliance',
      ],
    },
  });

  const projectManagement = await prisma.team.create({
    data: {
      name: 'Project Management',
      department: 'Operations',
      capacity: 200, // 5 PMs × 40 hours
      skills: [
        'Project Coordination',
        'Schedule Management',
        'Budget Control',
        'Client Communication',
        'Risk Management',
        'Quality Control',
        'Vendor Management',
        'Construction Administration',
      ],
    },
  });

  const businessOperations = await prisma.team.create({
    data: {
      name: 'Business Operations',
      department: 'Administration',
      capacity: 160, // 4 staff × 40 hours
      skills: [
        'Business Development',
        'Contract Management',
        'Financial Management',
        'Human Resources',
        'IT Support',
        'Marketing',
        'Compliance',
        'Quality Assurance',
      ],
    },
  });

  // === SYSTEM CATEGORIES (A&E FIRM TAXONOMY) ===
  console.log('🏗️ Creating A&E firm system categories...');

  // TECHNOLOGY SYSTEMS
  const deltekSystem = await prisma.systemCategory.create({
    data: {
      name: 'Deltek (ERP)',
      description:
        'Enterprise resource planning for project management, accounting, and time tracking',
      type: 'TECHNOLOGY',
      industry: 'architecture',
      isDefault: true,
      isActive: true,
      color: '#2563EB',
      tags: ['erp', 'project-management', 'accounting', 'time-tracking'],
      usageCount: 8,
    },
  });

  const revitSystem = await prisma.systemCategory.create({
    data: {
      name: 'Autodesk Revit',
      description: 'Building Information Modeling (BIM) software for architectural design',
      type: 'TECHNOLOGY',
      industry: 'architecture',
      isDefault: true,
      isActive: true,
      color: '#0EA5E9',
      tags: ['bim', 'design', 'modeling', 'collaboration'],
      usageCount: 12,
    },
  });

  const autocadSystem = await prisma.systemCategory.create({
    data: {
      name: 'AutoCAD',
      description: 'Computer-aided design software for 2D and 3D drafting',
      type: 'TECHNOLOGY',
      industry: 'architecture',
      isDefault: true,
      isActive: true,
      color: '#0284C7',
      tags: ['cad', 'drafting', '2d', '3d'],
      usageCount: 15,
    },
  });

  const officeSystem = await prisma.systemCategory.create({
    data: {
      name: 'Microsoft Office 365',
      description: 'Office productivity suite including Teams, SharePoint, and email',
      type: 'TECHNOLOGY',
      industry: 'architecture',
      isDefault: true,
      isActive: true,
      color: '#1E40AF',
      tags: ['office', 'collaboration', 'email', 'documents'],
      usageCount: 25,
    },
  });

  // PROCESS SYSTEMS
  const designReview = await prisma.systemCategory.create({
    data: {
      name: 'Design Review Process',
      description: 'Multi-stage design review and approval workflow',
      type: 'PROCESS',
      industry: 'architecture',
      isDefault: true,
      isActive: true,
      color: '#10B981',
      tags: ['design', 'review', 'quality', 'approval'],
      usageCount: 6,
    },
  });

  const projectDelivery = await prisma.systemCategory.create({
    data: {
      name: 'Project Delivery',
      description: 'End-to-end project delivery from concept to construction',
      type: 'PROCESS',
      industry: 'architecture',
      isDefault: true,
      isActive: true,
      color: '#059669',
      tags: ['delivery', 'project', 'construction', 'phases'],
      usageCount: 8,
    },
  });

  const clientManagement = await prisma.systemCategory.create({
    data: {
      name: 'Client Management',
      description: 'Client relationship and communication management process',
      type: 'PROCESS',
      industry: 'architecture',
      isDefault: true,
      isActive: true,
      color: '#047857',
      tags: ['client', 'relationship', 'communication', 'satisfaction'],
      usageCount: 7,
    },
  });

  const qualityControl = await prisma.systemCategory.create({
    data: {
      name: 'Quality Control',
      description: 'Quality assurance and control processes for deliverables',
      type: 'PROCESS',
      industry: 'architecture',
      isDefault: true,
      isActive: true,
      color: '#065F46',
      tags: ['quality', 'control', 'assurance', 'standards'],
      usageCount: 5,
    },
  });

  // PEOPLE SYSTEMS
  const projectManagers = await prisma.systemCategory.create({
    data: {
      name: 'Project Managers',
      description: 'Project management team responsible for delivery coordination',
      type: 'PEOPLE',
      industry: 'architecture',
      isDefault: true,
      isActive: true,
      color: '#7C2D12',
      tags: ['pm', 'coordination', 'delivery', 'management'],
      usageCount: 5,
    },
  });

  const designTeamPeople = await prisma.systemCategory.create({
    data: {
      name: 'Design Team',
      description: 'Architects and designers responsible for creative solutions',
      type: 'PEOPLE',
      industry: 'architecture',
      isDefault: true,
      isActive: true,
      color: '#92400E',
      tags: ['architects', 'designers', 'creative', 'solutions'],
      usageCount: 8,
    },
  });

  const engineeringTeamPeople = await prisma.systemCategory.create({
    data: {
      name: 'Engineering Team',
      description: 'Structural and MEP engineers providing technical expertise',
      type: 'PEOPLE',
      industry: 'architecture',
      isDefault: true,
      isActive: true,
      color: '#A16207',
      tags: ['engineers', 'structural', 'mep', 'technical'],
      usageCount: 6,
    },
  });

  const clientStakeholders = await prisma.systemCategory.create({
    data: {
      name: 'Client Stakeholders',
      description: 'External clients and project stakeholders',
      type: 'PEOPLE',
      industry: 'architecture',
      isDefault: true,
      isActive: true,
      color: '#B45309',
      tags: ['clients', 'stakeholders', 'external', 'decision-makers'],
      usageCount: 12,
    },
  });

  // === IDEAS: Innovation and Improvement Suggestions ===
  console.log('💡 Creating innovative ideas...');

  const vrIdeaDate = new Date('2024-11-15');
  const droneIdeaDate = new Date('2024-12-02');
  const aiIdeaDate = new Date('2024-12-18');
  const sustainabilityIdeaDate = new Date('2025-01-08');

  const vrPresentationIdea = await prisma.idea.create({
    data: {
      title: 'VR Client Presentations',
      description:
        'Implement virtual reality presentations to allow clients to "walk through" designs before construction. This could significantly improve client satisfaction and reduce change orders during construction.',
      author: { connect: { id: designDirector.id } },
      status: 'reviewing',
      category: 'technology',
      priority: 'high',
      votes: 12,
      tags: ['vr', 'client-experience', 'innovation', 'competitive-advantage'],
      createdAt: vrIdeaDate,
      updatedAt: new Date('2024-12-20'),
    },
  });

  const droneInspectionIdea = await prisma.idea.create({
    data: {
      title: 'Drone Construction Inspections',
      description:
        'Use drones for construction progress monitoring and site inspections. This would improve safety, reduce travel time, and provide better documentation.',
      author: { connect: { id: engineeringDirector.id } },
      status: 'approved',
      category: 'process',
      priority: 'high',
      votes: 15,
      tags: ['drones', 'safety', 'inspections', 'documentation', 'efficiency'],
      createdAt: droneIdeaDate,
      updatedAt: new Date('2025-01-10'),
    },
  });

  const aiDesignIdea = await prisma.idea.create({
    data: {
      title: 'AI-Assisted Design Optimization',
      description:
        'Integrate AI tools to optimize building designs for energy efficiency, cost, and code compliance automatically during the design process.',
      author: { connect: { id: designDirector.id } },
      status: 'approved',
      category: 'technology',
      priority: 'medium',
      votes: 8,
      tags: ['ai', 'design-optimization', 'energy-efficiency', 'code-compliance'],
      createdAt: aiIdeaDate,
      updatedAt: new Date('2025-01-12'),
    },
  });

  const sustainabilityIdea = await prisma.idea.create({
    data: {
      title: 'Carbon Footprint Tracking',
      description:
        'Implement comprehensive carbon footprint tracking for all projects to support sustainability goals and attract environmentally conscious clients.',
      author: { connect: { id: businessDev.id } },
      status: 'idea',
      category: 'strategy',
      priority: 'medium',
      votes: 6,
      tags: ['sustainability', 'carbon-tracking', 'environmental', 'marketing'],
      createdAt: sustainabilityIdeaDate,
      updatedAt: sustainabilityIdeaDate,
    },
  });

  // === ISSUES: Real operational challenges ===
  console.log('⚠️ Creating operational issues...');

  // SCENARIO A: Critical System Failure Issues
  const deltekIssue1 = await prisma.issue.create({
    data: {
      description:
        'Deltek time tracking system frequently crashes during month-end, causing payroll delays and billing inaccuracies',
      votes: 18,
      heatmapScore: 95,
      createdAt: new Date('2024-12-15'),
      aiSummary:
        'Critical infrastructure failure affecting core business operations with financial impact',
      aiConfidence: 92,
      aiGeneratedAt: new Date('2024-12-15T10:30:00Z'),
      aiVersion: 'gpt-3.5-turbo',
    },
  });

  const deltekIssue2 = await prisma.issue.create({
    data: {
      description:
        "Project budget reports from Deltek are inconsistent and don't match actual expenses, creating client billing disputes",
      votes: 15,
      heatmapScore: 88,
      createdAt: new Date('2024-12-18'),
      aiSummary: 'Financial reporting inconsistencies impacting client relationships and cash flow',
      aiConfidence: 89,
      aiGeneratedAt: new Date('2024-12-18T14:15:00Z'),
      aiVersion: 'gpt-3.5-turbo',
    },
  });

  const deltekIssue3 = await prisma.issue.create({
    data: {
      description:
        'Deltek integration with AutoCAD is broken, preventing automatic time allocation to drawing tasks',
      votes: 12,
      heatmapScore: 76,
      createdAt: new Date('2024-12-20'),
      aiSummary:
        'System integration failure causing productivity loss and inaccurate project costing',
      aiConfidence: 85,
      aiGeneratedAt: new Date('2024-12-20T09:45:00Z'),
      aiVersion: 'gpt-3.5-turbo',
    },
  });

  // SCENARIO B: Design Process Issues
  const designIssue1 = await prisma.issue.create({
    data: {
      description:
        'Design review meetings consistently run 2+ hours over schedule due to lack of structured process',
      votes: 14,
      heatmapScore: 82,
      createdAt: new Date('2024-12-10'),
      aiSummary: 'Process inefficiency affecting project timelines and team productivity',
      aiConfidence: 87,
      aiGeneratedAt: new Date('2024-12-10T11:20:00Z'),
      aiVersion: 'gpt-3.5-turbo',
    },
  });

  const designIssue2 = await prisma.issue.create({
    data: {
      description:
        'Revit model coordination between disciplines is causing frequent conflicts and rework',
      votes: 16,
      heatmapScore: 85,
      createdAt: new Date('2024-12-12'),
      aiSummary: 'Collaboration breakdown leading to quality issues and project delays',
      aiConfidence: 91,
      aiGeneratedAt: new Date('2024-12-12T15:30:00Z'),
      aiVersion: 'gpt-3.5-turbo',
    },
  });

  const designIssue3 = await prisma.issue.create({
    data: {
      description:
        'Client presentation materials are inconsistent in format and quality across projects',
      votes: 9,
      heatmapScore: 65,
      createdAt: new Date('2024-12-14'),
      aiSummary: 'Brand inconsistency affecting professional image and client perception',
      aiConfidence: 78,
      aiGeneratedAt: new Date('2024-12-14T13:10:00Z'),
      aiVersion: 'gpt-3.5-turbo',
    },
  });

  // SCENARIO C: Client Management Issues
  const clientIssue1 = await prisma.issue.create({
    data: {
      description:
        'Clients frequently request changes late in design process, causing schedule delays and budget overruns',
      votes: 20,
      heatmapScore: 92,
      createdAt: new Date('2024-11-28'),
      aiSummary: 'Change management failure affecting project profitability and timelines',
      aiConfidence: 94,
      aiGeneratedAt: new Date('2024-11-28T16:45:00Z'),
      aiVersion: 'gpt-3.5-turbo',
    },
  });

  const clientIssue2 = await prisma.issue.create({
    data: {
      description:
        'Client communication is fragmented across email, phone, and meetings with no central tracking',
      votes: 11,
      heatmapScore: 70,
      createdAt: new Date('2024-12-05'),
      aiSummary: 'Communication breakdown leading to miscommunication and project inefficiencies',
      aiConfidence: 82,
      aiGeneratedAt: new Date('2024-12-05T10:15:00Z'),
      aiVersion: 'gpt-3.5-turbo',
    },
  });

  // SCENARIO D: Quality Control Issues
  const qualityIssue1 = await prisma.issue.create({
    data: {
      description:
        'Drawing QC process is inconsistent, leading to construction issues and change orders',
      votes: 13,
      heatmapScore: 79,
      createdAt: new Date('2024-12-08'),
      aiSummary: 'Quality control gaps leading to construction problems and client dissatisfaction',
      aiConfidence: 86,
      aiGeneratedAt: new Date('2024-12-08T14:25:00Z'),
      aiVersion: 'gpt-3.5-turbo',
    },
  });

  const qualityIssue2 = await prisma.issue.create({
    data: {
      description:
        'Code compliance checking is manual and error-prone, missing important requirements',
      votes: 17,
      heatmapScore: 87,
      createdAt: new Date('2024-12-22'),
      aiSummary: 'Compliance risk due to manual process limitations and human error potential',
      aiConfidence: 90,
      aiGeneratedAt: new Date('2024-12-22T11:30:00Z'),
      aiVersion: 'gpt-3.5-turbo',
    },
  });

  // SCENARIO E: Staff and Training Issues
  const staffIssue1 = await prisma.issue.create({
    data: {
      description:
        'New staff onboarding takes 6+ months due to lack of structured training program',
      votes: 8,
      heatmapScore: 68,
      createdAt: new Date('2024-12-03'),
      aiSummary: 'Training inefficiency affecting productivity and staff satisfaction',
      aiConfidence: 80,
      aiGeneratedAt: new Date('2024-12-03T09:15:00Z'),
      aiVersion: 'gpt-3.5-turbo',
    },
  });

  const staffIssue2 = await prisma.issue.create({
    data: {
      description:
        'Senior staff are overloaded with routine tasks, limiting time for high-value design work',
      votes: 10,
      heatmapScore: 72,
      createdAt: new Date('2024-12-25'),
      aiSummary: 'Resource allocation inefficiency limiting senior talent utilization',
      aiConfidence: 84,
      aiGeneratedAt: new Date('2024-12-25T10:45:00Z'),
      aiVersion: 'gpt-3.5-turbo',
    },
  });

  // === SYSTEM IMPACTS: Connect issues to affected systems ===
  console.log('🔗 Creating system impact relationships...');

  // Deltek system impacts
  await prisma.issueSystemImpact.createMany({
    data: [
      {
        issueId: deltekIssue1.id,
        systemCategoryId: deltekSystem.id,
        impactLevel: 'CRITICAL',
        description: 'System crashes causing business disruption',
        isAIGenerated: true,
        aiConfidence: 95,
        aiReasoning: 'Time tracking failures directly impact payroll and billing operations',
        isValidated: true,
        validatedBy: principal.id,
        validatedAt: new Date('2024-12-15T12:00:00Z'),
        priority: 1,
      },
      {
        issueId: deltekIssue1.id,
        systemCategoryId: projectManagers.id,
        impactLevel: 'HIGH',
        description: 'PMs unable to track project hours accurately',
        isAIGenerated: true,
        aiConfidence: 88,
        aiReasoning: 'Project managers depend on accurate time tracking for project management',
        isValidated: true,
        validatedBy: projectDirector.id,
        validatedAt: new Date('2024-12-15T14:30:00Z'),
        priority: 2,
      },
      {
        issueId: deltekIssue2.id,
        systemCategoryId: deltekSystem.id,
        impactLevel: 'CRITICAL',
        description: 'Financial reporting inaccuracies affecting client trust',
        isAIGenerated: true,
        aiConfidence: 92,
        aiReasoning: 'Budget reporting errors directly impact client relationships and payments',
        isValidated: true,
        validatedBy: principal.id,
        validatedAt: new Date('2024-12-18T16:00:00Z'),
        priority: 1,
      },
      {
        issueId: deltekIssue3.id,
        systemCategoryId: deltekSystem.id,
        impactLevel: 'HIGH',
        description: 'Integration failure affecting productivity tracking',
        isAIGenerated: true,
        aiConfidence: 87,
        aiReasoning: 'AutoCAD integration failure prevents accurate project costing',
        isValidated: false,
        priority: 2,
      },
      {
        issueId: deltekIssue3.id,
        systemCategoryId: autocadSystem.id,
        impactLevel: 'MEDIUM',
        description: 'Time allocation to drawing tasks not automated',
        isAIGenerated: true,
        aiConfidence: 82,
        aiReasoning: 'Manual time allocation increases administrative overhead',
        isValidated: false,
        priority: 3,
      },
    ],
  });

  // Design process impacts
  await prisma.issueSystemImpact.createMany({
    data: [
      {
        issueId: designIssue1.id,
        systemCategoryId: designReview.id,
        impactLevel: 'HIGH',
        description: 'Inefficient review process causing delays',
        isAIGenerated: true,
        aiConfidence: 90,
        aiReasoning: 'Unstructured meetings directly impact design review efficiency',
        isValidated: true,
        validatedBy: designDirector.id,
        validatedAt: new Date('2024-12-10T15:00:00Z'),
        priority: 1,
      },
      {
        issueId: designIssue1.id,
        systemCategoryId: designTeamPeople.id,
        impactLevel: 'MEDIUM',
        description: 'Design team productivity affected by long meetings',
        isAIGenerated: true,
        aiConfidence: 85,
        aiReasoning: 'Extended meetings reduce available design time',
        isValidated: true,
        validatedBy: designDirector.id,
        validatedAt: new Date('2024-12-10T15:30:00Z'),
        priority: 2,
      },
      {
        issueId: designIssue2.id,
        systemCategoryId: revitSystem.id,
        impactLevel: 'HIGH',
        description: 'Model coordination failures causing rework',
        isAIGenerated: true,
        aiConfidence: 93,
        aiReasoning: 'Revit coordination issues directly cause design conflicts and rework',
        isValidated: true,
        validatedBy: engineeringDirector.id,
        validatedAt: new Date('2024-12-12T17:00:00Z'),
        priority: 1,
      },
      {
        issueId: designIssue2.id,
        systemCategoryId: designTeamPeople.id,
        impactLevel: 'HIGH',
        description: 'Collaboration breakdown between design disciplines',
        isAIGenerated: true,
        aiConfidence: 88,
        aiReasoning: 'Poor coordination affects team collaboration and project quality',
        isValidated: false,
        priority: 2,
      },
      {
        issueId: designIssue3.id,
        systemCategoryId: clientManagement.id,
        impactLevel: 'MEDIUM',
        description: 'Inconsistent presentations affecting client perception',
        isAIGenerated: true,
        aiConfidence: 79,
        aiReasoning: 'Presentation quality inconsistency impacts professional image',
        isValidated: false,
        priority: 2,
      },
    ],
  });

  // Client management impacts
  await prisma.issueSystemImpact.createMany({
    data: [
      {
        issueId: clientIssue1.id,
        systemCategoryId: clientManagement.id,
        impactLevel: 'CRITICAL',
        description: 'Change management process failures',
        isAIGenerated: true,
        aiConfidence: 94,
        aiReasoning: 'Late changes indicate poor change management and client expectation setting',
        isValidated: true,
        validatedBy: businessDev.id,
        validatedAt: new Date('2024-11-29T10:00:00Z'),
        priority: 1,
      },
      {
        issueId: clientIssue1.id,
        systemCategoryId: clientStakeholders.id,
        impactLevel: 'HIGH',
        description: 'Client education and expectation management gaps',
        isAIGenerated: true,
        aiConfidence: 87,
        aiReasoning: 'Late change requests suggest insufficient client education on design process',
        isValidated: true,
        validatedBy: businessDev.id,
        validatedAt: new Date('2024-11-29T10:30:00Z'),
        priority: 2,
      },
      {
        issueId: clientIssue2.id,
        systemCategoryId: clientManagement.id,
        impactLevel: 'MEDIUM',
        description: 'Communication fragmentation affecting project coordination',
        isAIGenerated: true,
        aiConfidence: 85,
        aiReasoning: 'Scattered communication channels reduce accountability and clarity',
        isValidated: false,
        priority: 2,
      },
    ],
  });

  // === ISSUE CLUSTERS: Group related issues ===
  console.log('🎯 Creating issue clusters...');

  const deltekCluster = await prisma.issueCluster.create({
    data: {
      name: 'Deltek ERP System Crisis',
      description:
        'Critical failures in our primary ERP system affecting operations, billing, and project management. Requires immediate attention to prevent business disruption.',
      category: 'Technology Infrastructure',
      severity: 'CRITICAL',
      theme: 'System Failure Crisis',
      isActive: true,
      aiConfidence: 96,
      metrics: {
        totalIssues: 3,
        averageScore: 86.3,
        topCategories: ['ERP Systems', 'Financial Management', 'Project Operations'],
        urgencyMetrics: {
          critical: 2,
          high: 1,
          medium: 0,
          low: 0,
        },
        impactAnalysis: {
          financial: 'High - Billing and payroll disruptions',
          operational: 'Critical - Core business process failures',
          strategic: 'Medium - Potential client relationship damage',
          timeline: 'Immediate action required',
        },
        riskFactors: [
          'Financial reporting accuracy',
          'Client billing disputes',
          'Payroll processing delays',
          'Project cost tracking failures',
        ],
      },
      createdAt: new Date('2024-12-15'),
      issues: {
        connect: [{ id: deltekIssue1.id }, { id: deltekIssue2.id }, { id: deltekIssue3.id }],
      },
    },
  });

  const designProcessCluster = await prisma.issueCluster.create({
    data: {
      name: 'Design Process Optimization',
      description:
        'Multiple inefficiencies in our design and review processes affecting project timelines, quality, and team productivity. Opportunity for significant process improvement.',
      category: 'Process Improvement',
      severity: 'HIGH',
      theme: 'Process Efficiency',
      isActive: true,
      aiConfidence: 89,
      metrics: {
        totalIssues: 3,
        averageScore: 77.3,
        topCategories: ['Design Process', 'Quality Control', 'Team Collaboration'],
        urgencyMetrics: {
          critical: 0,
          high: 2,
          medium: 1,
          low: 0,
        },
        impactAnalysis: {
          financial: 'Medium - Project timeline impacts',
          operational: 'High - Daily process inefficiencies',
          strategic: 'High - Quality and client satisfaction',
          timeline: '30-60 days for implementation',
        },
        riskFactors: [
          'Project delivery delays',
          'Design quality inconsistencies',
          'Team productivity loss',
          'Client presentation quality',
        ],
      },
      createdAt: new Date('2024-12-10'),
      issues: {
        connect: [{ id: designIssue1.id }, { id: designIssue2.id }, { id: designIssue3.id }],
      },
    },
  });

  const clientRelationshipCluster = await prisma.issueCluster.create({
    data: {
      name: 'Client Relationship Enhancement',
      description:
        'Issues related to client communication, change management, and relationship maintenance affecting project success and client satisfaction.',
      category: 'Client Management',
      severity: 'HIGH',
      theme: 'Client Relations',
      isActive: true,
      aiConfidence: 92,
      metrics: {
        totalIssues: 2,
        averageScore: 81.0,
        topCategories: ['Client Relations', 'Change Management', 'Communication'],
        urgencyMetrics: {
          critical: 1,
          high: 1,
          medium: 0,
          low: 0,
        },
        impactAnalysis: {
          financial: 'High - Change orders and disputes',
          operational: 'Medium - Communication overhead',
          strategic: 'Critical - Client retention and satisfaction',
          timeline: '60-90 days for full implementation',
        },
        riskFactors: [
          'Client satisfaction decline',
          'Project profitability reduction',
          'Reputation risk',
          'Change order disputes',
        ],
      },
      createdAt: new Date('2024-11-28'),
      issues: {
        connect: [{ id: clientIssue1.id }, { id: clientIssue2.id }],
      },
    },
  });

  const qualityControlCluster = await prisma.issueCluster.create({
    data: {
      name: 'Quality Assurance & Compliance',
      description:
        'Quality control gaps in drawing review and code compliance processes creating risk of construction issues and regulatory problems.',
      category: 'Quality Management',
      severity: 'HIGH',
      theme: 'Quality Control',
      isActive: true,
      aiConfidence: 88,
      metrics: {
        totalIssues: 2,
        averageScore: 83.0,
        topCategories: ['Quality Control', 'Code Compliance', 'Construction Risk'],
        urgencyMetrics: {
          critical: 0,
          high: 2,
          medium: 0,
          low: 0,
        },
        impactAnalysis: {
          financial: 'High - Construction change orders',
          operational: 'Medium - QC process improvements',
          strategic: 'High - Professional liability and reputation',
          timeline: '45-75 days for system implementation',
        },
        riskFactors: [
          'Construction errors',
          'Code compliance violations',
          'Professional liability exposure',
          'Client satisfaction impact',
        ],
      },
      createdAt: new Date('2024-12-08'),
      issues: {
        connect: [{ id: qualityIssue1.id }, { id: qualityIssue2.id }],
      },
    },
  });

  const humanResourcesCluster = await prisma.issueCluster.create({
    data: {
      name: 'Staff Development & Efficiency',
      description:
        'Human resource challenges including training inefficiencies and suboptimal staff utilization affecting overall firm productivity.',
      category: 'Human Resources',
      severity: 'MEDIUM',
      theme: 'Staff Development',
      isActive: true,
      aiConfidence: 82,
      metrics: {
        totalIssues: 2,
        averageScore: 70.0,
        topCategories: ['Training', 'Staff Utilization', 'Productivity'],
        urgencyMetrics: {
          critical: 0,
          high: 0,
          medium: 2,
          low: 0,
        },
        impactAnalysis: {
          financial: 'Medium - Productivity improvements',
          operational: 'High - Daily efficiency gains',
          strategic: 'Medium - Long-term staff development',
          timeline: '90-120 days for comprehensive program',
        },
        riskFactors: [
          'Slow staff ramp-up',
          'Senior staff utilization',
          'Knowledge retention',
          'Training effectiveness',
        ],
      },
      createdAt: new Date('2024-12-03'),
      issues: {
        connect: [{ id: staffIssue1.id }, { id: staffIssue2.id }],
      },
    },
  });

  // === INITIATIVES: Strategic responses to clustered issues ===
  console.log('🎯 Creating strategic initiatives...');

  const currentDate = new Date();
  const q1Start = new Date(currentDate.getFullYear(), 0, 1);
  const q1End = new Date(currentDate.getFullYear(), 2, 31);
  const q2Start = new Date(currentDate.getFullYear(), 3, 1);
  const q2End = new Date(currentDate.getFullYear(), 5, 30);

  // INITIATIVE 1: Emergency Deltek System Stabilization
  const deltekInitiative = await prisma.initiative.create({
    data: {
      title: 'Emergency Deltek ERP System Stabilization',
      problem:
        'Critical failures in Deltek ERP system causing business disruption, billing inaccuracies, and operational inefficiencies that threaten our financial operations and client relationships.',
      goal: 'Stabilize Deltek system operations, resolve integration issues, and implement monitoring to prevent future failures while maintaining business continuity.',
      kpis: [
        'System uptime >99.5%',
        'Billing accuracy >98%',
        'Time tracking reliability >95%',
        'Integration functionality restored',
        'Zero payroll delays',
      ],
      requirements: [
        'Comprehensive system audit and diagnostics',
        'Integration troubleshooting and repair',
        'Data integrity validation and cleanup',
        'Monitoring system implementation',
        'Staff training on new procedures',
        'Backup process documentation',
      ],
      acceptanceCriteria: [
        'All system crashes resolved with root cause analysis',
        'Budget reporting accuracy validated against manual checks',
        'AutoCAD integration fully functional and tested',
        'Monitoring alerts configured for early warning',
        'Staff trained on emergency procedures',
        'Performance benchmarks established and met',
      ],
      owner: { connect: { id: principal.id } },
      timelineStart: new Date('2025-01-15'),
      timelineEnd: new Date('2025-02-28'),
      status: 'ACTIVE',
      progress: 25,
      difficulty: 85,
      roi: 95,
      priorityScore: 98,
      budget: 150000,
      estimatedHours: 480,
      actualHours: 120,
      phase: 'execution',
      type: 'Technology',
      cluster: { connect: { id: deltekCluster.id } },
      addressedIssues: {
        connect: [{ id: deltekIssue1.id }, { id: deltekIssue2.id }, { id: deltekIssue3.id }],
      },
      crossImpact: {
        departments: ['Finance', 'Operations', 'All Projects'],
        affectedTeams: ['Project Management', 'Design', 'Engineering', 'Administration'],
        clientImpact: 'High - Improved billing accuracy and project tracking',
        businessContinuity: 'Critical - Ensures core operations stability',
      },
      clusterMetrics: {
        issuesAddressed: 3,
        severityReduction: 'Critical to Low',
        riskMitigation: 95,
        businessImpact: 'Immediate financial and operational improvements',
      },
      createdAt: new Date('2024-12-23'),
      updatedAt: new Date('2025-01-12'),
    },
  });

  // INITIATIVE 2: Design Process Excellence Program
  const designInitiative = await prisma.initiative.create({
    data: {
      title: 'Design Process Excellence Program',
      problem:
        'Inefficient design review processes, coordination issues, and inconsistent deliverables are affecting project timelines, quality, and client satisfaction.',
      goal: 'Implement streamlined design processes, improve collaboration tools, and establish consistent quality standards to enhance productivity and project outcomes.',
      kpis: [
        'Design review meeting efficiency +50%',
        'Model coordination conflicts -75%',
        'Presentation consistency score >90%',
        'Design rework reduction -40%',
        'Client satisfaction score >8.5',
      ],
      requirements: [
        'Structured design review process implementation',
        'Revit collaboration protocols and training',
        'Presentation template standardization',
        'Quality control checkpoints integration',
        'Team collaboration tools upgrade',
        'Performance monitoring dashboard',
      ],
      acceptanceCriteria: [
        'Design review meetings consistently under 2 hours',
        'Revit model conflicts reduced by 75%',
        'All presentations use approved templates',
        'Quality checkpoints integrated in workflow',
        'Team collaboration metrics improved',
        'Client feedback scores demonstrate improvement',
      ],
      owner: { connect: { id: designDirector.id } },
      timelineStart: new Date('2025-02-01'),
      timelineEnd: new Date('2025-04-30'),
      status: 'APPROVED',
      progress: 15,
      difficulty: 70,
      roi: 80,
      priorityScore: 85,
      budget: 75000,
      estimatedHours: 320,
      actualHours: 48,
      phase: 'planning',
      type: 'Process Improvement',
      cluster: { connect: { id: designProcessCluster.id } },
      addressedIssues: {
        connect: [{ id: designIssue1.id }, { id: designIssue2.id }, { id: designIssue3.id }],
      },
      crossImpact: {
        departments: ['Design', 'Engineering', 'Project Management'],
        affectedTeams: ['Architectural Design', 'Structural Engineering'],
        clientImpact: 'High - Improved design quality and presentation consistency',
        businessContinuity: 'Medium - Enhanced operational efficiency',
      },
      clusterMetrics: {
        issuesAddressed: 3,
        severityReduction: 'High to Low',
        riskMitigation: 80,
        businessImpact: 'Improved productivity and client satisfaction',
      },
      createdAt: new Date('2024-12-28'),
      updatedAt: new Date('2025-01-10'),
    },
  });

  // INITIATIVE 3: Client Relationship Excellence
  const clientInitiative = await prisma.initiative.create({
    data: {
      title: 'Client Relationship Excellence Initiative',
      problem:
        'Client change management issues and fragmented communication are causing project delays, budget overruns, and relationship strain affecting firm profitability and reputation.',
      goal: 'Implement comprehensive client management system with structured change processes and unified communication to improve client satisfaction and project profitability.',
      kpis: [
        'Late change requests -60%',
        'Client satisfaction score >9.0',
        'Change order disputes -80%',
        'Communication response time <4 hours',
        'Project profitability +15%',
      ],
      requirements: [
        'Client communication portal implementation',
        'Change management process documentation',
        'Client education program development',
        'Project milestone communication automation',
        'Client feedback collection system',
        'Relationship management training',
      ],
      acceptanceCriteria: [
        'All client communication centralized in portal',
        'Change request process documented and trained',
        'Client education materials created and deployed',
        'Automated milestone notifications implemented',
        'Feedback collection system operational',
        'Team trained on new communication protocols',
      ],
      owner: { connect: { id: businessDev.id } },
      timelineStart: new Date('2025-02-15'),
      timelineEnd: new Date('2025-05-15'),
      status: 'PLANNING',
      progress: 5,
      difficulty: 65,
      roi: 85,
      priorityScore: 88,
      budget: 60000,
      estimatedHours: 280,
      actualHours: 14,
      phase: 'planning',
      type: 'Strategic',
      cluster: { connect: { id: clientRelationshipCluster.id } },
      addressedIssues: {
        connect: [{ id: clientIssue1.id }, { id: clientIssue2.id }],
      },
      crossImpact: {
        departments: ['Business Development', 'Project Management', 'Design'],
        affectedTeams: ['All Client-Facing Teams'],
        clientImpact: 'Critical - Direct improvement to client experience',
        businessContinuity: 'High - Improved client retention and profitability',
      },
      clusterMetrics: {
        issuesAddressed: 2,
        severityReduction: 'High to Low',
        riskMitigation: 85,
        businessImpact: 'Improved client relationships and project profitability',
      },
      createdAt: new Date('2025-01-02'),
      updatedAt: new Date('2025-01-08'),
    },
  });

  // INITIATIVE 4: VR Innovation Implementation (from Ideas)
  const vrInitiative = await prisma.initiative.create({
    data: {
      title: 'Virtual Reality Client Experience Platform',
      problem:
        'Traditional 2D presentations limit client understanding of design concepts, leading to miscommunication, change orders, and reduced client satisfaction during the design process.',
      goal: 'Implement VR technology for immersive client presentations to improve design communication, reduce change orders, and differentiate our services in the market.',
      kpis: [
        'Client design approval speed +40%',
        'Change orders during construction -30%',
        'Client satisfaction score >9.2',
        'Competitive advantage measurable in proposals',
        'ROI positive within 18 months',
      ],
      requirements: [
        'VR hardware procurement and setup',
        'VR software integration with Revit/3D models',
        'Staff training on VR presentation techniques',
        'Client experience protocols development',
        'VR presentation room configuration',
        'Marketing materials highlighting VR capability',
      ],
      acceptanceCriteria: [
        'VR system operational for client presentations',
        'All design staff trained on VR presentation methods',
        'Client experience protocols documented',
        'VR capability integrated into marketing materials',
        'Measurable improvement in client satisfaction',
        'ROI tracking system implemented',
      ],
      owner: { connect: { id: designDirector.id } },
      timelineStart: new Date('2025-03-01'),
      timelineEnd: new Date('2025-06-30'),
      status: 'DRAFT',
      progress: 0,
      difficulty: 75,
      roi: 90,
      priorityScore: 78,
      budget: 85000,
      estimatedHours: 240,
      actualHours: 0,
      phase: 'planning',
      type: 'Technology',
      ideas: {
        connect: [{ id: vrPresentationIdea.id }],
      },
      crossImpact: {
        departments: ['Design', 'Business Development', 'Marketing'],
        affectedTeams: ['Architectural Design', 'Business Operations'],
        clientImpact: 'High - Revolutionary client experience improvement',
        businessContinuity: 'Medium - Competitive differentiation',
      },
      createdAt: new Date('2025-01-05'),
      updatedAt: new Date('2025-01-05'),
    },
  });

  // INITIATIVE 5: Quality Assurance Automation
  const qualityInitiative = await prisma.initiative.create({
    data: {
      title: 'Automated Quality Assurance System',
      problem:
        'Manual quality control processes are inconsistent and error-prone, leading to construction issues, code compliance risks, and potential professional liability exposure.',
      goal: 'Implement automated quality control systems with AI-assisted code compliance checking to ensure consistent quality and reduce construction-related issues.',
      kpis: [
        'QC consistency score >95%',
        'Code compliance errors -80%',
        'Construction change orders -50%',
        'QC process time -60%',
        'Professional liability risk reduction',
      ],
      requirements: [
        'Automated drawing QC software implementation',
        'AI-powered code compliance checking system',
        'Quality control workflow integration',
        'Staff training on new QC procedures',
        'Quality metrics dashboard development',
        'Construction feedback loop establishment',
      ],
      acceptanceCriteria: [
        'Automated QC system operational for all projects',
        'Code compliance checking integrated in design workflow',
        'Quality metrics dashboard providing real-time insights',
        'All design staff trained on new QC procedures',
        'Construction feedback system capturing QC effectiveness',
        'Measurable reduction in construction issues',
      ],
      owner: { connect: { id: engineeringDirector.id } },
      timelineStart: new Date('2025-04-01'),
      timelineEnd: new Date('2025-07-31'),
      status: 'DRAFT',
      progress: 0,
      difficulty: 80,
      roi: 75,
      priorityScore: 82,
      budget: 95000,
      estimatedHours: 360,
      actualHours: 0,
      phase: 'planning',
      type: 'Quality',
      cluster: { connect: { id: qualityControlCluster.id } },
      addressedIssues: {
        connect: [{ id: qualityIssue1.id }, { id: qualityIssue2.id }],
      },
      crossImpact: {
        departments: ['Engineering', 'Design', 'Quality Assurance'],
        affectedTeams: ['Structural Engineering', 'Architectural Design'],
        clientImpact: 'High - Improved design quality and construction outcomes',
        businessContinuity: 'High - Risk reduction and quality improvement',
      },
      clusterMetrics: {
        issuesAddressed: 2,
        severityReduction: 'High to Low',
        riskMitigation: 90,
        businessImpact: 'Quality improvement and risk reduction',
      },
      createdAt: new Date('2025-01-08'),
      updatedAt: new Date('2025-01-08'),
    },
  });

  // === SOLUTIONS: Detailed implementation approaches ===
  console.log('🔧 Creating initiative solutions...');

  // Solutions for Deltek Initiative
  const deltekSolution1 = await prisma.initiativeSolution.create({
    data: {
      initiative: { connect: { id: deltekInitiative.id } },
      title: 'Emergency System Stabilization',
      description:
        'Immediate technical intervention to resolve critical system failures and restore operational stability',
      type: 'TECHNOLOGY',
      priority: 10,
      status: 'IN_PROGRESS',
      estimatedCost: 45000,
      estimatedHours: 160,
      actualCost: 15000,
      actualHours: 40,
      plannedStartDate: new Date('2025-01-15'),
      plannedEndDate: new Date('2025-02-15'),
      actualStartDate: new Date('2025-01-15'),
      assignedTo: { connect: { id: projectDirector.id } },
      isAIGenerated: true,
      aiConfidence: 92,
      aiReasoning:
        'Critical system failures require immediate technical intervention with experienced team',
      progress: 25,
      tags: ['emergency', 'system-repair', 'critical'],
      notes: 'Vendor support engaged, initial diagnostics completed',
    },
  });

  const deltekSolution2 = await prisma.initiativeSolution.create({
    data: {
      initiative: { connect: { id: deltekInitiative.id } },
      title: 'Integration Architecture Rebuild',
      description:
        'Redesign and rebuild integration connections between Deltek and other systems for reliability',
      type: 'TECHNOLOGY',
      priority: 9,
      status: 'PLANNED',
      estimatedCost: 65000,
      estimatedHours: 200,
      plannedStartDate: new Date('2025-02-01'),
      plannedEndDate: new Date('2025-02-28'),
      assignedTo: { connect: { id: engineeringDirector.id } },
      isAIGenerated: true,
      aiConfidence: 88,
      aiReasoning:
        'Integration failures suggest architectural issues requiring comprehensive rebuild',
      progress: 10,
      tags: ['integration', 'architecture', 'rebuild'],
      notes: 'Architecture review scheduled, vendor consultation planned',
    },
  });

  const deltekSolution3 = await prisma.initiativeSolution.create({
    data: {
      initiative: { connect: { id: deltekInitiative.id } },
      title: 'Monitoring and Alerting System',
      description:
        'Implement comprehensive monitoring with proactive alerting to prevent future failures',
      type: 'TECHNOLOGY',
      priority: 8,
      status: 'PLANNED',
      estimatedCost: 25000,
      estimatedHours: 80,
      plannedStartDate: new Date('2025-02-15'),
      plannedEndDate: new Date('2025-02-28'),
      assignedTo: { connect: { id: projectDirector.id } },
      isAIGenerated: true,
      aiConfidence: 85,
      aiReasoning: 'Proactive monitoring essential to prevent recurrence of critical failures',
      progress: 5,
      tags: ['monitoring', 'alerting', 'prevention'],
      notes: 'Monitoring tools evaluation in progress',
    },
  });

  // Solutions for Design Initiative
  const designSolution1 = await prisma.initiativeSolution.create({
    data: {
      initiative: { connect: { id: designInitiative.id } },
      title: 'Structured Design Review Framework',
      description:
        'Implement standardized design review process with defined roles, timelines, and decision criteria',
      type: 'PROCESS',
      priority: 9,
      status: 'PLANNED',
      estimatedCost: 25000,
      estimatedHours: 120,
      plannedStartDate: new Date('2025-02-01'),
      plannedEndDate: new Date('2025-03-15'),
      assignedTo: { connect: { id: designDirector.id } },
      isAIGenerated: true,
      aiConfidence: 90,
      aiReasoning: 'Structured process will eliminate inefficiencies and improve meeting outcomes',
      progress: 15,
      tags: ['process', 'structure', 'efficiency'],
      notes: 'Process framework drafted, stakeholder review in progress',
    },
  });

  const designSolution2 = await prisma.initiativeSolution.create({
    data: {
      initiative: { connect: { id: designInitiative.id } },
      title: 'Advanced Revit Collaboration Platform',
      description:
        'Upgrade Revit collaboration infrastructure with enhanced coordination tools and protocols',
      type: 'TECHNOLOGY',
      priority: 8,
      status: 'PLANNED',
      estimatedCost: 35000,
      estimatedHours: 140,
      plannedStartDate: new Date('2025-02-15'),
      plannedEndDate: new Date('2025-04-01'),
      assignedTo: { connect: { id: engineeringDirector.id } },
      isAIGenerated: true,
      aiConfidence: 87,
      aiReasoning:
        'Technical solution needed to address model coordination and collaboration issues',
      progress: 10,
      tags: ['revit', 'collaboration', 'coordination'],
      notes: 'Software evaluation completed, implementation plan in development',
    },
  });

  // === TASKS: Detailed execution steps ===
  console.log('📋 Creating solution tasks...');

  // Tasks for Emergency System Stabilization
  await prisma.solutionTask.createMany({
    data: [
      {
        solutionId: deltekSolution1.id,
        title: 'System Diagnostic and Root Cause Analysis',
        description:
          'Comprehensive analysis of system failures to identify root causes and patterns',
        assignedToId: projectDirector.id,
        status: 'COMPLETED',
        priority: 10,
        estimatedHours: 24,
        actualHours: 26,
        dueDate: new Date('2025-01-20'),
        completedAt: new Date('2025-01-19'),
        isAIGenerated: true,
        aiConfidence: 95,
        aiReasoning: 'Root cause analysis is critical first step for effective solution',
        progress: 100,
        tags: ['diagnostic', 'analysis', 'critical'],
        notes: 'Root causes identified: database corruption and memory leaks',
      },
      {
        solutionId: deltekSolution1.id,
        title: 'Database Integrity Repair and Optimization',
        description: 'Repair corrupted database entries and optimize database performance',
        assignedToId: engineeringDirector.id,
        status: 'IN_PROGRESS',
        priority: 9,
        estimatedHours: 32,
        actualHours: 14,
        dueDate: new Date('2025-01-25'),
        isAIGenerated: true,
        aiConfidence: 90,
        aiReasoning: 'Database issues directly cause billing and reporting problems',
        progress: 45,
        tags: ['database', 'repair', 'optimization'],
        notes: 'Corruption repair 70% complete, optimization scripts prepared',
      },
      {
        solutionId: deltekSolution1.id,
        title: 'Memory Leak Resolution and Performance Tuning',
        description: 'Identify and resolve memory leaks causing system crashes',
        assignedToId: projectDirector.id,
        status: 'TODO',
        priority: 8,
        estimatedHours: 40,
        dueDate: new Date('2025-02-01'),
        isAIGenerated: true,
        aiConfidence: 88,
        aiReasoning: 'Memory issues cause system instability requiring technical resolution',
        progress: 0,
        tags: ['memory', 'performance', 'stability'],
        notes: 'Dependent on database repair completion',
      },
      {
        solutionId: deltekSolution1.id,
        title: 'Integration Testing and Validation',
        description: 'Comprehensive testing of all system integrations after repairs',
        assignedToId: engineeringDirector.id,
        status: 'TODO',
        priority: 7,
        estimatedHours: 36,
        dueDate: new Date('2025-02-10'),
        isAIGenerated: true,
        aiConfidence: 92,
        aiReasoning: 'Integration testing ensures system stability before production use',
        progress: 0,
        tags: ['testing', 'integration', 'validation'],
        notes: 'Test scripts prepared, waiting for repair completion',
      },
      {
        solutionId: deltekSolution1.id,
        title: 'Staff Training on Emergency Procedures',
        description: 'Train staff on new emergency procedures and system recovery protocols',
        assignedToId: businessDev.id,
        status: 'TODO',
        priority: 6,
        estimatedHours: 16,
        dueDate: new Date('2025-02-15'),
        isAIGenerated: true,
        aiConfidence: 85,
        aiReasoning: 'Staff training essential for managing future system issues',
        progress: 0,
        tags: ['training', 'procedures', 'emergency'],
        notes: 'Training materials being developed',
      },
    ],
  });

  // Tasks for Integration Architecture Rebuild
  await prisma.solutionTask.createMany({
    data: [
      {
        solutionId: deltekSolution2.id,
        title: 'Integration Architecture Assessment',
        description:
          'Evaluate current integration architecture and identify improvement opportunities',
        assignedToId: engineeringDirector.id,
        status: 'TODO',
        priority: 10,
        estimatedHours: 40,
        dueDate: new Date('2025-02-05'),
        isAIGenerated: true,
        aiConfidence: 90,
        aiReasoning: 'Architecture assessment required before redesign implementation',
        progress: 0,
        tags: ['architecture', 'assessment', 'planning'],
        notes: 'Vendor consultation scheduled for architecture review',
      },
      {
        solutionId: deltekSolution2.id,
        title: 'API Gateway Implementation',
        description: 'Implement robust API gateway for reliable system-to-system communication',
        assignedToId: projectDirector.id,
        status: 'TODO',
        priority: 9,
        estimatedHours: 60,
        dueDate: new Date('2025-02-20'),
        isAIGenerated: true,
        aiConfidence: 87,
        aiReasoning: 'API gateway provides centralized integration management and monitoring',
        progress: 0,
        tags: ['api', 'gateway', 'integration'],
        notes: 'Gateway technology selection in progress',
      },
    ],
  });

  // Tasks for Design Review Framework
  await prisma.solutionTask.createMany({
    data: [
      {
        solutionId: designSolution1.id,
        title: 'Design Review Process Documentation',
        description: 'Create comprehensive documentation for new structured design review process',
        assignedToId: designDirector.id,
        status: 'IN_PROGRESS',
        priority: 9,
        estimatedHours: 24,
        actualHours: 12,
        dueDate: new Date('2025-02-10'),
        isAIGenerated: true,
        aiConfidence: 92,
        aiReasoning: 'Process documentation essential for consistent implementation',
        progress: 50,
        tags: ['documentation', 'process', 'standardization'],
        notes: 'Framework 50% documented, stakeholder feedback incorporated',
      },
      {
        solutionId: designSolution1.id,
        title: 'Review Meeting Template Creation',
        description: 'Develop standardized templates and agendas for design review meetings',
        assignedToId: designDirector.id,
        status: 'TODO',
        priority: 8,
        estimatedHours: 16,
        dueDate: new Date('2025-02-15'),
        isAIGenerated: true,
        aiConfidence: 88,
        aiReasoning: 'Standardized templates will improve meeting efficiency and outcomes',
        progress: 0,
        tags: ['templates', 'meetings', 'efficiency'],
        notes: 'Template structure defined, content development in progress',
      },
      {
        solutionId: designSolution1.id,
        title: 'Team Training on New Review Process',
        description: 'Train all design team members on new structured review process',
        assignedToId: designDirector.id,
        status: 'TODO',
        priority: 7,
        estimatedHours: 32,
        dueDate: new Date('2025-03-01'),
        isAIGenerated: true,
        aiConfidence: 85,
        aiReasoning: 'Team training critical for successful process adoption',
        progress: 0,
        tags: ['training', 'team', 'adoption'],
        notes: 'Training schedule being coordinated with project timelines',
      },
    ],
  });

  // === MILESTONES: Key project checkpoints ===
  console.log('🎯 Creating project milestones...');

  // Deltek Initiative Milestones
  await prisma.milestone.createMany({
    data: [
      {
        initiativeId: deltekInitiative.id,
        title: 'System Stabilization Complete',
        description: 'All critical system failures resolved and system stability restored',
        dueDate: new Date('2025-02-01'),
        status: 'in_progress',
        progress: 60,
      },
      {
        initiativeId: deltekInitiative.id,
        title: 'Integration Rebuild Complete',
        description: 'All system integrations rebuilt and tested for reliability',
        dueDate: new Date('2025-02-28'),
        status: 'pending',
        progress: 10,
      },
      {
        initiativeId: deltekInitiative.id,
        title: 'Monitoring System Operational',
        description: 'Comprehensive monitoring system deployed and alerting configured',
        dueDate: new Date('2025-02-28'),
        status: 'pending',
        progress: 5,
      },
    ],
  });

  // Design Initiative Milestones
  await prisma.milestone.createMany({
    data: [
      {
        initiativeId: designInitiative.id,
        title: 'Process Framework Approved',
        description: 'New design review process framework approved by leadership',
        dueDate: new Date('2025-02-15'),
        status: 'pending',
        progress: 40,
      },
      {
        initiativeId: designInitiative.id,
        title: 'Technology Upgrades Complete',
        description: 'Revit collaboration platform upgraded and configured',
        dueDate: new Date('2025-03-31'),
        status: 'pending',
        progress: 15,
      },
      {
        initiativeId: designInitiative.id,
        title: 'Team Training Complete',
        description: 'All design team members trained on new processes and tools',
        dueDate: new Date('2025-04-15'),
        status: 'pending',
        progress: 5,
      },
    ],
  });

  // === REQUIREMENT CARDS: Detailed specifications ===
  console.log('📝 Creating requirement cards...');

  // Requirement cards for Deltek Initiative
  await prisma.requirementCard.createMany({
    data: [
      {
        initiativeId: deltekInitiative.id,
        type: 'BUSINESS',
        title: 'System Uptime Requirement',
        description:
          'Deltek system must maintain 99.5% uptime during business hours with no unplanned outages exceeding 15 minutes',
        priority: 'CRITICAL',
        status: 'APPROVED',
        category: 'Performance',
        createdById: principal.id,
        approvedById: principal.id,
        approvedAt: new Date('2024-12-23T10:00:00Z'),
        orderIndex: 1,
        aiGenerated: true,
        sourceType: 'cluster',
        sourceId: deltekCluster.id,
        aiConfidence: 95,
      },
      {
        initiativeId: deltekInitiative.id,
        type: 'FUNCTIONAL',
        title: 'Integration Reliability',
        description:
          'All system integrations (AutoCAD, Office 365, external tools) must function consistently with error rate <1%',
        priority: 'HIGH',
        status: 'APPROVED',
        category: 'Integration',
        createdById: engineeringDirector.id,
        approvedById: principal.id,
        approvedAt: new Date('2024-12-23T11:00:00Z'),
        orderIndex: 2,
        aiGenerated: true,
        sourceType: 'cluster',
        sourceId: deltekCluster.id,
        aiConfidence: 90,
      },
      {
        initiativeId: deltekInitiative.id,
        type: 'ACCEPTANCE',
        title: 'Billing Accuracy Validation',
        description:
          'System must generate accurate billing reports with 98% accuracy validated against manual checks',
        priority: 'CRITICAL',
        status: 'REVIEW',
        category: 'Financial',
        createdById: projectDirector.id,
        assignedToId: businessDev.id,
        orderIndex: 3,
        aiGenerated: true,
        sourceType: 'issue',
        sourceId: deltekIssue2.id,
        aiConfidence: 92,
      },
    ],
  });

  // Requirement cards for Design Initiative
  await prisma.requirementCard.createMany({
    data: [
      {
        initiativeId: designInitiative.id,
        type: 'BUSINESS',
        title: 'Meeting Efficiency Target',
        description:
          'Design review meetings must consistently complete within 90 minutes with all required decisions made',
        priority: 'HIGH',
        status: 'APPROVED',
        category: 'Process Efficiency',
        createdById: designDirector.id,
        approvedById: designDirector.id,
        approvedAt: new Date('2024-12-28T14:00:00Z'),
        orderIndex: 1,
        aiGenerated: true,
        sourceType: 'issue',
        sourceId: designIssue1.id,
        aiConfidence: 88,
      },
      {
        initiativeId: designInitiative.id,
        type: 'FUNCTIONAL',
        title: 'Model Coordination Standards',
        description:
          'Revit models must maintain coordination with <5 conflicts per discipline per project milestone',
        priority: 'HIGH',
        status: 'APPROVED',
        category: 'Quality Standards',
        createdById: engineeringDirector.id,
        approvedById: designDirector.id,
        approvedAt: new Date('2024-12-28T15:00:00Z'),
        orderIndex: 2,
        aiGenerated: true,
        sourceType: 'issue',
        sourceId: designIssue2.id,
        aiConfidence: 91,
      },
    ],
  });

  // === RESOURCE ASSIGNMENTS: Team allocation ===
  console.log('👥 Creating resource assignments...');

  // Deltek Initiative Resources
  await prisma.resourceAssignment.createMany({
    data: [
      {
        initiativeId: deltekInitiative.id,
        teamId: businessOperations.id,
        hoursAllocated: 200,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-02-28'),
        role: 'lead',
      },
      {
        initiativeId: deltekInitiative.id,
        teamId: structuralEngineering.id,
        hoursAllocated: 120,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-02-15'),
        role: 'contributor',
      },
      {
        initiativeId: deltekInitiative.id,
        teamId: projectManagement.id,
        hoursAllocated: 160,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-02-28'),
        role: 'support',
      },
    ],
  });

  // Design Initiative Resources
  await prisma.resourceAssignment.createMany({
    data: [
      {
        initiativeId: designInitiative.id,
        teamId: architecturalDesign.id,
        hoursAllocated: 180,
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-04-30'),
        role: 'lead',
      },
      {
        initiativeId: designInitiative.id,
        teamId: structuralEngineering.id,
        hoursAllocated: 80,
        startDate: new Date('2025-02-15'),
        endDate: new Date('2025-04-15'),
        role: 'contributor',
      },
      {
        initiativeId: designInitiative.id,
        teamId: projectManagement.id,
        hoursAllocated: 60,
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-04-30'),
        role: 'support',
      },
    ],
  });

  // === COMMENTS: Collaborative discussion ===
  console.log('💬 Creating collaborative comments...');

  // Comments on Critical Issues
  await prisma.comment.createMany({
    data: [
      {
        content:
          'This is becoming a critical business risk. We need to escalate to emergency status and engage vendor support immediately.',
        authorId: principal.id,
        issueId: deltekIssue1.id,
        createdAt: new Date('2024-12-15T11:30:00Z'),
      },
      {
        content:
          "Agreed. I've already contacted Deltek support and they're providing emergency response. We should also prepare backup procedures.",
        authorId: projectDirector.id,
        issueId: deltekIssue1.id,
        createdAt: new Date('2024-12-15T12:15:00Z'),
      },
      {
        content:
          'The integration issues might be related to the recent Windows update. We should check system compatibility.',
        authorId: engineeringDirector.id,
        issueId: deltekIssue3.id,
        createdAt: new Date('2024-12-20T10:30:00Z'),
      },
      {
        content:
          'This affects our ability to demonstrate design intent to clients. We should prioritize this for our upcoming presentations.',
        authorId: designDirector.id,
        issueId: designIssue3.id,
        createdAt: new Date('2024-12-14T15:45:00Z'),
      },
      {
        content:
          "We need to quantify the impact on client satisfaction. I'll pull together some data from recent client feedback.",
        authorId: businessDev.id,
        issueId: clientIssue1.id,
        createdAt: new Date('2024-11-29T09:15:00Z'),
      },
    ],
  });

  // Comments on Initiatives
  await prisma.comment.createMany({
    data: [
      {
        content:
          'Emergency initiative approved. All necessary resources will be made available. This is our top priority.',
        authorId: principal.id,
        initiativeId: deltekInitiative.id,
        createdAt: new Date('2024-12-23T14:00:00Z'),
      },
      {
        content:
          'Initial diagnostics complete. Root cause identified as database corruption combined with memory leaks. Recovery plan in progress.',
        authorId: projectDirector.id,
        initiativeId: deltekInitiative.id,
        createdAt: new Date('2025-01-18T16:30:00Z'),
      },
      {
        content:
          'The structured review process will significantly improve our project delivery. I recommend we pilot this on the Henderson project first.',
        authorId: designDirector.id,
        initiativeId: designInitiative.id,
        createdAt: new Date('2025-01-05T11:20:00Z'),
      },
      {
        content:
          'VR technology could be a game-changer for client presentations. We should coordinate this with our upcoming marketing initiatives.',
        authorId: businessDev.id,
        initiativeId: vrInitiative.id,
        createdAt: new Date('2025-01-06T10:45:00Z'),
      },
    ],
  });

  // Comments on Ideas
  await prisma.comment.createMany({
    data: [
      {
        content:
          'VR presentations could really set us apart from competitors. The ROI potential is significant if we can reduce change orders.',
        authorId: businessDev.id,
        ideaId: vrPresentationIdea.id,
        createdAt: new Date('2024-12-01T14:30:00Z'),
      },
      {
        content:
          'I agree this is innovative, but we need to consider the learning curve for our design team. Training will be essential.',
        authorId: projectDirector.id,
        ideaId: vrPresentationIdea.id,
        createdAt: new Date('2024-12-03T09:15:00Z'),
      },
      {
        content:
          'Drone inspections are already being used successfully by other firms. We should move quickly to implement this.',
        authorId: engineeringDirector.id,
        ideaId: droneInspectionIdea.id,
        createdAt: new Date('2024-12-05T11:45:00Z'),
      },
    ],
  });

  // === VOTES: Community engagement ===
  console.log('🗳️ Creating community votes...');

  // Votes on Issues (distributed across different users)
  await prisma.vote.createMany({
    data: [
      // High-priority issues get more votes
      { userId: designDirector.id, issueId: deltekIssue1.id, type: 'up' },
      { userId: projectDirector.id, issueId: deltekIssue1.id, type: 'up' },
      { userId: businessDev.id, issueId: deltekIssue1.id, type: 'up' },
      { userId: engineeringDirector.id, issueId: deltekIssue1.id, type: 'up' },

      { userId: principal.id, issueId: clientIssue1.id, type: 'up' },
      { userId: businessDev.id, issueId: clientIssue1.id, type: 'up' },
      { userId: projectDirector.id, issueId: clientIssue1.id, type: 'up' },

      { userId: designDirector.id, issueId: designIssue2.id, type: 'up' },
      { userId: engineeringDirector.id, issueId: designIssue2.id, type: 'up' },
      { userId: projectDirector.id, issueId: designIssue2.id, type: 'up' },

      { userId: engineeringDirector.id, issueId: qualityIssue2.id, type: 'up' },
      { userId: principal.id, issueId: qualityIssue2.id, type: 'up' },
      { userId: designDirector.id, issueId: qualityIssue2.id, type: 'up' },
    ],
  });

  // Votes on Ideas
  await prisma.vote.createMany({
    data: [
      { userId: principal.id, ideaId: vrPresentationIdea.id, type: 'up' },
      { userId: businessDev.id, ideaId: vrPresentationIdea.id, type: 'up' },
      { userId: projectDirector.id, ideaId: vrPresentationIdea.id, type: 'up' },

      { userId: engineeringDirector.id, ideaId: droneInspectionIdea.id, type: 'up' },
      { userId: principal.id, ideaId: droneInspectionIdea.id, type: 'up' },
      { userId: designDirector.id, ideaId: droneInspectionIdea.id, type: 'up' },

      { userId: designDirector.id, ideaId: aiDesignIdea.id, type: 'up' },
      { userId: engineeringDirector.id, ideaId: aiDesignIdea.id, type: 'up' },
    ],
  });

  // === AUDIT LOGS: System activity tracking ===
  console.log('📊 Creating audit trail...');

  await prisma.auditLog.createMany({
    data: [
      {
        action: 'EMERGENCY_INITIATIVE_CREATED',
        userId: principal.id,
        details: {
          initiativeId: deltekInitiative.id,
          severity: 'CRITICAL',
          reason: 'Business-critical system failures requiring immediate intervention',
          impactAssessment: 'High financial and operational risk',
        },
        timestamp: new Date('2024-12-23T14:00:00Z'),
      },
      {
        action: 'SYSTEM_DIAGNOSTIC_COMPLETED',
        userId: projectDirector.id,
        details: {
          initiativeId: deltekInitiative.id,
          findingsCount: 8,
          severity: 'CRITICAL',
          rootCauses: ['Database corruption', 'Memory leaks', 'Integration failures'],
        },
        timestamp: new Date('2025-01-19T17:30:00Z'),
      },
      {
        action: 'CLUSTER_ANALYSIS_COMPLETED',
        userId: projectDirector.id,
        details: {
          clusterId: designProcessCluster.id,
          issuesAnalyzed: 3,
          confidence: 89,
          aiRecommendations: 5,
        },
        timestamp: new Date('2024-12-28T10:15:00Z'),
      },
      {
        action: 'IDEA_APPROVED_FOR_DEVELOPMENT',
        userId: designDirector.id,
        details: {
          ideaId: vrPresentationIdea.id,
          category: 'Technology Enhancement',
          estimatedROI: 90,
          implementationCost: 75000,
        },
        timestamp: new Date('2024-12-20T11:30:00Z'),
      },
      {
        action: 'QUALITY_INITIATIVE_PLANNED',
        userId: engineeringDirector.id,
        details: {
          initiativeId: qualityInitiative.id,
          focus: 'Automated QC and code compliance',
          riskReduction: 90,
          estimatedSavings: 200000,
        },
        timestamp: new Date('2025-01-08T09:45:00Z'),
      },
    ],
  });

  console.log('🎉 COMPREHENSIVE SHOWCASE SEED DATA COMPLETE!');
  console.log('');
  console.log('📊 DATA SUMMARY:');
  console.log('   👥 Users: 5 (Principal, Directors, Leadership Team)');
  console.log('   🏢 Teams: 4 (Design, Engineering, PM, Operations)');
  console.log('   🏗️ System Categories: 12 (Technology, Process, People)');
  console.log('   💡 Ideas: 4 (VR, Drones, AI Design, Sustainability)');
  console.log('   ⚠️ Issues: 12 (Critical systems, processes, quality)');
  console.log('   🔗 System Impacts: 15 (Cross-system relationships)');
  console.log('   🎯 Clusters: 5 (Critical, High, Medium priority)');
  console.log('   🚀 Initiatives: 5 (Emergency, Strategic, Innovation)');
  console.log('   🔧 Solutions: 5 (Technical, Process, Training)');
  console.log('   📋 Tasks: 12 (Detailed execution steps)');
  console.log('   🎯 Milestones: 6 (Key project checkpoints)');
  console.log('   📝 Requirement Cards: 5 (Detailed specifications)');
  console.log('   💬 Comments: 12 (Collaborative discussions)');
  console.log('   🗳️ Votes: 16 (Community engagement)');
  console.log('');
  console.log('🎭 DEMONSTRATION SCENARIOS READY:');
  console.log('   ⛑️ Emergency Response: Deltek system crisis → immediate action');
  console.log('   🔄 Process Improvement: Design inefficiencies → systematic enhancement');
  console.log('   🤝 Client Relations: Communication issues → relationship excellence');
  console.log('   ✨ Innovation: VR ideas → strategic implementation');
  console.log('   🛡️ Quality Control: Compliance gaps → automated assurance');
  console.log('');
  console.log('🎨 FEATURES SHOWCASED:');
  console.log('   💡 Ideas → Issues → Clusters → Initiatives → Solutions → Tasks');
  console.log('   🤖 AI summaries, confidence scores, and recommendations');
  console.log('   🔗 System impact analysis and cross-system dependencies');
  console.log('   📊 Progress tracking, milestones, and resource allocation');
  console.log('   👥 Multi-user collaboration and role-based workflows');
  console.log('   📈 Business metrics, ROI analysis, and risk assessment');
  console.log('');
  console.log('🎯 Morrison A&E Digital Transformation Journey Complete!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
