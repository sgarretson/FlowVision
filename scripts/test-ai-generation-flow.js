const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAIGenerationFlow() {
  console.log('🔬 Testing AI generation flow with new configuration...\n');

  try {
    // Step 1: Get current operation defaults
    console.log('📋 Step 1: Getting current AI operation configuration...');
    const aiConfig = await prisma.systemConfiguration.findFirst({
      where: {
        category: 'ai',
        key: 'operation_defaults',
      },
    });

    if (!aiConfig) {
      console.log('❌ No AI operation defaults found');
      return;
    }

    const issueAnalysisConfig = aiConfig.value.issue_analysis;
    console.log('✅ Current issue_analysis configuration:');
    console.log(`   Model: ${issueAnalysisConfig.model}`);
    console.log(`   Max Tokens: ${issueAnalysisConfig.maxTokens}`);
    console.log(`   Temperature: ${issueAnalysisConfig.temperature}`);

    // Step 2: Simulate what the OpenAI service would do
    console.log('\n🤖 Step 2: Simulating OpenAI service behavior...');

    // This is what lib/openai.ts does in getOperationConfig
    const operationConfig = issueAnalysisConfig;
    console.log('✅ OpenAI service would use:');
    console.log(`   Model: ${operationConfig.model}`);
    console.log(`   Max Tokens: ${operationConfig.maxTokens}`);
    console.log(`   Temperature: ${operationConfig.temperature}`);

    // Step 3: Simulate updating an issue with AI analysis
    console.log('\n📝 Step 3: Simulating issue AI analysis update...');

    // Get a sample issue
    const sampleIssue = await prisma.issue.findFirst({
      where: {
        description: { not: '' },
      },
    });

    if (!sampleIssue) {
      console.log('❌ No sample issue found');
      return;
    }

    console.log(`✅ Found sample issue: ${sampleIssue.id.substring(0, 8)}...`);
    console.log(`   Description: ${sampleIssue.description.substring(0, 50)}...`);

    // Simulate what the AI analysis API would save
    const mockAIAnalysis = {
      aiVersion: operationConfig.model, // This should now be gpt-4-turbo
      aiGeneratedAt: new Date(),
      aiSummary: `Test AI analysis using ${operationConfig.model}`,
      aiConfidence: 85,
      aiAnalysisDetails: {
        model: operationConfig.model,
        maxTokens: operationConfig.maxTokens,
        temperature: operationConfig.temperature,
        reasoning: 'This is a test analysis to verify model configuration',
      },
    };

    // Update the issue
    await prisma.issue.update({
      where: { id: sampleIssue.id },
      data: mockAIAnalysis,
    });

    console.log('✅ Updated issue with AI analysis');
    console.log(`   AI Version: ${mockAIAnalysis.aiVersion}`);
    console.log(`   Analysis Model: ${mockAIAnalysis.aiAnalysisDetails.model}`);

    // Step 4: Verify the updated issue
    console.log('\n🔍 Step 4: Verifying updated issue...');

    const updatedIssue = await prisma.issue.findUnique({
      where: { id: sampleIssue.id },
      select: {
        id: true,
        aiVersion: true,
        aiAnalysisDetails: true,
        aiConfidence: true,
      },
    });

    console.log('✅ Issue verification:');
    console.log(`   AI Version: ${updatedIssue.aiVersion}`);
    console.log(`   Analysis Model: ${updatedIssue.aiAnalysisDetails?.model}`);
    console.log(`   Confidence: ${updatedIssue.aiConfidence}%`);

    // Step 5: Test what the frontend would display
    console.log('\n🖥️ Step 5: Testing frontend display...');

    const frontendData = {
      aiVersion: updatedIssue.aiVersion,
      modelFromAnalysis: updatedIssue.aiAnalysisDetails?.model,
      confidence: updatedIssue.aiConfidence,
    };

    console.log('✅ Frontend would display:');
    console.log(`   Model: ${frontendData.modelFromAnalysis || frontendData.aiVersion}`);
    console.log(`   Confidence: ${frontendData.confidence}%`);

    if (frontendData.modelFromAnalysis === 'gpt-4-turbo') {
      console.log('\n🎉 SUCCESS: Frontend would now display "gpt-4-turbo"!');
    } else {
      console.log('\n⚠️  WARNING: Frontend would still display old model');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAIGenerationFlow();
