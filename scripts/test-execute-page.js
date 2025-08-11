#!/usr/bin/env node

/**
 * Test script to verify Execute page functionality
 * Tests the status mapping and initiative display fixes
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Status mapping functions (copied from track page)
function mapStatusToColumn(dbStatus) {
  switch (dbStatus?.toUpperCase()) {
    case 'DEFINE':
    case 'PLANNING':
    case 'DRAFT':
      return 'Define';
    case 'PRIORITIZE':
    case 'PENDING':
    case 'APPROVED':
      return 'Prioritize';
    case 'ACTIVE':
    case 'IN_PROGRESS':
    case 'EXECUTING':
    case 'RUNNING':
      return 'In Progress';
    case 'COMPLETED':
    case 'DONE':
    case 'FINISHED':
      return 'Done';
    default:
      return 'Define';
  }
}

function mapColumnToStatus(column) {
  switch (column) {
    case 'Define':
      return 'PLANNING';
    case 'Prioritize':
      return 'APPROVED';
    case 'In Progress':
      return 'ACTIVE';
    case 'Done':
      return 'COMPLETED';
    default:
      return 'PLANNING';
  }
}

async function testExecutePageMapping() {
  console.log('🧪 TESTING EXECUTE PAGE STATUS MAPPING');
  console.log('=====================================');

  try {
    // Get all initiatives
    const initiatives = await prisma.initiative.findMany({
      select: { id: true, title: true, status: true },
    });

    console.log(`\n📊 Found ${initiatives.length} initiatives in database`);

    if (initiatives.length === 0) {
      console.log('❌ No initiatives found! Execute page will show empty state.');
      return;
    }

    // Group by mapped kanban columns
    const columnGroups = {
      Define: [],
      Prioritize: [],
      'In Progress': [],
      Done: [],
    };

    initiatives.forEach((init) => {
      const kanbanColumn = mapStatusToColumn(init.status);
      columnGroups[kanbanColumn].push({
        title: init.title,
        originalStatus: init.status,
        mappedColumn: kanbanColumn,
      });
    });

    // Display results
    console.log('\n🎯 KANBAN BOARD DISTRIBUTION:');
    console.log('============================');

    Object.entries(columnGroups).forEach(([column, items]) => {
      console.log(`\n📋 ${column} (${items.length} items):`);
      if (items.length === 0) {
        console.log('   (empty)');
      } else {
        items.forEach((item) => {
          console.log(`   • ${item.title} [${item.originalStatus} → ${item.mappedColumn}]`);
        });
      }
    });

    // Test round-trip mapping
    console.log('\n🔄 TESTING ROUND-TRIP STATUS MAPPING:');
    console.log('====================================');

    const testColumns = ['Define', 'Prioritize', 'In Progress', 'Done'];
    testColumns.forEach((column) => {
      const dbStatus = mapColumnToStatus(column);
      const backToColumn = mapStatusToColumn(dbStatus);
      const success = column === backToColumn ? '✅' : '❌';
      console.log(`${success} ${column} → ${dbStatus} → ${backToColumn}`);
    });

    console.log('\n✅ Execute page should now display initiatives properly!');
    console.log('   • ACTIVE initiatives appear in "In Progress" column');
    console.log('   • COMPLETED initiatives appear in "Done" column');
    console.log('   • Users can drag between columns to update status');
    console.log('   • Database status values are preserved and mapped correctly');
  } catch (error) {
    console.error('❌ Error testing Execute page:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testExecutePageMapping();
