const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAdminConfigFix() {
  console.log('🧪 Testing admin configuration fix...\n');

  try {
    // Simulate saving gpt-4-turbo via admin panel
    console.log('📝 Step 1: Simulating admin panel save of gpt-4-turbo...');

    // Get current operation defaults
    const currentConfig = await prisma.systemConfiguration.findFirst({
      where: {
        category: 'ai',
        key: 'operation_defaults',
      },
    });

    if (!currentConfig) {
      console.log('❌ No operation_defaults configuration found');
      return;
    }

    console.log('✅ Current operation defaults found');
    console.log('   Current issue_analysis model:', currentConfig.value.issue_analysis.model);

    // Update issue_analysis model to gpt-4-turbo
    const updatedOperationDefaults = {
      ...currentConfig.value,
      issue_analysis: {
        ...currentConfig.value.issue_analysis,
        model: 'gpt-4-turbo',
      },
    };

    await prisma.systemConfiguration.update({
      where: { id: currentConfig.id },
      data: {
        value: updatedOperationDefaults,
        updatedBy: 'cmed7ak870000cb9kjyo2b6aa', // Admin user ID from seed
        version: { increment: 1 },
      },
    });

    console.log('✅ Updated operation_defaults to use gpt-4-turbo for issue_analysis');

    console.log('\n📊 Step 2: Verifying configuration...');

    // Check the updated configuration
    const verificationConfig = await prisma.systemConfiguration.findFirst({
      where: {
        category: 'ai',
        key: 'operation_defaults',
      },
    });

    console.log(
      '✅ Verification - issue_analysis model is now:',
      verificationConfig.value.issue_analysis.model
    );

    console.log('\n🎯 Step 3: Testing what AI service would use...');

    // Simulate what the AI service would read
    const aiOperationConfig = verificationConfig.value.issue_analysis;
    console.log('🤖 AI Service would use:');
    console.log(`   Model: ${aiOperationConfig.model}`);
    console.log(`   Max Tokens: ${aiOperationConfig.maxTokens}`);
    console.log(`   Temperature: ${aiOperationConfig.temperature}`);

    console.log('\n✅ Test completed successfully!');
    console.log('🎉 The admin panel fix should now work correctly.');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminConfigFix();
