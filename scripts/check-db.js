const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Checking database contents...');

  try {
    const users = await prisma.user.count();
    const issues = await prisma.issue.count();
    const clusters = await prisma.issueCluster.count();
    const initiatives = await prisma.initiative.count();
    const solutions = await prisma.initiativeSolution.count();
    const tasks = await prisma.solutionTask.count();
    const ideas = await prisma.idea.count();

    console.log('📊 Database counts:');
    console.log(`  Users: ${users}`);
    console.log(`  Issues: ${issues}`);
    console.log(`  Clusters: ${clusters}`);
    console.log(`  Initiatives: ${initiatives}`);
    console.log(`  Solutions: ${solutions}`);
    console.log(`  Tasks: ${tasks}`);
    console.log(`  Ideas: ${ideas}`);

    if (initiatives > 0) {
      const initiativeDetails = await prisma.initiative.findMany({
        select: {
          id: true,
          title: true,
          status: true,
          ownerId: true,
          solutions: {
            select: {
              id: true,
              title: true,
              status: true,
              tasks: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      console.log('\n🎯 Initiative details:');
      initiativeDetails.forEach((init, i) => {
        console.log(`  ${i + 1}. ${init.title}`);
        console.log(`     Status: ${init.status}, Owner: ${init.ownerId}`);
        console.log(`     Solutions: ${init.solutions.length}`);
        init.solutions.forEach((sol, j) => {
          console.log(`       ${j + 1}. ${sol.title} (${sol.status})`);
          console.log(`          Tasks: ${sol.tasks.length}`);
        });
      });
    }
  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
