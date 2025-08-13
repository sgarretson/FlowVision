const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAIOptimization() {
  console.log('🧪 Testing AI Optimization Implementation...\n');

  try {
    // Test 1: Check database schema
    console.log('1. Testing database schema...');

    const usageLogCount = await prisma.aIUsageLog.count();
    console.log(`   ✅ AIUsageLog table exists (${usageLogCount} records)`);

    const quotaCount = await prisma.aIUserQuota.count();
    console.log(`   ✅ AIUserQuota table exists (${quotaCount} records)`);

    const cacheCount = await prisma.aICacheEntry.count();
    console.log(`   ✅ AICacheEntry table exists (${cacheCount} records)`);

    // Test 2: Create sample usage log
    console.log('\n2. Testing usage tracking...');

    const testUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (testUser) {
      const usageLog = await prisma.aIUsageLog.create({
        data: {
          requestId: `test-${Date.now()}`,
          userId: testUser.id,
          operation: 'test_optimization',
          inputTokens: 150,
          outputTokens: 75,
          totalTokens: 225,
          cost: 0.045,
          latency: 1200,
          cacheHit: false,
          modelUsed: 'gpt-3.5-turbo',
          quality: 95,
          metadata: {
            test: true,
            optimization: 'enabled',
          },
        },
      });
      console.log(`   ✅ Created test usage log: ${usageLog.id}`);

      // Test 3: Create or update user quota
      console.log('\n3. Testing quota management...');

      const quota = await prisma.aIUserQuota.upsert({
        where: { userId: testUser.id },
        update: {
          dailyUsedTokens: { increment: 225 },
          dailyCost: { increment: 0.045 },
        },
        create: {
          userId: testUser.id,
          tier: 'enterprise',
          dailyUsedTokens: 225,
          dailyCost: 0.045,
        },
      });
      console.log(`   ✅ Updated quota for user ${testUser.name} (${quota.tier} tier)`);
      console.log(`   📊 Daily usage: ${quota.dailyUsedTokens}/${quota.dailyTokenLimit} tokens`);
      console.log(`   💰 Daily cost: $${quota.dailyCost.toFixed(3)}`);
    }

    // Test 4: Performance metrics
    console.log('\n4. Testing performance analytics...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyUsage = await prisma.aIUsageLog.findMany({
      where: {
        timestamp: { gte: today },
      },
    });

    if (dailyUsage.length > 0) {
      const totalTokens = dailyUsage.reduce((sum, log) => sum + log.totalTokens, 0);
      const totalCost = dailyUsage.reduce((sum, log) => sum + log.cost, 0);
      const avgLatency = dailyUsage.reduce((sum, log) => sum + log.latency, 0) / dailyUsage.length;
      const avgQuality = dailyUsage.reduce((sum, log) => sum + log.quality, 0) / dailyUsage.length;
      const cacheHitRate = dailyUsage.filter((log) => log.cacheHit).length / dailyUsage.length;

      console.log(`   📈 Today's Performance Metrics:`);
      console.log(`   • Total Requests: ${dailyUsage.length}`);
      console.log(`   • Total Tokens: ${totalTokens.toLocaleString()}`);
      console.log(`   • Total Cost: $${totalCost.toFixed(3)}`);
      console.log(`   • Avg Latency: ${Math.round(avgLatency)}ms`);
      console.log(`   • Avg Quality: ${Math.round(avgQuality)}/100`);
      console.log(`   • Cache Hit Rate: ${(cacheHitRate * 100).toFixed(1)}%`);
    } else {
      console.log(`   📊 No usage data for today yet`);
    }

    // Test 5: Test cache entry
    console.log('\n5. Testing cache functionality...');

    const cacheEntry = await prisma.aICacheEntry.create({
      data: {
        cacheKey: `test-cache-${Date.now()}`,
        operation: 'issue_summary',
        prompt: 'Test prompt for caching',
        response: {
          summary: 'Test AI response for optimization testing',
          confidence: 95,
          test: true,
        },
        quality: 95,
        modelUsed: 'gpt-3.5-turbo',
        tokenCount: 150,
        cost: 0.03,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      },
    });
    console.log(`   ✅ Created test cache entry: ${cacheEntry.id}`);
    console.log(`   💾 Cache expires at: ${cacheEntry.expiresAt.toLocaleTimeString()}`);

    console.log('\n🎉 AI Optimization Implementation Test Complete!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Set ENABLE_OPTIMIZED_AI=true in .env.local to enable optimization');
    console.log('   2. Set OPTIMIZED_AI_ROLLOUT=10 for 10% gradual rollout');
    console.log('   3. Visit /admin to see AI Optimization Dashboard');
    console.log('   4. Test AI features with optimization enabled');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAIOptimization();
