/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Enhanced A&E Firm Seed Data for FlowVision
 * Realistic data for Architecture & Engineering firms serving regional/national builders
 * Covers all app functions: Issues, Clusters, Initiatives, Ideas, Teams, Users, Comments, etc.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🏗️ Seeding FlowVision with A&E firm data...');

  // Clear existing data
  await prisma.vote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.resourceAssignment.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.requirementCard.deleteMany();
  await prisma.idea.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.initiative.deleteMany();
  await prisma.issueCluster.deleteMany();
  await prisma.team.deleteMany();
  await prisma.businessProfile.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  // === USERS & BUSINESS PROFILE ===
  
  // Principal/Admin User
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const principal = await prisma.user.create({
    data: {
      email: 'principal@morrisonae.com',
      name: 'David Morrison',
      passwordHash,
      role: 'ADMIN',
    },
  });

  // Business Profile for Morrison A&E
  await prisma.businessProfile.create({
    data: {
      userId: principal.id,
      industry: 'Architecture & Engineering',
      size: 125,
      metrics: {
        clientSatisfactionScore: 8.4,
        projectDeliveryOnTime: 0.78,
        profitMarginTarget: 0.15,
        utilizationRate: 0.82,
        avgProjectDurationDays: 180,
        communityProjectsActive: 12
      },
    },
  });

  // Leadership Team
  const designDirector = await prisma.user.create({
    data: {
      email: 'sarah.chen@morrisonae.com',
      name: 'Sarah Chen',
      passwordHash,
      role: 'LEADER',
    },
  });

  const projectDirector = await prisma.user.create({
    data: {
      email: 'mike.rodriguez@morrisonae.com',
      name: 'Mike Rodriguez',
      passwordHash,
      role: 'LEADER',
    },
  });

  const businessDev = await prisma.user.create({
    data: {
      email: 'jennifer.kim@morrisonae.com',
      name: 'Jennifer Kim',
      passwordHash,
      role: 'LEADER',
    },
  });

  const engineeringDirector = await prisma.user.create({
    data: {
      email: 'alex.thompson@morrisonae.com',
      name: 'Alex Thompson',
      passwordHash,
      role: 'LEADER',
    },
  });

  // === TEAMS ===
  
  const designTeam = await prisma.team.create({
    data: {
      name: 'Design Team',
      department: 'Architecture',
      capacity: 320, // 8 architects × 40 hours
      skills: ['Residential Design', 'Community Planning', 'Mixed-Use Development', 'AutoCAD', 'Revit', 'Urban Design'],
    },
  });

  const engineeringTeam = await prisma.team.create({
    data: {
      name: 'Engineering Team',
      department: 'Engineering',
      capacity: 280, // 7 engineers × 40 hours
      skills: ['Civil Engineering', 'Structural Design', 'MEP Systems', 'Site Development', 'Utility Coordination'],
    },
  });

  const projectTeam = await prisma.team.create({
    data: {
      name: 'Project Management',
      department: 'Operations',
      capacity: 200, // 5 PMs × 40 hours
      skills: ['Project Coordination', 'Schedule Management', 'Client Relations', 'Quality Control', 'Deliverable Management'],
    },
  });

  const businessTeam = await prisma.team.create({
    data: {
      name: 'Business Development',
      department: 'Business Development',
      capacity: 160, // 4 BD staff × 40 hours
      skills: ['Client Relations', 'Proposal Development', 'Market Analysis', 'Contract Negotiation', 'Strategic Planning'],
    },
  });

  // === ISSUE CLUSTERS ===
  
  const communicationCluster = await prisma.issueCluster.create({
    data: {
      name: 'Client Communication & Approval Workflows',
      description: 'Issues related to client communication, approval processes, and project coordination with builder teams',
      category: 'communication',
      severity: 'high',
      theme: 'Streamlining client interactions and approval cycles',
      keywords: ['approval', 'communication', 'client', 'review', 'coordination'],
      rootCauses: {
        primary: 'Lack of standardized approval workflow',
        secondary: 'Multiple stakeholder involvement without clear process',
        tertiary: 'Insufficient visibility into approval status'
      },
      impactAnalysis: {
        departments: ['Design', 'Project Management', 'Business Development'],
        severity: 'high',
        frequency: 'daily'
      },
      metrics: {
        issueCount: 8,
        avgResolutionDays: 21,
        priorityScore: 89
      },
      color: '#EF4444',
      isActive: true,
    },
  });

  const coordinationCluster = await prisma.issueCluster.create({
    data: {
      name: 'Project Coordination & Timeline Management',
      description: 'Challenges with project scheduling, resource allocation, and timeline coordination across multiple communities',
      category: 'coordination',
      severity: 'high',
      theme: 'Optimizing project delivery and resource management',
      keywords: ['timeline', 'coordination', 'scheduling', 'resources', 'delivery'],
      rootCauses: {
        primary: 'Inadequate project tracking systems',
        secondary: 'Resource allocation conflicts across projects',
        tertiary: 'Limited visibility into team capacity'
      },
      impactAnalysis: {
        departments: ['Project Management', 'Design', 'Engineering'],
        severity: 'high',
        frequency: 'weekly'
      },
      metrics: {
        issueCount: 6,
        avgResolutionDays: 28,
        priorityScore: 85
      },
      color: '#F59E0B',
      isActive: true,
    },
  });

  const technologyCluster = await prisma.issueCluster.create({
    data: {
      name: 'Technology & Documentation Standards',
      description: 'Technology adoption challenges, documentation standards, and system integration issues',
      category: 'technology',
      severity: 'medium',
      theme: 'Modernizing tools and standardizing processes',
      keywords: ['technology', 'documentation', 'standards', 'BIM', 'integration'],
      rootCauses: {
        primary: 'Inconsistent technology adoption across teams',
        secondary: 'Lack of standardized documentation templates',
        tertiary: 'Limited training on new tools'
      },
      impactAnalysis: {
        departments: ['Design', 'Engineering', 'Project Management'],
        severity: 'medium',
        frequency: 'monthly'
      },
      metrics: {
        issueCount: 5,
        avgResolutionDays: 45,
        priorityScore: 72
      },
      color: '#3B82F6',
      isActive: true,
    },
  });

  const qualityCluster = await prisma.issueCluster.create({
    data: {
      name: 'Quality Control & Deliverable Standards',
      description: 'Quality assurance processes, deliverable consistency, and client satisfaction issues',
      category: 'quality',
      severity: 'medium',
      theme: 'Ensuring consistent high-quality deliverables',
      keywords: ['quality', 'deliverables', 'standards', 'consistency', 'satisfaction'],
      rootCauses: {
        primary: 'Lack of standardized QA checklist',
        secondary: 'Inconsistent review processes',
        tertiary: 'Limited quality metrics tracking'
      },
      impactAnalysis: {
        departments: ['Design', 'Engineering', 'Project Management'],
        severity: 'medium',
        frequency: 'weekly'
      },
      metrics: {
        issueCount: 4,
        avgResolutionDays: 35,
        priorityScore: 68
      },
      color: '#10B981',
      isActive: true,
    },
  });

  // === ADDITIONAL CLUSTERS WITH VARIED STATES ===

  // Cluster 5: Legacy Process Optimization (Low Priority, Inactive)
  const legacyProcessCluster = await prisma.issueCluster.create({
    data: {
      name: 'Legacy Process Optimization',
      description: 'Older manual processes that could benefit from automation but are not critical pain points',
      category: 'process',
      severity: 'low',
      theme: 'Modernizing non-critical legacy workflows',
      keywords: ['legacy', 'manual', 'automation', 'optimization', 'efficiency'],
      rootCauses: {
        primary: 'Historic manual processes',
        secondary: 'Limited automation investment',
        tertiary: 'Change resistance'
      },
      impactAnalysis: {
        departments: ['Administration', 'Support'],
        severity: 'low',
        frequency: 'monthly'
      },
      metrics: {
        issueCount: 1,
        avgResolutionDays: 120,
        priorityScore: 25
      },
      color: '#94A3B8',
      isActive: false  // Marked as inactive/deprioritized
    },
  });

  // Cluster 6: Emergency Response & Business Continuity (Critical, New)
  const emergencyResponseCluster = await prisma.issueCluster.create({
    data: {
      name: 'Emergency Response & Business Continuity',
      description: 'Critical infrastructure for handling project emergencies and ensuring business continuity during disruptions',
      category: 'risk',
      severity: 'critical',
      theme: 'Ensuring resilient operations and emergency preparedness',
      keywords: ['emergency', 'continuity', 'risk', 'disaster', 'recovery'],
      rootCauses: {
        primary: 'Lack of formal emergency procedures',
        secondary: 'No backup communication systems',
        tertiary: 'Inadequate data backup protocols'
      },
      impactAnalysis: {
        departments: ['All Teams', 'IT', 'Leadership'],
        severity: 'critical',
        frequency: 'rare_but_critical'
      },
      metrics: {
        issueCount: 0,  // New cluster, no issues assigned yet
        avgResolutionDays: 0,
        priorityScore: 95
      },
      color: '#DC2626',
      isActive: true
    },
  });

  // === ISSUES ===
  
  // Communication & Approval Issues
  await prisma.issue.createMany({
    data: [
      {
        description: 'Builder approval process takes 3-4 weeks due to multiple stakeholder reviews and unclear approval hierarchy',
        votes: 12,
        heatmapScore: 92,
        department: 'Project Management',
        category: 'process',
        clusterId: communicationCluster.id,
        keywords: ['approval', 'builder', 'stakeholder', 'hierarchy'],
        crossImpact: {
          affectedDepartments: ['Design', 'Project Management', 'Business Development'],
          impactLevel: 'high',
          businessImpact: 'Revenue delay, client satisfaction'
        }
      },
      {
        description: 'Client design revisions are not tracked systematically, leading to scope creep and budget overruns',
        votes: 10,
        heatmapScore: 87,
        department: 'Design',
        category: 'process',
        clusterId: communicationCluster.id,
        keywords: ['revisions', 'scope', 'tracking', 'budget'],
        crossImpact: {
          affectedDepartments: ['Design', 'Project Management'],
          impactLevel: 'high',
          businessImpact: 'Profitability, timeline delays'
        }
      },
      {
        description: 'Municipal review feedback integration process lacks standardization across different jurisdictions',
        votes: 8,
        heatmapScore: 78,
        department: 'Project Management',
        category: 'process',
        clusterId: communicationCluster.id,
        keywords: ['municipal', 'feedback', 'standardization', 'jurisdictions'],
        crossImpact: {
          affectedDepartments: ['Project Management', 'Design', 'Engineering'],
          impactLevel: 'medium',
          businessImpact: 'Timeline uncertainty, rework'
        }
      },
      {
        description: 'Communication gaps between design and engineering teams cause rework on community infrastructure plans',
        votes: 9,
        heatmapScore: 82,
        department: 'Design',
        category: 'communication',
        clusterId: communicationCluster.id,
        keywords: ['communication', 'design', 'engineering', 'rework'],
        crossImpact: {
          affectedDepartments: ['Design', 'Engineering'],
          impactLevel: 'medium',
          businessImpact: 'Efficiency, timeline impact'
        }
      },
    ]
  });

  // Project Coordination Issues
  await prisma.issue.createMany({
    data: [
      {
        description: 'Multiple community projects competing for same senior architect resources, causing bottlenecks',
        votes: 11,
        heatmapScore: 89,
        department: 'Project Management',
        category: 'resources',
        clusterId: coordinationCluster.id,
        keywords: ['resources', 'architect', 'bottleneck', 'communities'],
        crossImpact: {
          affectedDepartments: ['Design', 'Project Management'],
          impactLevel: 'high',
          businessImpact: 'Project delays, resource utilization'
        }
      },
      {
        description: 'Project timeline dependencies between civil engineering and architectural design not properly mapped',
        votes: 9,
        heatmapScore: 84,
        department: 'Engineering',
        category: 'coordination',
        clusterId: coordinationCluster.id,
        keywords: ['timeline', 'dependencies', 'civil', 'architectural'],
        crossImpact: {
          affectedDepartments: ['Engineering', 'Design', 'Project Management'],
          impactLevel: 'high',
          businessImpact: 'Schedule optimization, delivery predictability'
        }
      },
      {
        description: 'Lack of visibility into team capacity for upcoming community phases affects proposal commitments',
        votes: 7,
        heatmapScore: 76,
        department: 'Business Development',
        category: 'planning',
        clusterId: coordinationCluster.id,
        keywords: ['capacity', 'visibility', 'proposals', 'phases'],
        crossImpact: {
          affectedDepartments: ['Business Development', 'Project Management'],
          impactLevel: 'medium',
          businessImpact: 'Business development, resource planning'
        }
      },
    ]
  });

  // Technology & Documentation Issues
  await prisma.issue.createMany({
    data: [
      {
        description: 'BIM standards inconsistency between architectural and engineering teams creates integration challenges',
        votes: 8,
        heatmapScore: 79,
        department: 'Engineering',
        category: 'technology',
        clusterId: technologyCluster.id,
        keywords: ['BIM', 'standards', 'integration', 'teams'],
        crossImpact: {
          affectedDepartments: ['Design', 'Engineering'],
          impactLevel: 'medium',
          businessImpact: 'Efficiency, deliverable quality'
        }
      },
      {
        description: 'Document version control across multiple community projects needs improvement for builder coordination',
        votes: 6,
        heatmapScore: 71,
        department: 'Project Management',
        category: 'documentation',
        clusterId: technologyCluster.id,
        keywords: ['version', 'control', 'documentation', 'builder'],
        crossImpact: {
          affectedDepartments: ['Project Management', 'Design', 'Engineering'],
          impactLevel: 'medium',
          businessImpact: 'Quality control, client confidence'
        }
      },
      {
        description: 'CAD drawing standards vary between teams, affecting deliverable consistency for national builders',
        votes: 5,
        heatmapScore: 68,
        department: 'Design',
        category: 'standards',
        clusterId: technologyCluster.id,
        keywords: ['CAD', 'standards', 'consistency', 'builders'],
        crossImpact: {
          affectedDepartments: ['Design', 'Engineering'],
          impactLevel: 'low',
          businessImpact: 'Brand consistency, efficiency'
        }
      },
    ]
  });

  // Quality Control Issues
  await prisma.issue.createMany({
    data: [
      {
        description: 'Quality review checklist for community master plans needs standardization across project managers',
        votes: 7,
        heatmapScore: 74,
        department: 'Project Management',
        category: 'quality',
        clusterId: qualityCluster.id,
        keywords: ['quality', 'checklist', 'standardization', 'plans'],
        crossImpact: {
          affectedDepartments: ['Project Management', 'Design'],
          impactLevel: 'medium',
          businessImpact: 'Quality consistency, efficiency'
        }
      },
      {
        description: 'Inconsistent deliverable formats across different builder relationships affect professional presentation',
        votes: 6,
        heatmapScore: 69,
        department: 'Design',
        category: 'deliverables',
        clusterId: qualityCluster.id,
        keywords: ['deliverables', 'formats', 'builders', 'presentation'],
        crossImpact: {
          affectedDepartments: ['Design', 'Business Development'],
          impactLevel: 'low',
          businessImpact: 'Professional image, client satisfaction'
        }
      },
      // Additional Issues for diverse cluster representation
      {
        description: 'Manual timesheet compilation process taking 2-3 hours weekly per project manager',
        votes: 3,
        heatmapScore: 25,
        department: 'Administration',
        category: 'Process',
        clusterId: legacyProcessCluster.id,
        keywords: ['manual', 'timesheet', 'administration', 'inefficient', 'legacy'],
        crossImpact: {
          affectedDepartments: ['Administration', 'Project Management'],
          impactLevel: 'low',
          businessImpact: 'Minor efficiency improvements'
        }
      },
      {
        description: 'Lack of documented emergency procedures for critical project delays or technical failures',
        votes: 12,
        heatmapScore: 95,
        department: 'Operations',
        category: 'Risk Management',
        clusterId: emergencyResponseCluster.id,
        keywords: ['emergency', 'procedures', 'crisis', 'risk', 'documentation'],
        crossImpact: {
          affectedDepartments: ['All Departments', 'Leadership', 'IT'],
          impactLevel: 'critical',
          businessImpact: 'Business continuity, risk mitigation'
        }
      },
    ]
  });

  // === INITIATIVES ===
  
  const now = new Date();
  const q1Start = new Date(now.getFullYear(), 0, 1);
  const q1End = new Date(now.getFullYear(), 2, 31);
  const q2Start = new Date(now.getFullYear(), 3, 1);
  const q2End = new Date(now.getFullYear(), 5, 30);
  const q3Start = new Date(now.getFullYear(), 6, 1);
  const q3End = new Date(now.getFullYear(), 8, 30);
  const q4Start = new Date(now.getFullYear(), 9, 1);
  const q4End = new Date(now.getFullYear(), 11, 31);

  // Initiative 1: Client Approval Workflow Optimization
  const approvalWorkflowInit = await prisma.initiative.create({
    data: {
      title: 'Client Approval Workflow Optimization',
      problem: 'Builder approval processes are taking 3-4 weeks due to unclear hierarchy and manual tracking, causing project delays and client frustration',
      goal: 'Reduce approval cycle time to 10-14 days through automated workflow system and clear approval hierarchies',
      kpis: ['Average Approval Cycle Time', 'Client Satisfaction Score', 'Project Timeline Adherence', 'Revision Request Volume'],
      requirements: [
        'Implement digital approval tracking system',
        'Define clear stakeholder hierarchy for each builder',
        'Create automated notification system',
        'Develop approval status dashboard',
        'Integrate with existing project management tools'
      ],
      acceptanceCriteria: [
        'Approval cycle time reduced to 14 days or less',
        'Client satisfaction score improved by 15%',
        'Zero approvals lost due to tracking gaps',
        'All stakeholders trained on new process'
      ],
      ownerId: projectDirector.id,
      timelineStart: q1Start,
      timelineEnd: q2End,
      status: 'ACTIVE',
      progress: 45,
      difficulty: 8,
      roi: 9,
      priorityScore: 92,
      budget: 75000,
      estimatedHours: 480,
      actualHours: 216,
      phase: 'development',
      type: 'Process Improvement',
      clusterId: communicationCluster.id,
      orderIndex: 1,
      crossImpact: {
        departments: ['Project Management', 'Design', 'Business Development'],
        businessValue: 'Improved client satisfaction, faster project delivery',
        risks: 'Change management, stakeholder adoption'
      },
      clusterMetrics: {
        issuesAddressed: 4,
        impactScore: 89,
        complexityRating: 8
      }
    },
  });

  // Initiative 2: Resource Planning & Capacity Management System
  const resourcePlanningInit = await prisma.initiative.create({
    data: {
      title: 'Resource Planning & Capacity Management System',
      problem: 'Multiple community projects competing for resources without visibility into team capacity, causing bottlenecks and proposal commitment issues',
      goal: 'Implement comprehensive resource planning system to optimize utilization and improve proposal accuracy',
      kpis: ['Resource Utilization Rate', 'Project Delivery On-Time', 'Proposal Win Rate', 'Team Productivity Score'],
      requirements: [
        'Deploy resource planning software',
        'Integrate with project management systems',
        'Create capacity forecasting models',
        'Develop skills matrix for team members',
        'Implement project demand forecasting'
      ],
      acceptanceCriteria: [
        'Resource utilization improved to 85%+',
        'Proposal accuracy increased by 20%',
        'Project delivery on-time rate improved to 90%',
        'Resource conflicts reduced by 75%'
      ],
      ownerId: principal.id,
      timelineStart: q2Start,
      timelineEnd: q3End,
      status: 'APPROVED',
      progress: 15,
      difficulty: 7,
      roi: 8,
      priorityScore: 85,
      budget: 95000,
      estimatedHours: 320,
      actualHours: 48,
      phase: 'planning',
      type: 'Strategic',
      clusterId: coordinationCluster.id,
      orderIndex: 2,
      crossImpact: {
        departments: ['Project Management', 'Business Development', 'Design', 'Engineering'],
        businessValue: 'Improved profitability, better project delivery',
        risks: 'Data quality, user adoption'
      },
      clusterMetrics: {
        issuesAddressed: 3,
        impactScore: 85,
        complexityRating: 7
      }
    },
  });

  // Initiative 3: BIM Standards & Integration Framework
  const bimStandardsInit = await prisma.initiative.create({
    data: {
      title: 'BIM Standards & Integration Framework',
      problem: 'Inconsistent BIM standards between teams and poor CAD drawing standardization affecting deliverable quality and client confidence',
      goal: 'Establish unified BIM/CAD standards and integration processes to ensure consistent, high-quality deliverables',
      kpis: ['Deliverable Consistency Score', 'Rework Reduction Rate', 'Client Quality Feedback', 'Integration Efficiency'],
      requirements: [
        'Develop unified BIM/CAD standards',
        'Create standardized templates and libraries',
        'Implement quality control checkpoints',
        'Train teams on new standards',
        'Integrate standards into project workflows'
      ],
      acceptanceCriteria: [
        'All teams using unified standards',
        'Rework due to inconsistency reduced by 60%',
        'Client quality feedback improved',
        'Template library adoption at 95%'
      ],
      ownerId: designDirector.id,
      timelineStart: q1Start,
      timelineEnd: q3End,
      status: 'ACTIVE',
      progress: 65,
      difficulty: 6,
      roi: 7,
      priorityScore: 78,
      budget: 45000,
      estimatedHours: 280,
      actualHours: 182,
      phase: 'development',
      type: 'Technology',
      clusterId: technologyCluster.id,
      orderIndex: 3,
      crossImpact: {
        departments: ['Design', 'Engineering'],
        businessValue: 'Improved quality, reduced rework',
        risks: 'Change resistance, training requirements'
      },
      clusterMetrics: {
        issuesAddressed: 3,
        impactScore: 78,
        complexityRating: 6
      }
    },
  });

  // Initiative 4: Quality Assurance Process Standardization
  const qaProcessInit = await prisma.initiative.create({
    data: {
      title: 'Quality Assurance Process Standardization',
      problem: 'Inconsistent quality review processes and deliverable formats across projects affecting professional presentation and client confidence',
      goal: 'Standardize QA processes and deliverable formats to ensure consistent high-quality outputs across all builder relationships',
      kpis: ['Quality Score Consistency', 'Client Satisfaction', 'Deliverable Standardization Rate', 'Review Efficiency'],
      requirements: [
        'Create standardized QA checklists',
        'Develop deliverable format templates',
        'Implement peer review processes',
        'Train project managers on QA standards',
        'Create quality metrics dashboard'
      ],
      acceptanceCriteria: [
        'All projects using standardized QA process',
        'Deliverable consistency score >90%',
        'Client satisfaction improved by 10%',
        'QA review time reduced by 25%'
      ],
      ownerId: projectDirector.id,
      timelineStart: q3Start,
      timelineEnd: q4End,
      status: 'PLANNING',
      progress: 5,
      difficulty: 5,
      roi: 6,
      priorityScore: 68,
      budget: 35000,
      estimatedHours: 200,
      actualHours: 10,
      phase: 'planning',
      type: 'Quality',
      clusterId: qualityCluster.id,
      orderIndex: 4,
      crossImpact: {
        departments: ['Project Management', 'Design', 'Engineering'],
        businessValue: 'Enhanced reputation, client retention',
        risks: 'Process overhead, adoption resistance'
      },
      clusterMetrics: {
        issuesAddressed: 2,
        impactScore: 68,
        complexityRating: 5
      }
    },
  });

  // === ADDITIONAL INITIATIVES WITH DIVERSE STATUSES ===

  // Initiative 5: Digital Project Dashboard Implementation (COMPLETED)
  const dashboardInit = await prisma.initiative.create({
    data: {
      title: 'Digital Project Dashboard Implementation',
      problem: 'Lack of real-time project visibility for stakeholders causing frequent status meetings and communication delays',
      goal: 'Deploy comprehensive project dashboard providing real-time visibility into all active community development projects',
      kpis: ['Dashboard Adoption Rate', 'Status Meeting Reduction', 'Stakeholder Satisfaction', 'Data Accuracy'],
      requirements: [
        'Deploy project management dashboard',
        'Integrate with existing CAD/BIM systems',
        'Create automated status reporting',
        'Implement stakeholder access controls',
        'Train teams on dashboard usage'
      ],
      acceptanceCriteria: [
        'All projects tracked in dashboard',
        'Status meetings reduced by 40%',
        'Stakeholder satisfaction >95%',
        'Real-time data accuracy >98%'
      ],
      ownerId: projectDirector.id,
      timelineStart: new Date(now.getFullYear(), 0, 1),
      timelineEnd: new Date(now.getFullYear(), 2, 31),
      status: 'COMPLETED',
      progress: 100,
      difficulty: 4,
      roi: 9,
      priorityScore: 95,
      budget: 25000,
      estimatedHours: 150,
      actualHours: 138,
      phase: 'completed',
      type: 'Technology',
      clusterId: coordinationCluster.id,
      orderIndex: 5,
      crossImpact: {
        departments: ['Project Management', 'Executive', 'All Teams'],
        businessValue: 'Improved transparency, reduced overhead',
        risks: 'Data security, user adoption'
      },
      clusterMetrics: {
        issuesAddressed: 2,
        impactScore: 95,
        complexityRating: 4
      }
    },
  });

  // Initiative 6: Client Portal Enhancement (ACTIVE)
  const clientPortalInit = await prisma.initiative.create({
    data: {
      title: 'Client Portal Enhancement',
      problem: 'Builders lack self-service access to project status, drawings, and approval workflows, causing excessive email communication',
      goal: 'Enhance client portal with self-service capabilities, document access, and automated approval tracking',
      kpis: ['Portal Usage Rate', 'Email Reduction', 'Client Satisfaction', 'Self-Service Adoption'],
      requirements: [
        'Upgrade client portal infrastructure',
        'Implement document version control',
        'Add mobile-responsive design',
        'Create approval workflow interface',
        'Develop notification system'
      ],
      acceptanceCriteria: [
        'Portal usage >80% of active clients',
        'Support emails reduced by 50%',
        'Mobile access >95% functional',
        'Approval cycle time reduced by 30%'
      ],
      ownerId: businessDev.id,
      timelineStart: new Date(now.getFullYear(), 1, 1),
      timelineEnd: new Date(now.getFullYear(), 5, 30),
      status: 'ACTIVE',
      progress: 75,
      difficulty: 7,
      roi: 8,
      priorityScore: 88,
      budget: 65000,
      estimatedHours: 320,
      actualHours: 240,
      phase: 'development',
      type: 'Technology',
      clusterId: communicationCluster.id,
      orderIndex: 6,
      crossImpact: {
        departments: ['Business Development', 'Project Management', 'IT'],
        businessValue: 'Improved client experience, reduced overhead',
        risks: 'Security vulnerabilities, training requirements'
      },
      clusterMetrics: {
        issuesAddressed: 4,
        impactScore: 88,
        complexityRating: 7
      }
    },
  });

  // Initiative 7: Team Skills Development Program (APPROVED)
  const skillsDevInit = await prisma.initiative.create({
    data: {
      title: 'Team Skills Development Program',
      problem: 'Skills gaps in emerging technologies (AI, sustainable design, advanced BIM) limiting competitive advantage',
      goal: 'Implement comprehensive skills development program to enhance team capabilities in key growth areas',
      kpis: ['Certification Rate', 'Skill Assessment Scores', 'Project Quality Metrics', 'Employee Satisfaction'],
      requirements: [
        'Conduct skills gap analysis',
        'Develop training curriculum',
        'Partner with certification providers',
        'Create mentorship programs',
        'Implement progress tracking'
      ],
      acceptanceCriteria: [
        '100% team members have development plans',
        'Average skill scores increased by 25%',
        'Certification rate >80%',
        'Employee satisfaction >90%'
      ],
      ownerId: principal.id,
      timelineStart: q2Start,
      timelineEnd: new Date(now.getFullYear() + 1, 2, 31),
      status: 'APPROVED',
      progress: 25,
      difficulty: 6,
      roi: 7,
      priorityScore: 82,
      budget: 75000,
      estimatedHours: 400,
      actualHours: 100,
      phase: 'planning',
      type: 'Strategic',
      orderIndex: 7,
      crossImpact: {
        departments: ['All Teams', 'HR', 'Leadership'],
        businessValue: 'Enhanced capabilities, competitive advantage',
        risks: 'Time investment, training costs'
      },
      clusterMetrics: {
        issuesAddressed: 1,
        impactScore: 82,
        complexityRating: 6
      }
    },
  });

  // Initiative 8: Sustainability Integration Framework (DRAFT)
  const sustainabilityInit = await prisma.initiative.create({
    data: {
      title: 'Sustainability Integration Framework',
      problem: 'Growing builder demand for sustainable design solutions without integrated sustainability assessment and reporting capabilities',
      goal: 'Develop integrated sustainability framework for all community development projects with automated reporting',
      kpis: ['Sustainability Score', 'Green Certification Rate', 'Energy Efficiency Metrics', 'Cost Impact'],
      requirements: [
        'Research sustainability standards',
        'Develop assessment framework',
        'Integrate with design tools',
        'Create reporting templates',
        'Train design teams'
      ],
      acceptanceCriteria: [
        'Framework covers all major standards',
        'Design tool integration >95%',
        'Automated reporting functional',
        'Team training completion >90%'
      ],
      ownerId: designDirector.id,
      timelineStart: q4Start,
      timelineEnd: new Date(now.getFullYear() + 1, 5, 31),
      status: 'DRAFT',
      progress: 10,
      difficulty: 8,
      roi: 6,
      priorityScore: 75,
      budget: 85000,
      estimatedHours: 450,
      actualHours: 45,
      phase: 'planning',
      type: 'Strategic',
      orderIndex: 8,
      crossImpact: {
        departments: ['Design', 'Engineering', 'Business Development'],
        businessValue: 'Market differentiation, regulatory compliance',
        risks: 'Technology complexity, changing standards'
      },
      clusterMetrics: {
        issuesAddressed: 1,
        impactScore: 75,
        complexityRating: 8
      }
    },
  });

  // === MILESTONES ===
  
  // Milestones for Approval Workflow Initiative
  await prisma.milestone.createMany({
    data: [
      {
        title: 'Stakeholder Hierarchy Definition Complete',
        description: 'Complete mapping of approval hierarchies for top 5 builder clients',
        dueDate: new Date(now.getFullYear(), 2, 15),
        status: 'completed',
        initiativeId: approvalWorkflowInit.id,
        progress: 100,
      },
      {
        title: 'Digital Tracking System Beta Launch',
        description: 'Beta version of approval tracking system deployed for pilot projects',
        dueDate: new Date(now.getFullYear(), 4, 30),
        status: 'in_progress',
        initiativeId: approvalWorkflowInit.id,
        progress: 70,
      },
      {
        title: 'Full System Rollout',
        description: 'Complete rollout of approval workflow system across all active projects',
        dueDate: new Date(now.getFullYear(), 5, 31),
        status: 'pending',
        initiativeId: approvalWorkflowInit.id,
        progress: 0,
      },
    ]
  });

  // === RESOURCE ASSIGNMENTS ===
  
  await prisma.resourceAssignment.createMany({
    data: [
      {
        initiativeId: approvalWorkflowInit.id,
        teamId: projectTeam.id,
        hoursAllocated: 240,
        role: 'Process Design & Implementation',
        startDate: q1Start,
        endDate: q2End
      },
      {
        initiativeId: approvalWorkflowInit.id,
        teamId: businessTeam.id,
        hoursAllocated: 120,
        role: 'Client Relationship Management',
        startDate: q1Start,
        endDate: q2End
      },
      {
        initiativeId: resourcePlanningInit.id,
        teamId: projectTeam.id,
        hoursAllocated: 160,
        role: 'Requirements & Process Design',
        startDate: q2Start,
        endDate: q3End
      },
      {
        initiativeId: bimStandardsInit.id,
        teamId: designTeam.id,
        hoursAllocated: 180,
        role: 'Standards Development',
        startDate: q1Start,
        endDate: q3End
      },
      {
        initiativeId: bimStandardsInit.id,
        teamId: engineeringTeam.id,
        hoursAllocated: 100,
        role: 'Engineering Standards Review',
        startDate: q1Start,
        endDate: q3End
      }
    ]
  });

  // === REQUIREMENT CARDS ===
  
  // Requirement cards for Approval Workflow Initiative
  await prisma.requirementCard.createMany({
    data: [
      {
        initiativeId: approvalWorkflowInit.id,
        type: 'BUSINESS',
        title: 'Stakeholder Hierarchy Management',
        description: 'System must support configurable approval hierarchies for different builder clients with role-based permissions',
        priority: 'HIGH',
        status: 'APPROVED',
        category: 'Core Functionality',
        assignedToId: projectDirector.id,
        createdById: principal.id,
        approvedById: principal.id,
        approvedAt: new Date(),
        orderIndex: 1,
      },
      {
        initiativeId: approvalWorkflowInit.id,
        type: 'FUNCTIONAL',
        title: 'Automated Notification System',
        description: 'Send automated notifications to stakeholders when approvals are pending, completed, or overdue',
        priority: 'HIGH',
        status: 'REVIEW',
        category: 'Automation',
        assignedToId: projectDirector.id,
        createdById: projectDirector.id,
        orderIndex: 2,
      },
      {
        initiativeId: approvalWorkflowInit.id,
        type: 'FUNCTIONAL',
        title: 'Mobile Approval Interface',
        description: 'Provide mobile-friendly interface for stakeholders to review and approve items on-the-go',
        priority: 'MEDIUM',
        status: 'DRAFT',
        category: 'User Experience',
        assignedToId: designDirector.id,
        createdById: businessDev.id,
        orderIndex: 3,
      },
      {
        initiativeId: approvalWorkflowInit.id,
        type: 'ACCEPTANCE',
        title: 'Performance Testing',
        description: 'System must handle concurrent approvals from 50+ stakeholders without performance degradation',
        priority: 'MEDIUM',
        status: 'DRAFT',
        category: 'Performance',
        createdById: engineeringDirector.id,
        orderIndex: 4,
      }
    ]
  });

  // === IDEAS ===
  
  const clientPortalIdea = await prisma.idea.create({
    data: {
      title: 'Client Self-Service Project Status Portal',
      description: 'Allow builder clients to access real-time project status, view deliverables, and submit feedback through a dedicated portal. This would reduce PM workload and improve transparency.',
      authorId: businessDev.id,
      category: 'technology',
      priority: 'high',
      status: 'reviewing',
      votes: 8,
      tags: ['client experience', 'automation', 'transparency', 'efficiency'],
      assignedTo: projectDirector.id,
      dueDate: new Date(now.getFullYear(), 6, 30),
      initiativeId: approvalWorkflowInit.id,
    },
  });

  const resourceForecastIdea = await prisma.idea.create({
    data: {
      title: 'AI-Powered Resource Forecasting',
      description: 'Implement machine learning to predict resource needs based on historical project data, seasonal patterns, and builder pipeline information.',
      authorId: principal.id,
      category: 'technology',
      priority: 'medium',
      status: 'approved',
      votes: 6,
      tags: ['AI', 'forecasting', 'resource planning', 'analytics'],
      assignedTo: engineeringDirector.id,
      initiativeId: resourcePlanningInit.id,
    },
  });

  const bimTrainingIdea = await prisma.idea.create({
    data: {
      title: 'BIM Certification Program for Team Members',
      description: 'Establish internal BIM certification program to ensure all team members meet standardized competency levels and stay current with industry best practices.',
      authorId: designDirector.id,
      category: 'process',
      priority: 'medium',
      status: 'idea',
      votes: 5,
      tags: ['training', 'certification', 'BIM', 'standards'],
      assignedTo: designDirector.id,
      initiativeId: bimStandardsInit.id,
    },
  });

  const qualityDashboardIdea = await prisma.idea.create({
    data: {
      title: 'Real-Time Quality Metrics Dashboard',
      description: 'Create executive dashboard showing quality metrics across all projects, including client satisfaction, rework rates, and compliance scores.',
      authorId: projectDirector.id,
      category: 'technology',
      priority: 'low',
      status: 'idea',
      votes: 4,
      tags: ['dashboard', 'metrics', 'quality', 'executive reporting'],
    },
  });

  // === COMMENTS ===
  
  // Comments on Approval Workflow Initiative
  await prisma.comment.create({
    data: {
      content: 'I think we should prioritize the mobile interface early. Our builder clients are increasingly mobile-first, and this could be a key differentiator.',
      authorId: businessDev.id,
      initiativeId: approvalWorkflowInit.id,
      mentions: [projectDirector.id, designDirector.id],
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Agreed on mobile priority. We should also consider integration with our existing project management tools to avoid duplicate data entry.',
      authorId: projectDirector.id,
      initiativeId: approvalWorkflowInit.id,
      mentions: [businessDev.id, engineeringDirector.id],
    },
  });

  const parentComment = await prisma.comment.findFirst({
    where: { authorId: businessDev.id, initiativeId: approvalWorkflowInit.id },
  });

  await prisma.comment.create({
    data: {
      content: 'Mobile interface is definitely the way to go. I can help with the technical requirements and API design for the mobile app integration.',
      authorId: engineeringDirector.id,
      parentId: parentComment?.id,
      initiativeId: approvalWorkflowInit.id,
    },
  });

  // Comments on BIM Standards Initiative
  await prisma.comment.create({
    data: {
      content: 'The new BIM standards are looking great. We should make sure to include specific guidelines for MEP coordination to avoid the integration issues we had on the Riverside Commons project.',
      authorId: engineeringDirector.id,
      initiativeId: bimStandardsInit.id,
      mentions: [designDirector.id],
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Good point on MEP coordination. I\'ve added that to our standards document. We should also schedule training sessions for the junior staff once we finalize everything.',
      authorId: designDirector.id,
      initiativeId: bimStandardsInit.id,
      mentions: [engineeringDirector.id, projectDirector.id],
    },
  });

  // Comments on Ideas
  await prisma.comment.create({
    data: {
      content: 'This client portal idea aligns perfectly with what we\'re hearing from our national builder partners. They want more transparency and self-service capabilities.',
      authorId: principal.id,
      ideaId: clientPortalIdea.id,
      mentions: [businessDev.id],
    },
  });

  await prisma.comment.create({
    data: {
      content: 'The AI forecasting concept is intriguing, but we should start with basic analytics first. Once we have good historical data, we can layer on the machine learning.',
      authorId: projectDirector.id,
      ideaId: resourceForecastIdea.id,
      mentions: [principal.id, engineeringDirector.id],
    },
  });

  // === VOTES ===
  
  // Create votes for initiatives, ideas, and issues
  const allUsers = [principal, designDirector, projectDirector, businessDev, engineeringDirector];
  
  // Vote on Client Portal Idea
  for (const user of [principal, projectDirector, engineeringDirector]) {
    await prisma.vote.create({
      data: {
        userId: user.id,
        ideaId: clientPortalIdea.id,
        type: 'up',
        value: 1,
      },
    });
  }

  // Vote on Resource Forecasting Idea
  for (const user of [principal, designDirector, projectDirector]) {
    await prisma.vote.create({
      data: {
        userId: user.id,
        ideaId: resourceForecastIdea.id,
        type: 'up',
        value: 1,
      },
    });
  }

  // Vote on high-priority issues
  const highPriorityIssues = await prisma.issue.findMany({
    where: { heatmapScore: { gte: 80 } },
    take: 3,
  });

  for (const issue of highPriorityIssues) {
    for (const user of allUsers.slice(0, 3)) {
      await prisma.vote.create({
        data: {
          userId: user.id,
          issueId: issue.id,
          type: 'priority',
          value: 1,
        },
      });
    }
  }

  // === AUDIT LOGS ===
  
  await prisma.auditLog.createMany({
    data: [
      {
        userId: principal.id,
        action: 'INITIATIVE_CREATED',
        details: {
          initiativeId: approvalWorkflowInit.id,
          title: 'Client Approval Workflow Optimization',
          impact: 'high'
        },
      },
      {
        userId: designDirector.id,
        action: 'BIM_STANDARDS_UPDATED',
        details: {
          initiativeId: bimStandardsInit.id,
          standardsVersion: '2.1',
          teamsAffected: ['Design', 'Engineering']
        },
      },
      {
        userId: businessDev.id,
        action: 'CLIENT_FEEDBACK_INTEGRATED',
        details: {
          ideaId: clientPortalIdea.id,
          clientName: 'National Community Builders',
          feedback: 'Self-service portal priority'
        },
      },
      {
        userId: projectDirector.id,
        action: 'RESOURCE_ALLOCATION_UPDATED',
        details: {
          initiativeId: resourcePlanningInit.id,
          teamReallocation: 'Project Management team capacity increased',
          impactedProjects: 3
        },
      },
    ]
  });

  console.log('✅ A&E firm seed data created successfully!');
  console.log('📊 Summary:');
  console.log('   👥 Users: 5 (Principal, Design Director, Project Director, Business Dev, Engineering Director)');
  console.log('   🏢 Teams: 4 (Design, Engineering, Project Management, Business Development)');
  console.log('   🎯 Issue Clusters: 6 (Communication, Coordination, Technology, Quality, Legacy Process [INACTIVE], Emergency Response [CRITICAL])');
  console.log('   📋 Issues: 14 (covering all major A&E operational areas with diverse cluster assignments)');
  console.log('   🚀 Initiatives: 8 (diverse statuses: ACTIVE×3, APPROVED×2, COMPLETED×1, DRAFT×1, PLANNING×1)');
  console.log('   💡 Ideas: 4 (innovation ideas from team members)');
  console.log('   📝 Comments: 8 (collaborative discussions on initiatives and ideas)');
  console.log('   ✅ Requirement Cards: 4 (detailed requirements for approval workflow)');
  console.log('   🎯 Milestones: 3 (project milestones with status tracking)');
  console.log('   📊 Resource Assignments: 5 (team allocations to initiatives)');
  console.log('   👍 Votes: Multiple (user engagement on ideas and issues)');
  console.log('   📈 Audit Logs: 4 (activity tracking)');
  console.log('');
  console.log('🎯 Enhanced Features:');
  console.log('   ✅ Diverse Initiative States (DRAFT→APPROVED→ACTIVE→COMPLETED pipeline)');
  console.log('   ✅ Active & Inactive Clusters (including deprioritized legacy processes)');
  console.log('   ✅ Critical Emergency Response Cluster (new high-priority area)');
  console.log('   ✅ Complete Kanban Board Population (Define, Prioritize, In Progress, Done)');
  console.log('   ✅ AI Clustering Ready (comprehensive issue-cluster relationships)');
  console.log('');
  console.log('🔑 Login Credentials:');
  console.log('   📧 principal@morrisonae.com / Admin123! (Principal - ADMIN)');
  console.log('   📧 sarah.chen@morrisonae.com / Admin123! (Design Director - LEADER)');
  console.log('   📧 mike.rodriguez@morrisonae.com / Admin123! (Project Director - LEADER)');
  console.log('   📧 jennifer.kim@morrisonae.com / Admin123! (Business Dev - LEADER)');
  console.log('   📧 alex.thompson@morrisonae.com / Admin123! (Engineering Director - LEADER)');
}

main()
  .catch((e) => {
    console.error('❌ Seed data creation failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
