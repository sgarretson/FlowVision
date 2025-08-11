#!/usr/bin/env node

/**
 * Populate Cluster Associations
 * Creates associations between existing issues and clusters
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function populateAssociations() {
  console.log('🔗 Populating cluster-issue associations...\n');

  try {
    // Get all issues and clusters
    const issues = await prisma.issue.findMany();
    const clusters = await prisma.issueCluster.findMany();

    console.log(`Found ${issues.length} issues and ${clusters.length} clusters`);

    if (clusters.length === 0) {
      console.log('❌ No clusters found. Please run clustering first.');
      return;
    }

    // Simple association logic based on department and category
    const departmentClusterMap = {
      'Project Management': 'Project Coordination & Communication',
      'Architecture Design': 'Design Coordination & Standards',
      'Engineering': 'Technical Integration & MEP',
      'Operations': 'Operational Efficiency',
      'Business Development': 'Client Management & Growth'
    };

    let associationsCreated = 0;

    for (const issue of issues) {
      // Skip if already clustered
      if (issue.clusterId) continue;

      // Find appropriate cluster based on department or randomly distribute
      let targetCluster = null;
      
      // Try department mapping first
      const targetClusterName = departmentClusterMap[issue.department];
      if (targetClusterName) {
        targetCluster = clusters.find(c => c.name.includes(targetClusterName.split(' ')[0]));
      }
      
      // If no match, try category matching
      if (!targetCluster && issue.department) {
        targetCluster = clusters.find(c => 
          c.category.toLowerCase().includes(issue.department.toLowerCase()) ||
          c.name.toLowerCase().includes(issue.department.toLowerCase())
        );
      }
      
      // If still no match, distribute round-robin
      if (!targetCluster) {
        targetCluster = clusters[associationsCreated % clusters.length];
      }

      if (targetCluster) {
        await prisma.issue.update({
          where: { id: issue.id },
          data: { clusterId: targetCluster.id }
        });
        
        console.log(`   ✅ Associated issue "${issue.description.substring(0, 50)}..." with cluster "${targetCluster.name}"`);
        associationsCreated++;
      }
    }

    console.log(`\n🎯 Created ${associationsCreated} issue-cluster associations`);

    // Now create initiative-issue associations
    console.log('\n🔗 Creating initiative-issue associations...\n');

    const initiatives = await prisma.initiative.findMany({
      include: { cluster: true }
    });

    let initiativeAssociationsCreated = 0;

    for (const initiative of initiatives) {
      // Find issues in the same cluster
      let eligibleIssues = [];
      
      if (initiative.cluster) {
        eligibleIssues = await prisma.issue.findMany({
          where: { clusterId: initiative.cluster.id },
          take: 3 // Associate with up to 3 issues per initiative
        });
      } else {
        // If no cluster, just pick some issues to associate
        eligibleIssues = await prisma.issue.findMany({
          where: { clusterId: { not: null } },
          take: 2,
          skip: Math.floor(Math.random() * 5) // Random selection
        });
      }

      if (eligibleIssues.length > 0) {
        // Connect issues to initiative
        await prisma.initiative.update({
          where: { id: initiative.id },
          data: {
            addressedIssues: {
              connect: eligibleIssues.map(issue => ({ id: issue.id }))
            }
          }
        });

        console.log(`   ✅ Associated initiative "${initiative.title}" with ${eligibleIssues.length} issues`);
        initiativeAssociationsCreated++;
      }
    }

    console.log(`\n🎯 Created associations for ${initiativeAssociationsCreated} initiatives`);

    // Summary
    console.log('\n📊 Final Summary:');
    const clusteredIssues = await prisma.issue.count({
      where: { clusterId: { not: null } }
    });
    
    const initiativesWithIssues = await prisma.initiative.count({
      where: {
        addressedIssues: { some: {} }
      }
    });

    console.log(`   • ${clusteredIssues}/${issues.length} issues are now clustered`);
    console.log(`   • ${initiativesWithIssues}/${initiatives.length} initiatives have issue associations`);
    console.log('   • Cluster details modal will now show comprehensive information');

  } catch (error) {
    console.error('❌ Failed to populate associations:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
populateAssociations().catch(console.error);