const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Real employee feedback data extracted from screenshots
const EMPLOYEE_FEEDBACK_DATA = {
  // People-related issues
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
  
  // Process-related issues
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

// Department mappings for realistic categorization
const DEPARTMENTS = [
  'Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 
  'Operations', 'Customer Success', 'Product', 'IT', 'Legal'
];

// Issue categories based on feedback themes
const ISSUE_CATEGORIES = [
  'Workload Management', 'Communication', 'Management Support', 
  'Work Environment', 'Technology', 'Process Improvement', 
  'Resource Allocation', 'Culture', 'Training', 'Infrastructure'
];

// Generate realistic keywords for each issue type
const generateKeywords = (category, description) => {
  const keywordMap = {
    'Workload Management': ['burnout', 'workload', 'stress', 'deadlines', 'capacity', 'overtime'],
    'Communication': ['communication', 'collaboration', 'meetings', 'transparency', 'alignment', 'feedback'],
    'Management Support': ['management', 'leadership', 'guidance', 'career', 'development', 'recognition'],
    'Work Environment': ['environment', 'culture', 'morale', 'flexibility', 'balance', 'productivity'],
    'Technology': ['technology', 'software', 'systems', 'integration', 'tools', 'IT'],
    'Process Improvement': ['process', 'workflow', 'procedures', 'efficiency', 'documentation', 'standards'],
    'Resource Allocation': ['resources', 'budget', 'staffing', 'equipment', 'training', 'capacity'],
    'Culture': ['culture', 'morale', 'engagement', 'values', 'team', 'collaboration'],
    'Training': ['training', 'skills', 'development', 'learning', 'onboarding', 'education'],
    'Infrastructure': ['infrastructure', 'equipment', 'workspace', 'facilities', 'hardware', 'security']
  };
  
  const baseKeywords = keywordMap[category] || [];
  const textKeywords = description.toLowerCase()
    .split(' ')
    .filter(word => word.length > 4)
    .slice(0, 3);
    
  return [...baseKeywords, ...textKeywords].slice(0, 6);
};

// Generate cross-impact relationships
const generateCrossImpact = (category) => {
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
};

async function createEmployeeFeedbackSeed() {
  console.log('🌱 Starting employee feedback seed data creation...');
  
  // Clear existing data
  console.log('🗑️ Clearing existing data...');
  await prisma.issue.deleteMany();
  await prisma.issueCluster.deleteMany();
  await prisma.initiative.deleteMany();
  await prisma.initiativeSolution.deleteMany();
  await prisma.solutionTask.deleteMany();
  await prisma.idea.deleteMany();
  
  // Create Issues from real employee feedback
  console.log('📝 Creating issues from employee feedback...');
  const issues = [];
  let issueIndex = 0;
  
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
      const votes = Math.floor(Math.random() * 50) + 5; // 5-55 votes
      const heatmapScore = Math.min(100, votes * 2 + Math.floor(Math.random() * 20));
      
      const issue = await prisma.issue.create({
        data: {
          description,
          votes,
          heatmapScore,
          department,
          category,
          keywords: generateKeywords(category, description),
          crossImpact: generateCrossImpact(category),
          similarity: Math.floor(Math.random() * 30) + 70, // 70-100% similarity within category
          // AI analysis for high-impact issues
          ...(heatmapScore > 60 && {
            aiSummary: `High-impact ${category.toLowerCase()} issue requiring immediate attention`,
            aiConfidence: Math.floor(Math.random() * 20) + 80, // 80-100% confidence
            aiGeneratedAt: new Date(),
            aiVersion: 'gpt-3.5-turbo',
            aiAnalysisDetails: {
              summary: `Critical ${category.toLowerCase()} concern affecting ${department} department`,
              rootCauses: [
                'Systemic organizational challenges',
                'Resource constraints',
                'Process inefficiencies'
              ],
              impact: `Significant impact on team productivity and employee satisfaction in ${department}`,
              recommendations: [
                'Implement immediate process improvements',
                'Allocate additional resources',
                'Establish regular feedback mechanisms',
                'Review and update current procedures'
              ],
              confidence: Math.floor(Math.random() * 20) + 80
            }
          })
        }
      });
      
      issues.push(issue);
      issueIndex++;
    }
  }
  
  console.log(`✅ Created ${issues.length} issues from employee feedback`);
  
  // Create Issue Clusters based on categories
  console.log('🔗 Creating issue clusters...');
  const clusters = [];
  
  for (const category of ISSUE_CATEGORIES) {
    const categoryIssues = issues.filter(issue => issue.category === category);
    if (categoryIssues.length === 0) continue;
    
    const cluster = await prisma.issueCluster.create({
      data: {
        name: `${category} Challenges`,
        description: `Collection of employee feedback related to ${category.toLowerCase()} concerns`,
        category: category.toLowerCase().replace(' ', '_'),
        theme: `${category} workplace concerns`,
        keywords: generateKeywords(category, `${category} related issues`),
        // AI analysis for significant clusters
        ...(categoryIssues.length >= 3 && {
          aiSummary: `Significant cluster of ${category.toLowerCase()} issues requiring strategic intervention`,
          aiConfidence: Math.floor(Math.random() * 15) + 85,
          aiGeneratedAt: new Date(),
          aiVersion: 'gpt-3.5-turbo',
          aiAnalysisDetails: {
            summary: `Critical cluster representing systemic ${category.toLowerCase()} challenges`,
            rootCauses: [
              'Organizational structure limitations',
              'Insufficient resource allocation',
              'Process and policy gaps'
            ],
            impact: `Enterprise-wide impact affecting ${categoryIssues.length} reported issues across ${[...new Set(categoryIssues.map(i => i.department))].length} departments`,
            recommendations: [
              'Develop comprehensive improvement strategy',
              'Implement cross-functional task force',
              'Establish metrics and monitoring',
              'Create change management plan'
            ],
            confidence: Math.floor(Math.random() * 15) + 85
          }
        })
      }
    });
    
    clusters.push(cluster);
    
    // Update issues with cluster assignment
    for (const issue of categoryIssues) {
      await prisma.issue.update({
        where: { id: issue.id },
        data: { clusterId: cluster.id }
      });
    }
  }
  
  console.log(`✅ Created ${clusters.length} issue clusters`);
  
  // Create Initiatives to address major issue clusters
  console.log('🎯 Creating initiatives to address feedback...');
  const initiatives = [];
  
  const initiativeTemplates = [
    {
      title: "Employee Experience Enhancement Program",
      description: "Comprehensive initiative to improve overall employee experience and satisfaction",
      status: "ACTIVE",
      priority: "HIGH",
      targetClusters: ["Workload Management", "Work Environment", "Management Support"]
    },
    {
      title: "Communication & Collaboration Transformation", 
      description: "Initiative to overhaul communication processes and enhance cross-departmental collaboration",
      status: "PLANNING",
      priority: "HIGH", 
      targetClusters: ["Communication"]
    },
    {
      title: "Technology Modernization Initiative",
      description: "Upgrade technology infrastructure and tools to improve productivity",
      status: "ACTIVE",
      priority: "MEDIUM",
      targetClusters: ["Technology", "Infrastructure"]
    },
    {
      title: "Process Optimization & Standardization",
      description: "Streamline and standardize business processes across all departments",
      status: "PLANNING", 
      priority: "MEDIUM",
      targetClusters: ["Process Improvement"]
    },
    {
      title: "Resource Allocation & Capacity Planning",
      description: "Strategic initiative to optimize resource allocation and improve capacity planning",
      status: "DRAFT",
      priority: "MEDIUM",
      targetClusters: ["Resource Allocation"]
    },
    {
      title: "Culture & Engagement Revitalization",
      description: "Initiative to strengthen company culture and improve employee engagement",
      status: "ACTIVE",
      priority: "HIGH",
      targetClusters: ["Culture", "Work Environment"]
    }
  ];
  
  for (const template of initiativeTemplates) {
    const relatedClusters = clusters.filter(cluster => 
      template.targetClusters.some(target => cluster.name.includes(target))
    );
    
    const totalIssues = relatedClusters.reduce((sum, cluster) => sum + cluster.issueCount, 0);
    const avgSeverity = relatedClusters.length > 0 
      ? Math.floor(relatedClusters.reduce((sum, cluster) => sum + cluster.avgSeverity, 0) / relatedClusters.length)
      : 50;
    
    // Create a user to be the owner (using existing admin or create temporary)
    const owner = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    }) || await prisma.user.create({
      data: {
        email: 'initiative.owner@company.com',
        passwordHash: await bcrypt.hash('TempPass123!', 10),
        role: 'ADMIN',
        name: 'Initiative Owner'
      }
    });

    const initiative = await prisma.initiative.create({
      data: {
        title: template.title,
        problem: `Employee feedback indicates critical issues in ${template.targetClusters.join(', ')} requiring immediate organizational attention`,
        goal: `Address and resolve ${template.targetClusters.join(', ')} concerns to improve employee satisfaction and organizational effectiveness`,
        kpis: [
          'Employee satisfaction score improvement',
          'Issue resolution rate',
          'Process efficiency metrics',
          'Employee retention rates'
        ],
        requirements: [
          'Cross-functional team coordination',
          'Budget allocation and approval',
          'Change management processes',
          'Regular progress monitoring'
        ],
        acceptanceCriteria: [
          'Achieve 20% improvement in relevant employee satisfaction metrics',
          'Reduce related issue reports by 50%',
          'Implement sustainable process improvements',
          'Maintain solution effectiveness for 6+ months'
        ],
        ownerId: owner.id,
        timelineStart: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Random past 30 days
        timelineEnd: new Date(Date.now() + Math.floor(Math.random() * 180 + 90) * 24 * 60 * 60 * 1000), // 90-270 days future
        status: template.status,
        progress: template.status === "ACTIVE" ? Math.floor(Math.random() * 40) + 20 : // 20-60%
                 template.status === "PLANNING" ? Math.floor(Math.random() * 20) + 5 : // 5-25%
                 0, // Draft
        budget: Math.floor(Math.random() * 500000) + 100000, // $100K - $600K
        type: 'Process Improvement',
        phase: template.status === "ACTIVE" ? 'execution' : 
               template.status === "PLANNING" ? 'planning' : 'draft'
      }
    });
    
    initiatives.push(initiative);
  }
  
  console.log(`✅ Created ${initiatives.length} initiatives`);
  
  // Create Solutions and Tasks for Active Initiatives
  console.log('🔧 Creating solutions and tasks...');
  
  for (const initiative of initiatives.filter(i => i.status === 'ACTIVE')) {
    // Create 2-4 solutions per active initiative
    const solutionCount = Math.floor(Math.random() * 3) + 2;
    
    for (let i = 0; i < solutionCount; i++) {
      const solutionTemplates = {
        "Employee Experience Enhancement Program": [
          { title: "Manager Training Program", description: "Comprehensive training for managers on leadership and employee support" },
          { title: "Workload Balancing System", description: "Implement tools and processes for better workload distribution" },
          { title: "Recognition & Feedback Platform", description: "Digital platform for peer recognition and continuous feedback" },
          { title: "Mental Health & Wellness Initiative", description: "Employee wellness programs and mental health support" }
        ],
        "Communication & Collaboration Transformation": [
          { title: "Digital Collaboration Platform", description: "Unified platform for team communication and project collaboration" },
          { title: "Cross-Department Meeting Optimization", description: "Restructure meeting processes for better efficiency" },
          { title: "Transparency Dashboard", description: "Company-wide dashboard for decision transparency" },
          { title: "Communication Skills Training", description: "Training programs to improve communication across all levels" }
        ],
        "Technology Modernization Initiative": [
          { title: "Legacy System Migration", description: "Migrate from outdated systems to modern platforms" },
          { title: "IT Support Optimization", description: "Improve IT support response times and processes" },
          { title: "Software Integration Project", description: "Integrate disconnected systems for better workflow" },
          { title: "Security Protocol Simplification", description: "Streamline security procedures while maintaining compliance" }
        ],
        "Culture & Engagement Revitalization": [
          { title: "Flexible Work Policy Implementation", description: "Develop and implement comprehensive flexible work arrangements" },
          { title: "Team Building & Culture Activities", description: "Regular activities to strengthen team bonds and culture" },
          { title: "Career Development Pathways", description: "Clear career progression paths and development opportunities" },
          { title: "Employee Voice Platform", description: "Regular forums for employee input and feedback" }
        ]
      };
      
      const templates = solutionTemplates[initiative.title] || [
        { title: `Solution ${i + 1}`, description: `Implementation approach ${i + 1} for ${initiative.title}` }
      ];
      
      const template = templates[i] || templates[0];
      
      const solutionType = ['TECHNOLOGY', 'PROCESS', 'TRAINING', 'POLICY'][Math.floor(Math.random() * 4)];
      const solutionStatus = ['DRAFT', 'PLANNED', 'IN_PROGRESS', 'COMPLETED'][Math.floor(Math.random() * 4)];
      
      const solution = await prisma.initiativeSolution.create({
        data: {
          initiativeId: initiative.id,
          title: template.title,
          description: template.description,
          type: solutionType,
          status: solutionStatus,
          priority: Math.floor(Math.random() * 5) + 1, // 1-5 priority
          estimatedHours: Math.floor(Math.random() * 200) + 50, // 50-250 hours
          actualHours: solutionStatus === 'COMPLETED' ? Math.floor(Math.random() * 100) + 20 : null, // 20-120 hours
          plannedStartDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
          plannedEndDate: new Date(Date.now() + Math.floor(Math.random() * 120 + 30) * 24 * 60 * 60 * 1000)
        }
      });
      
      // Create 3-6 tasks per solution
      const taskCount = Math.floor(Math.random() * 4) + 3;
      
      for (let j = 0; j < taskCount; j++) {
        const taskStatuses = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
        const taskStatus = taskStatuses[Math.floor(Math.random() * taskStatuses.length)];
        
        await prisma.solutionTask.create({
          data: {
            solutionId: solution.id,
            title: `${template.title} - Task ${j + 1}`,
            description: `Detailed task for implementing ${template.title}`,
            status: taskStatus,
            priority: Math.floor(Math.random() * 5) + 1, // 1-5 priority
            estimatedHours: Math.floor(Math.random() * 20) + 5, // 5-25 hours
            actualHours: taskStatus === 'COMPLETED' ? Math.floor(Math.random() * 15) + 5 : null,
            dueDate: new Date(Date.now() + Math.floor(Math.random() * 60 + 7) * 24 * 60 * 60 * 1000), // 7-67 days
            progress: taskStatus === 'COMPLETED' ? 100 : 
                     taskStatus === 'IN_PROGRESS' ? Math.floor(Math.random() * 80) + 10 : 0,
            completedAt: taskStatus === 'COMPLETED' ? new Date() : null
          }
        });
      }
    }
  }
  
  // Create some improvement ideas from remaining feedback
  console.log('💡 Creating improvement ideas...');
  const ideaDescriptions = [
    "Implement quarterly team satisfaction surveys with actionable follow-up",
    "Create cross-departmental mentorship programs",
    "Establish innovation time (20% time) for creative projects",
    "Develop internal knowledge sharing platform",
    "Implement results-only work environment (ROWE)",
    "Create employee-led committees for workplace improvements",
    "Establish peer recognition programs with meaningful rewards",
    "Develop skills-based volunteer opportunities during work hours"
  ];
  
  // Get the owner user for ideas
  const ideaAuthor = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  
  for (let i = 0; i < ideaDescriptions.length; i++) {
    await prisma.idea.create({
      data: {
        title: `Idea ${i + 1}: ${ideaDescriptions[i].split(' ').slice(0, 4).join(' ')}`,
        description: ideaDescriptions[i],
        authorId: ideaAuthor?.id || owner.id,
        category: ['general', 'process', 'technology', 'strategy'][Math.floor(Math.random() * 4)],
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        status: ['idea', 'reviewing', 'approved', 'implemented'][Math.floor(Math.random() * 4)],
        votes: Math.floor(Math.random() * 30) + 5,
        tags: generateKeywords(ISSUE_CATEGORIES[Math.floor(Math.random() * ISSUE_CATEGORIES.length)], ideaDescriptions[i]).slice(0, 4)
      }
    });
  }
  
  console.log('✅ Created improvement ideas');
  
  // Setup AI Configuration
  await setupAIConfiguration();
  
  console.log('🎉 Employee feedback seed data creation completed successfully!');
  console.log(`
📊 SEED DATA SUMMARY:
- Issues: ${issues.length} (from real employee feedback)
- Clusters: ${clusters.length} (categorized by issue type)  
- Initiatives: ${initiatives.length} (addressing major concerns)
- Solutions: Multiple per active initiative
- Tasks: 3-6 per solution with realistic statuses
- Ideas: ${ideaDescriptions.length} improvement suggestions

🎯 DATA INCLUDES:
- Real employee feedback covering workload, communication, management, environment
- Process issues including technology, procedures, and resource allocation
- Realistic department distribution and vote patterns
- AI analysis for high-impact issues and clusters
- Various initiative statuses (Draft, Planning, Active)
- Comprehensive solution breakdown with detailed tasks
  `);
}

async function setupAIConfiguration() {
  console.log('🤖 Setting up AI configuration...');
  
  // Get admin user for AI configuration updates
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!adminUser) {
    console.log('⚠️ No admin user found, skipping AI configuration');
    return;
  }
  
  // Create or update AI configurations using key-value structure
  const aiConfigs = [
    { key: 'openai_api_key', value: process.env.OPENAI_API_KEY || 'demo-key-for-development', description: 'OpenAI API Key' },
    { key: 'openai_model', value: 'gpt-3.5-turbo', description: 'OpenAI Model' },
    { key: 'max_tokens', value: 500, description: 'Maximum tokens per request' },
    { key: 'temperature', value: 0.7, description: 'AI creativity temperature' },
    { key: 'enabled', value: true, description: 'AI services enabled' }
  ];
  
  for (const config of aiConfigs) {
    await prisma.aIConfiguration.upsert({
      where: { key: config.key },
      update: {
        value: config.value,
        description: config.description,
        updatedBy: adminUser.id
      },
      create: {
        key: config.key,
        value: config.value,
        description: config.description,
        updatedBy: adminUser.id
      }
    });
  }
  
  console.log('✅ AI configuration setup completed');
}

async function main() {
  try {
    await createEmployeeFeedbackSeed();
  } catch (error) {
    console.error('❌ Error creating employee feedback seed data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { createEmployeeFeedbackSeed };
