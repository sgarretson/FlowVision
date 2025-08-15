const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAIConfig() {
  try {
    console.log('🔍 Checking AI Configuration in Database...\n');

    const config = await prisma.aIConfiguration.findUnique({
      where: { key: 'openai_config' },
      include: { updatedUser: { select: { id: true, name: true, email: true } } },
    });

    if (!config) {
      console.log('❌ No AI configuration found in database');
      return;
    }

    console.log('✅ AI Configuration Found:');
    console.log('Key:', config.key);
    console.log('Description:', config.description);
    console.log('Active:', config.isActive);
    console.log('Updated by:', config.updatedUser?.email || 'Unknown');
    console.log('Updated at:', config.updatedAt);
    console.log('\n🔧 Configuration Values:');

    const configValue = config.value;
    if (typeof configValue === 'object' && configValue !== null) {
      console.log('Model:', configValue.model || 'NOT SET');
      console.log('Enabled:', configValue.enabled);
      console.log('Max Tokens:', configValue.maxTokens);
      console.log('Temperature:', configValue.temperature);
      console.log(
        'API Key:',
        configValue.apiKey ? `${configValue.apiKey.substring(0, 10)}...` : 'NOT SET'
      );
    } else {
      console.log('❌ Configuration value is not a valid object:', configValue);
    }

    // Test the aiConfigLoader
    console.log('\n🧪 Testing AIConfigLoader...');
    const { aiConfigLoader } = require('../lib/ai-config-loader');
    const loadedConfig = await aiConfigLoader.loadConfig();

    if (loadedConfig) {
      console.log('✅ AIConfigLoader working:');
      console.log('Loaded Model:', loadedConfig.model);
      console.log('Loaded Enabled:', loadedConfig.enabled);
    } else {
      console.log('❌ AIConfigLoader returned null');
    }
  } catch (error) {
    console.error('❌ Error checking AI config:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAIConfig();
