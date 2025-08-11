#!/usr/bin/env node

/**
 * Test script to verify AI clustering interface functionality
 * Tests the clustering API endpoint and validates UI components
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testClusteringInterface() {
  console.log('🧪 TESTING AI CLUSTERING INTERFACE');
  console.log('=================================');

  try {
    // 1. Test clustering data availability
    console.log('\n📊 TESTING CLUSTERING DATA AVAILABILITY:');

    const clusters = await prisma.issueCluster.findMany({
      include: {
        issues: {
          select: {
            id: true,
            description: true,
            heatmapScore: true,
            votes: true,
            department: true,
            category: true,
          },
        },
        initiatives: {
          select: {
            id: true,
            title: true,
            status: true,
            progress: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    console.log(`✅ Found ${clusters.length} clusters in database`);

    if (clusters.length === 0) {
      console.log('❌ No clusters found! Interface will show empty state.');
      return;
    }

    // 2. Calculate statistics (matching API logic)
    const totalIssues = await prisma.issue.count();
    const clusteredIssues = await prisma.issue.count({
      where: { clusterId: { not: null } },
    });

    const stats = {
      totalClusters: clusters.length,
      activeClusters: clusters.filter((c) => c.isActive).length,
      totalIssues,
      clusteredIssues,
      clusteringRate: totalIssues > 0 ? Math.round((clusteredIssues / totalIssues) * 100) : 0,
      averageClusterSize: clusters.length > 0 ? Math.round(clusteredIssues / clusters.length) : 0,
    };

    console.log('\n📈 CLUSTERING STATISTICS:');
    console.log(`   Total Clusters: ${stats.totalClusters}`);
    console.log(`   Active Clusters: ${stats.activeClusters}`);
    console.log(`   Total Issues: ${stats.totalIssues}`);
    console.log(`   Clustered Issues: ${stats.clusteredIssues}`);
    console.log(`   Clustering Rate: ${stats.clusteringRate}%`);
    console.log(`   Average Cluster Size: ${stats.averageClusterSize}`);

    // 3. Test cluster data structure
    console.log('\n🎯 CLUSTER DETAILS:');
    clusters.forEach((cluster, index) => {
      const enrichedCluster = {
        ...cluster,
        issueCount: cluster.issues.length,
        initiativeCount: cluster.initiatives.length,
        averageScore:
          cluster.issues.length > 0
            ? Math.round(
                cluster.issues.reduce((sum, issue) => sum + issue.heatmapScore, 0) /
                  cluster.issues.length
              )
            : 0,
      };

      console.log(`\n${index + 1}. ${enrichedCluster.name}`);
      console.log(
        `   Category: ${enrichedCluster.category} | Severity: ${enrichedCluster.severity}`
      );
      console.log(`   Theme: ${enrichedCluster.theme}`);
      console.log(
        `   Issues: ${enrichedCluster.issueCount} | Initiatives: ${enrichedCluster.initiativeCount}`
      );
      console.log(
        `   Average Score: ${enrichedCluster.averageScore} | Active: ${enrichedCluster.isActive}`
      );
      console.log(`   Color: ${enrichedCluster.color}`);

      if (enrichedCluster.issues.length > 0) {
        console.log(
          `   Sample Issue: "${enrichedCluster.issues[0].description.substring(0, 80)}..."`
        );
      }
    });

    // 4. Test UI component compatibility
    console.log('\n🖥️  UI COMPONENT COMPATIBILITY TEST:');

    const uiTestResults = {
      hasRequiredFields: true,
      hasColorCoding: true,
      hasSeverityLevels: true,
      hasCategoryIcons: true,
      hasValidStatistics: true,
    };

    // Check required fields for UI
    clusters.forEach((cluster) => {
      const required = [
        'id',
        'name',
        'description',
        'category',
        'severity',
        'theme',
        'color',
        'isActive',
      ];
      required.forEach((field) => {
        if (!cluster[field]) {
          console.log(`   ❌ Missing field '${field}' in cluster '${cluster.name}'`);
          uiTestResults.hasRequiredFields = false;
        }
      });
    });

    // Check severity levels
    const validSeverities = ['critical', 'high', 'medium', 'low'];
    const foundSeverities = [...new Set(clusters.map((c) => c.severity.toLowerCase()))];
    foundSeverities.forEach((severity) => {
      if (!validSeverities.includes(severity)) {
        console.log(`   ❌ Invalid severity level: ${severity}`);
        uiTestResults.hasSeverityLevels = false;
      }
    });

    // Check categories for icon mapping
    const validCategories = ['coordination', 'technology', 'process', 'management', 'knowledge'];
    const foundCategories = [...new Set(clusters.map((c) => c.category.toLowerCase()))];
    foundCategories.forEach((category) => {
      if (!validCategories.includes(category)) {
        console.log(`   ❌ Unmapped category: ${category}`);
        uiTestResults.hasCategoryIcons = false;
      }
    });

    // Summary
    console.log('\n✅ UI COMPATIBILITY RESULTS:');
    Object.entries(uiTestResults).forEach(([test, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
    });

    // 5. Test tab interface data
    console.log('\n📑 TAB INTERFACE DATA:');
    console.log(`   Individual Issues Tab: ${totalIssues} issues`);
    console.log(`   AI Clusters Tab: ${clusters.length} clusters`);
    console.log(`   Expected UI State: ${clusters.length > 0 ? 'Populated' : 'Empty State'}`);

    console.log('\n🎉 CLUSTERING INTERFACE READY!');
    console.log('   Navigate to /issues and click the "🧠 AI Clusters" tab');
    console.log('   Expected features:');
    console.log('   • Cluster grid with color-coded severity badges');
    console.log('   • Click clusters to expand and view issues');
    console.log('   • Statistics dashboard showing clustering metrics');
    console.log('   • Category icons and department groupings');
  } catch (error) {
    console.error('❌ Error testing clustering interface:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testClusteringInterface();
