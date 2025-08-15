const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAIConfig() {
  console.log('🔍 Checking current AI configuration...\n');

  try {
    // Check AIConfiguration table
    const aiConfig = await prisma.aIConfiguration.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    console.log('📊 AIConfiguration table:');
    if (aiConfig) {
      console.log('  ✅ Found configuration:');
      console.log(`     ID: ${aiConfig.id}`);
      console.log(`     Model: ${aiConfig.model}`);
      console.log(`     Max Tokens: ${aiConfig.maxTokens}`);
      console.log(`     Temperature: ${aiConfig.temperature}`);
      console.log(`     Enabled: ${aiConfig.enabled}`);
      console.log(`     Updated: ${aiConfig.updatedAt}`);
    } else {
      console.log('  ❌ No AI configuration found');
    }

    console.log('\n🔧 SystemConfiguration AI settings:');

    // Check system configurations for AI
    const aiSystemConfigs = await prisma.systemConfiguration.findMany({
      where: {
        category: 'ai',
        isActive: true,
      },
      orderBy: { key: 'asc' },
    });

    if (aiSystemConfigs.length > 0) {
      aiSystemConfigs.forEach((config) => {
        console.log(`  📋 ${config.key}:`);
        if (config.key === 'operation_defaults') {
          console.log(`     Value (operation defaults):`, JSON.stringify(config.value, null, 4));
        } else {
          console.log(`     Value:`, JSON.stringify(config.value, null, 2));
        }
      });
    } else {
      console.log('  ❌ No system AI configurations found');
    }

    console.log('\n🎯 Recent issue AI analysis data:');

    // Check recent issues with AI analysis
    const recentIssues = await prisma.issue.findMany({
      where: {
        aiVersion: { not: null },
      },
      select: {
        id: true,
        aiVersion: true,
        aiConfidence: true,
        aiGeneratedAt: true,
        aiAnalysisDetails: true,
      },
      orderBy: { aiGeneratedAt: 'desc' },
      take: 3,
    });

    if (recentIssues.length > 0) {
      recentIssues.forEach((issue, index) => {
        console.log(`  📝 Issue ${index + 1} (${issue.id.substring(0, 8)}...):`);
        console.log(`     AI Version: ${issue.aiVersion}`);
        console.log(`     Confidence: ${issue.aiConfidence}%`);
        console.log(`     Generated: ${issue.aiGeneratedAt}`);
        if (issue.aiAnalysisDetails) {
          console.log(`     Analysis Model: ${issue.aiAnalysisDetails.model || 'Not specified'}`);
        }
      });
    } else {
      console.log('  📝 No issues with AI analysis found');
    }
  } catch (error) {
    console.error('❌ Error checking AI configuration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAIConfig();
