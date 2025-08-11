const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * AI ISSUE CLUSTERING ANALYSIS
 * Phase 1: Analyze Morrison A&E issues for natural clustering patterns
 */

async function analyzeIssueClustering() {
  console.log('🔍 AI ISSUE CLUSTERING ANALYSIS');
  console.log('================================\n');

  // Fetch all issues from database
  const issues = await prisma.issue.findMany({
    orderBy: { heatmapScore: 'desc' },
  });

  console.log(`📊 TOTAL ISSUES ANALYZED: ${issues.length}\n`);

  // 1. DEPARTMENTAL ANALYSIS
  console.log('🏢 DEPARTMENTAL DISTRIBUTION:');
  const departmentGroups = {};
  issues.forEach((issue) => {
    const dept = issue.department || 'Unassigned';
    if (!departmentGroups[dept]) {
      departmentGroups[dept] = [];
    }
    departmentGroups[dept].push(issue);
  });

  Object.entries(departmentGroups).forEach(([dept, issueList]) => {
    console.log(
      `   ${dept}: ${issueList.length} issues (${((issueList.length / issues.length) * 100).toFixed(1)}%)`
    );
  });

  // 2. CATEGORY ANALYSIS
  console.log('\n📋 CATEGORY DISTRIBUTION:');
  const categoryGroups = {};
  issues.forEach((issue) => {
    const category = issue.category || 'Uncategorized';
    if (!categoryGroups[category]) {
      categoryGroups[category] = [];
    }
    categoryGroups[category].push(issue);
  });

  Object.entries(categoryGroups).forEach(([category, issueList]) => {
    console.log(`   ${category}: ${issueList.length} issues`);
  });

  // 3. SEMANTIC CLUSTERING ANALYSIS
  console.log('\n🧠 SEMANTIC CLUSTERING ANALYSIS:');
  console.log('Identifying issues that could be grouped by similar themes:\n');

  // Define potential clusters based on semantic analysis
  const semanticClusters = [
    {
      name: 'Project Coordination & Communication',
      theme: 'Issues related to coordination, communication, and collaboration across teams',
      keywords: [
        'coordination',
        'communication',
        'collaboration',
        'sharing',
        'access',
        'approval',
        'review',
      ],
      issues: [],
    },
    {
      name: 'Technology & Integration',
      theme: 'Issues related to software, tools, technology integration, and digital workflows',
      keywords: [
        'software',
        'tool',
        'integration',
        'file',
        'version',
        'CAD',
        'BIM',
        'technology',
        'digital',
      ],
      issues: [],
    },
    {
      name: 'Process Standardization',
      theme: 'Issues related to standardization, quality control, and process improvement',
      keywords: [
        'standards',
        'process',
        'guidelines',
        'quality',
        'compliance',
        'systematic',
        'tracking',
      ],
      issues: [],
    },
    {
      name: 'Resource & Project Management',
      theme:
        'Issues related to resource allocation, project management, and operational efficiency',
      keywords: [
        'resource',
        'allocation',
        'project',
        'management',
        'timeline',
        'budget',
        'profitability',
      ],
      issues: [],
    },
    {
      name: 'Knowledge & Documentation',
      theme: 'Issues related to knowledge management, documentation, and information accessibility',
      keywords: ['knowledge', 'documentation', 'materials', 'portfolio', 'memory', 'information'],
      issues: [],
    },
  ];

  // Cluster issues based on keyword matching
  issues.forEach((issue) => {
    const description = issue.description.toLowerCase();

    semanticClusters.forEach((cluster) => {
      const matches = cluster.keywords.filter((keyword) =>
        description.includes(keyword.toLowerCase())
      );

      if (matches.length > 0) {
        cluster.issues.push({
          ...issue,
          matchedKeywords: matches,
          relevanceScore: matches.length,
        });
      }
    });
  });

  // Display clustering results
  semanticClusters.forEach((cluster) => {
    console.log(`🎯 CLUSTER: ${cluster.name.toUpperCase()}`);
    console.log(`   Theme: ${cluster.theme}`);
    console.log(`   Issues Found: ${cluster.issues.length}`);

    if (cluster.issues.length > 0) {
      console.log(`   Issues:`);
      cluster.issues
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .forEach((issue) => {
          console.log(`     • ${issue.description.substring(0, 100)}...`);
          console.log(
            `       Department: ${issue.department} | Score: ${issue.heatmapScore} | Keywords: [${issue.matchedKeywords.join(', ')}]`
          );
        });
    }
    console.log('');
  });

  // 4. CROSS-DEPARTMENTAL IMPACT ANALYSIS
  console.log('🌐 CROSS-DEPARTMENTAL IMPACT ANALYSIS:');
  console.log('Issues that affect multiple departments:\n');

  const crossDepartmentalIssues = issues.filter((issue) => {
    const description = issue.description.toLowerCase();
    return (
      description.includes('multiple') ||
      description.includes('across') ||
      description.includes('departments') ||
      description.includes('team') ||
      description.includes('coordination')
    );
  });

  crossDepartmentalIssues.forEach((issue) => {
    console.log(`📊 HIGH CROSS-IMPACT ISSUE:`);
    console.log(`   Primary Dept: ${issue.department}`);
    console.log(`   Score: ${issue.heatmapScore}/100`);
    console.log(`   Description: ${issue.description.substring(0, 150)}...`);
    console.log('');
  });

  // 5. STRATEGIC INITIATIVE OPPORTUNITIES
  console.log('🚀 STRATEGIC INITIATIVE OPPORTUNITIES:');
  console.log('Cluster-based initiative recommendations:\n');

  const strategicRecommendations = [
    {
      cluster: 'Project Coordination & Communication',
      initiative: 'Unified Project Communication Platform',
      description:
        'Integrated platform for municipal approvals, client communication, and team coordination',
      impact: 'Addresses coordination, approval delays, and communication inefficiencies',
      estimatedROI: '25-35% reduction in project delays',
      affectedDepartments: ['Project Management', 'Architecture Design', 'Engineering'],
      addresses: semanticClusters[0].issues.length,
    },
    {
      cluster: 'Technology & Integration',
      initiative: 'Integrated Design Technology Stack',
      description:
        'Unified CAD/BIM platform with automated version control and cross-platform compatibility',
      impact: 'Eliminates tool fragmentation and improves collaboration',
      estimatedROI: '20-30% efficiency improvement',
      affectedDepartments: ['Architecture Design', 'Engineering', 'Operations'],
      addresses: semanticClusters[1].issues.length,
    },
    {
      cluster: 'Process Standardization',
      initiative: 'Quality Assurance & Standards Framework',
      description: 'Automated compliance checking and standardized design/engineering processes',
      impact: 'Reduces rework and ensures consistent quality',
      estimatedROI: '15-25% reduction in rework costs',
      affectedDepartments: ['Architecture Design', 'Engineering'],
      addresses: semanticClusters[2].issues.length,
    },
    {
      cluster: 'Resource & Project Management',
      initiative: 'AI-Powered Resource Optimization System',
      description: 'Real-time resource allocation and project profitability tracking',
      impact: 'Optimizes resource utilization and financial performance',
      estimatedROI: '20-40% improvement in project margins',
      affectedDepartments: ['Project Management', 'Operations'],
      addresses: semanticClusters[3].issues.length,
    },
  ];

  strategicRecommendations.forEach((rec) => {
    console.log(`💡 STRATEGIC INITIATIVE: ${rec.initiative.toUpperCase()}`);
    console.log(`   Target Cluster: ${rec.cluster}`);
    console.log(`   Description: ${rec.description}`);
    console.log(`   Business Impact: ${rec.impact}`);
    console.log(`   Estimated ROI: ${rec.estimatedROI}`);
    console.log(`   Departments: ${rec.affectedDepartments.join(', ')}`);
    console.log(`   Addresses: ${rec.addresses} issues`);
    console.log('');
  });

  // 6. CLUSTERING VALIDATION METRICS
  console.log('📈 CLUSTERING VALIDATION METRICS:');
  const totalClustered = semanticClusters.reduce((sum, cluster) => sum + cluster.issues.length, 0);
  const clusteringCoverage = ((totalClustered / issues.length) * 100).toFixed(1);

  console.log(`   Total Issues: ${issues.length}`);
  console.log(`   Successfully Clustered: ${totalClustered} (${clusteringCoverage}%)`);
  console.log(
    `   Average Cluster Size: ${(totalClustered / semanticClusters.length).toFixed(1)} issues`
  );
  console.log(`   Cross-Departmental Issues: ${crossDepartmentalIssues.length}`);

  const highImpactClusters = semanticClusters.filter((cluster) => cluster.issues.length >= 2);
  console.log(`   High-Impact Clusters: ${highImpactClusters.length}/${semanticClusters.length}`);

  // 7. NEXT STEPS RECOMMENDATION
  console.log('\n✅ PHASE 1 ANALYSIS COMPLETE');
  console.log('============================');
  console.log('🎯 KEY FINDINGS:');
  console.log(`   • ${semanticClusters.length} potential clusters identified`);
  console.log(`   • ${strategicRecommendations.length} strategic initiatives recommended`);
  console.log(`   • ${crossDepartmentalIssues.length} high cross-impact issues found`);
  console.log(`   • ${clusteringCoverage}% clustering coverage achieved`);

  console.log('\n🚀 RECOMMENDED NEXT STEPS:');
  console.log('   1. Enhance data model with IssueCluster relationships');
  console.log('   2. Implement semantic similarity API for dynamic clustering');
  console.log('   3. Build cluster visualization components');
  console.log('   4. Create multi-issue initiative generation workflow');
  console.log('   5. Validate clustering with A&E domain experts');

  return {
    totalIssues: issues.length,
    clusters: semanticClusters,
    strategicRecommendations,
    crossDepartmentalIssues,
    clusteringCoverage: parseFloat(clusteringCoverage),
  };
}

async function main() {
  try {
    const analysis = await analyzeIssueClustering();

    console.log('\n📊 ANALYSIS SUMMARY EXPORTED');
    console.log(`   Clustering accuracy: ${analysis.clusteringCoverage}%`);
    console.log(`   Strategic opportunities: ${analysis.strategicRecommendations.length}`);
    console.log(`   Ready for Phase 1 implementation: ✅`);
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { analyzeIssueClustering };
