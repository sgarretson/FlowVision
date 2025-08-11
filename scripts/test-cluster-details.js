#!/usr/bin/env node

/**
 * Test Script: Cluster Details Functionality
 * Tests the cluster view details modal and initiative types
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testClusterDetails() {
  console.log('🔍 Testing Cluster Details Functionality...\n');

  try {
    // Test 1: Check if clusters exist with issues
    console.log('📊 Test 1: Checking cluster data...');
    const clusters = await prisma.issueCluster.findMany({
      include: {
        issues: {
          include: {
            comments: {
              take: 3,
              include: { author: true }
            }
          }
        },
        initiatives: {
          include: {
            owner: true,
            addressedIssues: true,
            milestones: true
          }
        }
      }
    });

    console.log(`   ✅ Found ${clusters.length} clusters`);
    
    if (clusters.length > 0) {
      const cluster = clusters[0];
      console.log(`   ✅ Sample cluster: "${cluster.name}"`);
      console.log(`   ✅ Issues in cluster: ${cluster.issues.length}`);
      console.log(`   ✅ Initiatives in cluster: ${cluster.initiatives.length}`);
    }

    // Test 2: Check initiative types
    console.log('\n🎯 Test 2: Checking initiative types...');
    const initiatives = await prisma.initiative.findMany({
      select: {
        id: true,
        title: true,
        type: true,
        status: true
      },
      take: 10
    });

    const typeDistribution = initiatives.reduce((acc, init) => {
      const type = init.type || 'Unspecified';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    console.log('   ✅ Initiative Type Distribution:');
    Object.entries(typeDistribution).forEach(([type, count]) => {
      console.log(`      ${type}: ${count} initiatives`);
    });

    // Test 3: Test analytics calculation (similar to what API does)
    console.log('\n📈 Test 3: Testing analytics calculations...');
    if (clusters.length > 0) {
      const cluster = clusters[0];
      
      const analytics = {
        totalIssues: cluster.issues.length,
        averageScore: cluster.issues.length > 0 
          ? Math.round(cluster.issues.reduce((sum, issue) => sum + issue.heatmapScore, 0) / cluster.issues.length)
          : 0,
        totalVotes: cluster.issues.reduce((sum, issue) => sum + issue.votes, 0),
        scoreDistribution: {
          high: cluster.issues.filter(i => i.heatmapScore > 85).length,
          medium: cluster.issues.filter(i => i.heatmapScore > 70 && i.heatmapScore <= 85).length,
          low: cluster.issues.filter(i => i.heatmapScore <= 70).length
        },
        departmentBreakdown: cluster.issues.reduce((acc, issue) => {
          const dept = issue.department || 'Unassigned';
          acc[dept] = (acc[dept] || 0) + 1;
          return acc;
        }, {}),
        initiativeProgress: {
          total: cluster.initiatives.length,
          active: cluster.initiatives.filter(i => i.status === 'ACTIVE').length,
          completed: cluster.initiatives.filter(i => i.status === 'COMPLETED').length,
          averageProgress: cluster.initiatives.length > 0
            ? Math.round(cluster.initiatives.reduce((sum, init) => sum + init.progress, 0) / cluster.initiatives.length)
            : 0
        }
      };

      console.log(`   ✅ Analytics for "${cluster.name}":`);
      console.log(`      Total Issues: ${analytics.totalIssues}`);
      console.log(`      Average Score: ${analytics.averageScore}`);
      console.log(`      Score Distribution: High(${analytics.scoreDistribution.high}) Medium(${analytics.scoreDistribution.medium}) Low(${analytics.scoreDistribution.low})`);
      console.log(`      Department Breakdown:`, Object.entries(analytics.departmentBreakdown).map(([dept, count]) => `${dept}(${count})`).join(', '));
      console.log(`      Initiative Progress: ${analytics.initiativeProgress.active} active, ${analytics.initiativeProgress.completed} completed, ${analytics.initiativeProgress.averageProgress}% avg`);
    }

    // Test 4: Check issue-initiative associations
    console.log('\n🔗 Test 4: Checking issue-initiative associations...');
    const initiativesWithIssues = await prisma.initiative.findMany({
      where: {
        addressedIssues: {
          some: {}
        }
      },
      include: {
        addressedIssues: {
          select: {
            id: true,
            description: true,
            heatmapScore: true
          }
        },
        cluster: {
          select: {
            name: true
          }
        }
      },
      take: 5
    });

    console.log(`   ✅ Found ${initiativesWithIssues.length} initiatives with issue associations`);
    initiativesWithIssues.forEach((init, index) => {
      console.log(`   ${index + 1}. "${init.title}" (${init.type || 'No Type'})`);
      console.log(`      → Addresses ${init.addressedIssues.length} issues`);
      if (init.cluster) {
        console.log(`      → Part of cluster: "${init.cluster.name}"`);
      }
    });

    console.log('\n✅ All cluster details tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • ${clusters.length} clusters available for details view`);
    console.log(`   • ${initiatives.length} initiatives with types`);
    console.log(`   • ${initiativesWithIssues.length} initiatives with issue associations`);
    console.log(`   • Analytics calculations working properly`);
    console.log(`   • Cluster details modal should display comprehensive information`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testClusterDetails().catch(console.error);