const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Strategic Initiative Templates based on Employee Feedback Analysis
const STRATEGIC_INITIATIVES = [
  {
    title: "Workload Management & Burnout Prevention",
    problem: "42% of employee feedback indicates severe workload issues, burnout, and unrealistic deadlines causing stress, quality issues, and potential turnover.",
    goal: "Establish sustainable workload management practices that improve employee well-being while maintaining productivity and quality standards.",
    targetClusters: ['Workload Management', 'Work Environment'],
    businessJustification: "High employee turnover costs $15,000-$25,000 per replacement. Preventing burnout could save $300,000+ annually while improving quality and customer satisfaction.",
    expectedROI: 500000,
    budget: 150000, 
    type: "OPERATIONAL_IMPROVEMENT",
    phase: "PLANNING",
    status: "APPROVED",
    priority: 1,
    kpis: [
      "Reduce overtime hours by 30%",
      "Improve employee satisfaction scores by 25%", 
      "Decrease stress-related sick days by 40%",
      "Maintain quality metrics above 95%"
    ],
    solutions: [
      {
        title: "Workload Analytics & Capacity Planning System",
        description: "Implement AI-powered workload tracking and capacity planning to optimize task distribution and identify bottlenecks before they cause burnout.",
        type: "TECHNOLOGY",
        status: "IN_PROGRESS",
        priority: 1,
        estimatedHours: 160,
        actualHours: 85,
        tasks: [
          { title: "Requirements gathering and stakeholder interviews", status: "COMPLETED", progress: 100 },
          { title: "Vendor evaluation and system selection", status: "COMPLETED", progress: 100 },
          { title: "System integration and configuration", status: "IN_PROGRESS", progress: 60 },
          { title: "User training and change management", status: "TODO", progress: 0 },
          { title: "Performance monitoring and optimization", status: "TODO", progress: 0 }
        ]
      },
      {
        title: "Flexible Work Arrangements Policy",
        description: "Develop comprehensive remote/hybrid work policies with clear expectations, productivity metrics, and work-life balance guidelines.",
        type: "POLICY", 
        status: "PLANNED",
        priority: 2,
        estimatedHours: 80,
        tasks: [
          { title: "Benchmark industry best practices", status: "IN_PROGRESS", progress: 75 },
          { title: "Draft policy framework and guidelines", status: "TODO", progress: 0 },
          { title: "Legal review and compliance validation", status: "TODO", progress: 0 },
          { title: "Manager training on flexible work management", status: "TODO", progress: 0 }
        ]
      },
      {
        title: "Burnout Prevention Training Program",
        description: "Comprehensive training for managers and employees on recognizing burnout signs, stress management, and building resilient work cultures.",
        type: "TRAINING",
        status: "DRAFT", 
        priority: 3,
        estimatedHours: 120,
        tasks: [
          { title: "Develop training curriculum and materials", status: "TODO", progress: 0 },
          { title: "Pilot program with select teams", status: "TODO", progress: 0 },
          { title: "Full organization rollout", status: "TODO", progress: 0 },
          { title: "Measure effectiveness and iterate", status: "TODO", progress: 0 }
        ]
      }
    ]
  },
  
  {
    title: "Communication & Collaboration Excellence",
    problem: "Communication breakdown between departments creates misalignment, inefficiencies, and frustration. 38% of issues relate to poor communication, transparency, and collaboration.",
    goal: "Establish clear communication channels, transparent decision-making processes, and effective cross-functional collaboration mechanisms.",
    targetClusters: ['Communication', 'Management Support'],
    businessJustification: "Poor communication costs organizations an average of $37 billion annually. Improved communication can increase productivity by 25% and reduce project delays by 40%.",
    expectedROI: 750000,
    budget: 200000,
    type: "PROCESS_IMPROVEMENT", 
    phase: "EXECUTION",
    status: "IN_PROGRESS",
    priority: 1,
    kpis: [
      "Reduce cross-departmental project delays by 40%",
      "Improve communication satisfaction scores by 35%",
      "Increase successful project delivery rate by 25%",
      "Reduce email volume by 30% through better tools"
    ],
    solutions: [
      {
        title: "Unified Communication Platform",
        description: "Implement enterprise communication platform with integrated chat, video, project management, and knowledge sharing capabilities.",
        type: "TECHNOLOGY",
        status: "COMPLETED",
        priority: 1,
        estimatedHours: 200,
        actualHours: 185,
        tasks: [
          { title: "Platform evaluation and vendor selection", status: "COMPLETED", progress: 100 },
          { title: "Technical implementation and integration", status: "COMPLETED", progress: 100 },
          { title: "User migration and training", status: "COMPLETED", progress: 100 },
          { title: "Adoption monitoring and support", status: "COMPLETED", progress: 100 }
        ]
      },
      {
        title: "Cross-Functional Process Framework",
        description: "Standardize cross-departmental workflows, decision-making processes, and accountability structures to improve collaboration effectiveness.",
        type: "PROCESS",
        status: "IN_PROGRESS",
        priority: 2,
        estimatedHours: 150,
        actualHours: 90,
        tasks: [
          { title: "Map current cross-functional processes", status: "COMPLETED", progress: 100 },
          { title: "Design optimized workflow frameworks", status: "IN_PROGRESS", progress: 70 },
          { title: "Pilot new processes with key teams", status: "IN_PROGRESS", progress: 40 },
          { title: "Full organization implementation", status: "TODO", progress: 0 },
          { title: "Continuous improvement and optimization", status: "TODO", progress: 0 }
        ]
      }
    ]
  },

  {
    title: "Technology Infrastructure Modernization",
    problem: "Outdated technology, poor system integration, and slow IT support significantly impact productivity. 28% of feedback highlights technology frustrations and inefficiencies.",
    goal: "Modernize technology infrastructure to provide reliable, integrated, and user-friendly tools that enhance rather than hinder productivity.",
    targetClusters: ['Technology', 'Process Improvement'],
    businessJustification: "Technology inefficiencies cost 21 hours per employee per month. Modernization can improve productivity by 30% and reduce IT support costs by 45%.",
    expectedROI: 1200000,
    budget: 400000,
    type: "TECHNOLOGY_UPGRADE",
    phase: "PLANNING",
    status: "APPROVED", 
    priority: 2,
    kpis: [
      "Reduce IT support tickets by 50%",
      "Improve system uptime to 99.9%",
      "Increase user satisfaction with technology by 40%",
      "Reduce time spent on manual processes by 35%"
    ],
    solutions: [
      {
        title: "Legacy System Integration Platform",
        description: "Implement enterprise integration platform to connect disparate systems and eliminate manual data entry and reconciliation.",
        type: "TECHNOLOGY",
        status: "PLANNED",
        priority: 1,
        estimatedHours: 300,
        tasks: [
          { title: "Current state technology assessment", status: "COMPLETED", progress: 100 },
          { title: "Integration architecture design", status: "IN_PROGRESS", progress: 45 },
          { title: "Platform procurement and setup", status: "TODO", progress: 0 },
          { title: "System integrations development", status: "TODO", progress: 0 },
          { title: "Testing and deployment", status: "TODO", progress: 0 }
        ]
      },
      {
        title: "IT Service Management Optimization",
        description: "Redesign IT support processes with self-service portal, automated ticket routing, and proactive monitoring to improve response times.",
        type: "PROCESS",
        status: "DRAFT",
        priority: 2,
        estimatedHours: 120,
        tasks: [
          { title: "Analyze current IT service performance", status: "TODO", progress: 0 },
          { title: "Design improved service processes", status: "TODO", progress: 0 },
          { title: "Implement self-service capabilities", status: "TODO", progress: 0 },
          { title: "Train support team on new processes", status: "TODO", progress: 0 }
        ]
      }
    ]
  },

  {
    title: "Management Development & Employee Engagement",
    problem: "Leadership gaps in providing guidance, feedback, and career development support are affecting employee engagement and retention. 35% of feedback relates to management and support issues.",
    goal: "Develop strong management capabilities and create comprehensive employee engagement and development programs to improve retention and performance.",
    targetClusters: ['Management Support', 'Work Environment'],
    businessJustification: "Strong management reduces turnover by 40% and improves productivity by 23%. Investment in leadership development shows 3:1 ROI within 18 months.",
    expectedROI: 600000,
    budget: 180000,
    type: "PEOPLE_DEVELOPMENT",
    phase: "EXECUTION", 
    status: "IN_PROGRESS",
    priority: 2,
    kpis: [
      "Improve manager effectiveness ratings by 30%",
      "Increase employee engagement scores by 25%",
      "Reduce voluntary turnover by 35%",
      "Improve internal promotion rate by 50%"
    ],
    solutions: [
      {
        title: "Leadership Development Program",
        description: "Comprehensive management training covering coaching, feedback, performance management, and team development skills.",
        type: "TRAINING",
        status: "IN_PROGRESS",
        priority: 1,
        estimatedHours: 180,
        actualHours: 95,
        tasks: [
          { title: "Leadership competency assessment", status: "COMPLETED", progress: 100 },
          { title: "Custom curriculum development", status: "COMPLETED", progress: 100 },
          { title: "Manager cohort training delivery", status: "IN_PROGRESS", progress: 65 },
          { title: "Individual coaching and mentoring", status: "IN_PROGRESS", progress: 40 },
          { title: "Progress evaluation and program refinement", status: "TODO", progress: 0 }
        ]
      },
      {
        title: "Career Development Framework",
        description: "Structured career pathing with clear competencies, growth opportunities, and individualized development plans for all employees.",
        type: "PROCESS",
        status: "PLANNED",
        priority: 2,
        estimatedHours: 100,
        tasks: [
          { title: "Role competency mapping and career paths", status: "IN_PROGRESS", progress: 80 },
          { title: "Development planning process design", status: "TODO", progress: 0 },
          { title: "Manager training on career conversations", status: "TODO", progress: 0 },
          { title: "Employee portal and tracking system", status: "TODO", progress: 0 }
        ]
      }
    ]
  }
];

// Seed realistic ideas that could become future initiatives
const IMPROVEMENT_IDEAS = [
  {
    title: "AI-Powered Employee Wellbeing Monitor",
    description: "Use sentiment analysis and workload data to proactively identify employees at risk of burnout before it becomes critical.",
    category: "Innovation",
    author: "HR Team"
  },
  {
    title: "Dynamic Team Formation Algorithm", 
    description: "Algorithm to optimally form cross-functional teams based on skills, availability, and collaboration patterns.",
    category: "Process Optimization",
    author: "Operations Team"
  },
  {
    title: "Gamified Professional Development",
    description: "Gamification platform that makes skill development engaging with achievements, leaderboards, and peer recognition.",
    category: "People Development", 
    author: "Learning & Development"
  },
  {
    title: "Automated Meeting Optimization",
    description: "AI assistant that analyzes meeting patterns and automatically suggests optimizations to reduce meeting fatigue.",
    category: "Productivity",
    author: "Engineering Team"
  },
  {
    title: "Workplace Flexibility Scoring",
    description: "Scoring system to help managers and employees find optimal work arrangements based on role, preferences, and performance.",
    category: "Work-Life Balance",
    author: "People Operations"
  }
];

async function createComprehensiveFlowVisionSeed() {
  console.log('🚀 Creating comprehensive FlowVision demonstration seed data...');
  
  // Clear existing data (order matters due to foreign key constraints)
  console.log('🗑️ Clearing existing data...');
  await prisma.solutionTask.deleteMany();
  await prisma.initiativeSolution.deleteMany();
  await prisma.initiative.deleteMany();
  await prisma.issueCluster.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.idea.deleteMany();
  await prisma.aIConfiguration.deleteMany();
  // Clear business profiles and users last
  await prisma.businessProfile.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@flowvision.dev',
      passwordHash: await bcrypt.hash('Admin123!', 10),
      role: 'ADMIN',
      name: 'FlowVision Admin'
    }
  });

  // Setup AI Configuration
  console.log('🤖 Setting up AI configuration...');
  await setupAIConfiguration(adminUser.id);

  // Create issues from employee feedback (reuse existing logic)
  console.log('📝 Creating employee feedback issues...');
  const issues = await createEmployeeFeedbackIssues(adminUser.id);

  // Create issue clusters
  console.log('🧩 Creating strategic issue clusters...');
  const clusters = await createStrategicClusters(issues, adminUser.id);

  // Create strategic initiatives
  console.log('🎯 Creating strategic initiatives...');
  const initiatives = await createStrategicInitiatives(clusters, adminUser.id);

  // Create improvement ideas
  console.log('💡 Creating improvement ideas...');
  await createImprovementIdeas(adminUser.id);

  console.log(`✅ Comprehensive FlowVision seed completed successfully!`);
  console.log(`📊 Created: ${issues.length} issues, ${clusters.length} clusters, ${initiatives.length} initiatives`);
  
  return { issues, clusters, initiatives };
}

async function createEmployeeFeedbackIssues(userId) {
  // Employee feedback data (keeping the existing structure)
  const EMPLOYEE_FEEDBACK_DATA = {
    workloadBurnout: [
      "I feel burnt out due to heavy workload and lack of resources",
      "Constant pressure to deliver results with no time for proper planning", 
      "Workload distribution is uneven across the team",
      "No time for skill development due to overwhelming day-to-day tasks",
      "Weekend work has become the norm rather than exception",
      "Unrealistic deadlines are causing stress and quality issues"
    ],
    communication: [
      "Poor communication between departments leads to misaligned goals",
      "Lack of transparency in decision-making processes",
      "Meetings are unproductive and too frequent",
      "Remote team members feel disconnected and unsupported",
      "Important information often gets lost in email chains",
      "Cross-functional collaboration is hampered by silos"
    ],
    managementSupport: [
      "Insufficient feedback and recognition for good work",
      "Management is not accessible for guidance and support",
      "Career development paths are unclear", 
      "New employees lack proper onboarding support",
      "Performance reviews are infrequent and not constructive",
      "Managers seem overwhelmed and unable to provide direction"
    ],
    workEnvironment: [
      "Office environment is not conducive to productivity",
      "Work-life balance is poor with frequent overtime expectations",
      "Team morale is low due to recent organizational changes",
      "Lack of flexibility in work arrangements",
      "Open office layout creates too many distractions",
      "Remote work policies are inconsistent and confusing"
    ],
    technology: [
      "Outdated software slows down productivity",
      "IT support response time is too slow",
      "Multiple systems don't integrate well",
      "Security protocols are overly complex and time-consuming",
      "Frequent system outages disrupt work flow",
      "Software licensing restrictions prevent using best tools"
    ],
    procedures: [
      "Approval processes take too long and have too many steps",
      "Documentation is outdated and hard to find",
      "Project management processes are inconsistent across teams",
      "Quality control procedures need improvement",
      "Compliance requirements are constantly changing",
      "Standard operating procedures are not well communicated"
    ],
    resources: [
      "Budget constraints limit necessary tool purchases",
      "Staffing levels are insufficient for current project load",
      "Training resources are limited and outdated",
      "Workspace allocation doesn't support team collaboration",
      "Equipment and hardware are outdated and unreliable",
      "Vendor management processes cause delays in procurement"
    ]
  };

  const DEPARTMENTS = [
    'Engineering', 'Sales', 'Marketing', 'HR', 'Finance',
    'Operations', 'Customer Success', 'Product', 'IT', 'Legal'
  ];

  const issues = [];
  
  for (const [categoryKey, feedbackList] of Object.entries(EMPLOYEE_FEEDBACK_DATA)) {
    const category = categoryKey === 'workloadBurnout' ? 'Workload Management' :
                    categoryKey === 'communication' ? 'Communication' :
                    categoryKey === 'managementSupport' ? 'Management Support' :
                    categoryKey === 'workEnvironment' ? 'Work Environment' :
                    categoryKey === 'technology' ? 'Technology' :
                    categoryKey === 'procedures' ? 'Process Improvement' :
                    'Resource Allocation';

    for (let i = 0; i < feedbackList.length; i++) {
      const description = feedbackList[i];
      const department = DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)];
      
      const issue = await prisma.issue.create({
        data: {
          description,
          votes: Math.floor(Math.random() * 25) + 5, // 5-30 votes
          heatmapScore: Math.floor(Math.random() * 40) + 60, // 60-100 score
          category,
          department,
          keywords: generateKeywords(category, description),
          crossImpact: generateCrossImpact(category),
          // Some issues have AI analysis
          aiSummary: Math.random() > 0.4 ? `AI Analysis: ${description.substring(0, 100)}...` : null,
          aiConfidence: Math.random() > 0.4 ? Math.floor(Math.random() * 30) + 70 : null,
          aiGeneratedAt: Math.random() > 0.4 ? new Date() : null,
          aiVersion: Math.random() > 0.4 ? 'gpt-3.5-turbo' : null
        }
      });
      
      issues.push(issue);
    }
  }
  
  return issues;
}

async function createStrategicClusters(issues, userId) {
  const clusterTemplates = [
    {
      name: 'Workload Management',
      description: 'Multiple reports of burnout, unrealistic deadlines, and poor work-life balance requiring immediate organizational attention.',
      category: 'People & Culture',
      theme: 'Employee Burnout Prevention'
    },
    {
      name: 'Communication',
      description: 'Consistent feedback about communication breakdowns, information silos, and ineffective meeting patterns impacting productivity.',
      category: 'Process & Systems', 
      theme: 'Cross-Functional Collaboration'
    },
    {
      name: 'Management Support',
      description: 'Leadership gaps in providing guidance, feedback, and career development support affecting employee engagement.',
      category: 'People & Culture',
      theme: 'Leadership Development'
    },
    {
      name: 'Work Environment',
      description: 'Environmental and cultural factors impacting employee satisfaction, productivity, and retention.',
      category: 'People & Culture', 
      theme: 'Workplace Culture'
    },
    {
      name: 'Technology',
      description: 'Technology inefficiencies and integration issues creating productivity barriers and user frustration.',
      category: 'Process & Systems',
      theme: 'Infrastructure Modernization'
    },
    {
      name: 'Process Improvement',
      description: 'Inefficient processes, unclear procedures, and compliance challenges hindering organizational effectiveness.',
      category: 'Process & Systems',
      theme: 'Operational Excellence'
    },
    {
      name: 'Resource Allocation',
      description: 'Resource constraints and allocation inefficiencies limiting organizational growth and capability development.',
      category: 'Strategic',
      theme: 'Resource Optimization'
    }
  ];

  const clusters = [];
  
  for (const template of clusterTemplates) {
    const relatedIssues = issues.filter(issue => 
      issue.category === template.name ||
      issue.keywords.some(keyword => 
        template.name.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    if (relatedIssues.length > 0) {
      const cluster = await prisma.issueCluster.create({
        data: {
          name: template.name,
          description: template.description,
          category: template.category,
          theme: template.theme,
          keywords: generateKeywords(template.name, template.description)
        }
      });
      
      // Update related issues to link to this cluster
      await prisma.issue.updateMany({
        where: {
          id: { in: relatedIssues.map(issue => issue.id) }
        },
        data: {
          clusterId: cluster.id
        }
      });
      
      clusters.push(cluster);
    }
  }
  
  return clusters;
}

async function createStrategicInitiatives(clusters, userId) {
  const initiatives = [];
  
  for (const initiativeTemplate of STRATEGIC_INITIATIVES) {
    const initiative = await prisma.initiative.create({
      data: {
        title: initiativeTemplate.title,
        problem: initiativeTemplate.problem,
        goal: initiativeTemplate.goal,
        kpis: initiativeTemplate.kpis,
        requirements: [
          'Executive sponsorship and support',
          'Cross-functional team collaboration',
          'Change management and communication',
          'Regular progress monitoring and reporting'
        ],
        acceptanceCriteria: [
          'Achieve measurable improvement in target KPIs',
          'Successful implementation across all affected departments', 
          'Sustainable process and cultural changes',
          'Positive employee feedback and adoption'
        ],
        ownerId: userId,
        timelineStart: new Date(),
        timelineEnd: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
        budget: initiativeTemplate.budget,
        type: initiativeTemplate.type,
        phase: initiativeTemplate.phase,
        status: initiativeTemplate.status,
        priorityScore: initiativeTemplate.priority,
        roi: initiativeTemplate.expectedROI
      }
    });

    // Create solutions for each initiative
    for (let i = 0; i < initiativeTemplate.solutions.length; i++) {
      const solutionTemplate = initiativeTemplate.solutions[i];
      
      const solution = await prisma.initiativeSolution.create({
        data: {
          initiativeId: initiative.id,
          title: solutionTemplate.title,
          description: solutionTemplate.description,
          type: solutionTemplate.type,
          status: solutionTemplate.status,
          priority: solutionTemplate.priority,
          estimatedHours: solutionTemplate.estimatedHours,
          actualHours: solutionTemplate.actualHours || null,
          plannedStartDate: new Date(),
          plannedEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 3 months
        }
      });

      // Create tasks for each solution
      for (let j = 0; j < solutionTemplate.tasks.length; j++) {
        const taskTemplate = solutionTemplate.tasks[j];
        
        await prisma.solutionTask.create({
          data: {
            solutionId: solution.id,
            title: taskTemplate.title,
            description: `Detailed implementation of: ${taskTemplate.title}`,
            status: taskTemplate.status,
            priority: j + 1, // Sequential priority
            assignedToId: userId,
            progress: taskTemplate.progress,
            estimatedHours: Math.floor(Math.random() * 20) + 5, // 5-25 hours
            completedAt: taskTemplate.status === 'COMPLETED' ? new Date() : null
          }
        });
      }
    }
    
    initiatives.push(initiative);
  }
  
  return initiatives;
}

async function createImprovementIdeas(userId) {
  for (const ideaTemplate of IMPROVEMENT_IDEAS) {
    await prisma.idea.create({
      data: {
        title: ideaTemplate.title,
        description: ideaTemplate.description,
        category: ideaTemplate.category,
        authorId: userId,
        votes: Math.floor(Math.random() * 15) + 3, // 3-18 votes
        status: 'SUBMITTED'
      }
    });
  }
}

// Helper functions
function generateKeywords(category, description) {
  const keywordMap = {
    'Workload Management': ['burnout', 'workload', 'stress', 'deadlines', 'capacity', 'overtime'],
    'Communication': ['communication', 'collaboration', 'meetings', 'transparency', 'alignment', 'feedback'],
    'Management Support': ['management', 'leadership', 'guidance', 'career', 'development', 'recognition'],
    'Work Environment': ['environment', 'culture', 'morale', 'flexibility', 'balance', 'productivity'],
    'Technology': ['technology', 'software', 'systems', 'integration', 'tools', 'IT'],
    'Process Improvement': ['process', 'workflow', 'procedures', 'efficiency', 'documentation', 'standards'],
    'Resource Allocation': ['resources', 'budget', 'staffing', 'equipment', 'training', 'capacity']
  };
  
  const baseKeywords = keywordMap[category] || [];
  const textKeywords = description.toLowerCase()
    .split(' ')
    .filter(word => word.length > 4)
    .slice(0, 3);
    
  return [...baseKeywords, ...textKeywords].slice(0, 6);
}

function generateCrossImpact(category) {
  const impactMap = {
    'Workload Management': ['productivity', 'quality', 'employee satisfaction', 'retention'],
    'Communication': ['alignment', 'efficiency', 'decision making', 'collaboration'],
    'Management Support': ['engagement', 'development', 'performance', 'retention'],
    'Work Environment': ['productivity', 'satisfaction', 'creativity', 'well-being'],
    'Technology': ['efficiency', 'innovation', 'competitiveness', 'security'],
    'Process Improvement': ['efficiency', 'quality', 'compliance', 'scalability'],
    'Resource Allocation': ['performance', 'growth', 'competitiveness', 'sustainability']
  };
  
  return impactMap[category] || ['performance', 'efficiency', 'satisfaction'];
}

async function setupAIConfiguration(userId) {
  const aiConfigs = [
    { key: 'OPENAI_API_KEY', value: process.env.OPENAI_API_KEY || '', updatedBy: userId },
    { key: 'OPENAI_MODEL', value: process.env.OPENAI_MODEL || 'gpt-3.5-turbo', updatedBy: userId },
    { key: 'OPENAI_MAX_TOKENS', value: process.env.OPENAI_MAX_TOKENS || '1000', updatedBy: userId },
    { key: 'OPENAI_TEMPERATURE', value: process.env.OPENAI_TEMPERATURE || '0.7', updatedBy: userId },
    { key: 'OPENAI_ENABLED', value: process.env.OPENAI_ENABLED || 'true', updatedBy: userId }
  ];

  for (const config of aiConfigs) {
    await prisma.aIConfiguration.upsert({
      where: { key: config.key },
      update: { value: config.value, updatedBy: config.updatedBy },
      create: config
    });
  }
}

// Execute if running directly
if (require.main === module) {
  createComprehensiveFlowVisionSeed()
    .catch((e) => {
      console.error('❌ Seed failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { createComprehensiveFlowVisionSeed };
