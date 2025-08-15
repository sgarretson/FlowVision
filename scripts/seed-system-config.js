const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Default System Configuration Seed Data (converted from TypeScript)
const DEFAULT_SYSTEM_CONFIGURATIONS = [
  // SCORING CONFIGURATION
  {
    category: 'scoring',
    key: 'issue_priority_thresholds',
    value: {
      critical: 80,
      high: 60,
      medium: 40,
      low: 0,
    },
    dataType: 'json',
    description: 'Score thresholds for issue priority classification (Critical/High/Medium/Low)',
    environment: 'all',
    scope: 'global',
    tags: ['business-logic', 'user-facing', 'critical'],
    validation: {
      type: 'object',
      properties: {
        critical: { type: 'number', minimum: 60, maximum: 100 },
        high: { type: 'number', minimum: 40, maximum: 99 },
        medium: { type: 'number', minimum: 20, maximum: 79 },
        low: { type: 'number', minimum: 0, maximum: 59 },
      },
      required: ['critical', 'high', 'medium', 'low'],
    },
    constraints: {
      businessRules: [
        'critical > high > medium > low',
        'all values between 0-100',
        'minimum 10 point spread between levels',
      ],
    },
  },
  {
    category: 'scoring',
    key: 'validation_score_thresholds',
    value: {
      excellent: 80,
      good: 60,
      needsImprovement: 40,
      poor: 0,
    },
    dataType: 'json',
    description: 'Score thresholds for form validation quality assessment',
    environment: 'all',
    scope: 'global',
    tags: ['validation', 'form-quality', 'ux'],
  },
  {
    category: 'scoring',
    key: 'heatmap_color_mapping',
    value: {
      critical: { color: 'bg-red-500', textColor: 'text-white' },
      high: { color: 'bg-orange-500', textColor: 'text-white' },
      medium: { color: 'bg-yellow-500', textColor: 'text-black' },
      low: { color: 'bg-green-500', textColor: 'text-white' },
    },
    dataType: 'json',
    description: 'Color mappings for issue priority visualization',
    environment: 'all',
    scope: 'global',
    tags: ['ui', 'colors', 'visualization'],
  },

  // AI CONFIGURATION
  {
    category: 'ai',
    key: 'fallback_model',
    value: 'gpt-3.5-turbo',
    dataType: 'string',
    description: 'Default AI model to use when primary configuration is unavailable',
    environment: 'all',
    scope: 'global',
    tags: ['ai', 'fallback', 'reliability'],
  },
  {
    category: 'ai',
    key: 'token_limits',
    value: {
      categorization: 800,
      analysis: 1500,
      summary: 500,
      default: 500,
    },
    dataType: 'json',
    description: 'Token limits for different types of AI operations',
    environment: 'all',
    scope: 'global',
    tags: ['ai', 'performance', 'limits'],
  },
  {
    category: 'ai',
    key: 'confidence_thresholds',
    value: {
      high: 85,
      medium: 70,
      low: 50,
      minimum: 30,
    },
    dataType: 'json',
    description: 'Confidence score thresholds for AI-generated content',
    environment: 'all',
    scope: 'global',
    tags: ['ai', 'confidence', 'quality'],
  },

  // PERFORMANCE CONFIGURATION
  {
    category: 'performance',
    key: 'timeout_values',
    value: {
      aiRequest: 30000, // 30 seconds
      apiRequest: 10000, // 10 seconds
      databaseQuery: 5000, // 5 seconds
      fileUpload: 60000, // 60 seconds
    },
    dataType: 'json',
    description: 'Timeout values in milliseconds for various operations',
    environment: 'all',
    scope: 'global',
    tags: ['performance', 'timeout', 'reliability'],
  },

  // UX CONFIGURATION
  {
    category: 'ux',
    key: 'interaction_timing',
    value: {
      debounceDelay: 1000, // 1 second for AI suggestions
      navigationDelay: 1500, // 1.5 seconds for redirects
      feedbackDelay: 3000, // 3 seconds for success messages
      tooltipDelay: 500, // 0.5 seconds for tooltips
    },
    dataType: 'json',
    description: 'Timing values in milliseconds for user interactions',
    environment: 'all',
    scope: 'global',
    tags: ['ux', 'timing', 'interaction'],
  },
  {
    category: 'ux',
    key: 'form_validation',
    value: {
      minimumDescriptionLength: 20,
      maximumDescriptionLength: 500,
      requiredFieldsForAI: 3,
      confidenceDisplayThreshold: 50,
    },
    dataType: 'json',
    description: 'Form validation rules and thresholds',
    environment: 'all',
    scope: 'global',
    tags: ['ux', 'validation', 'forms'],
  },

  // AI ADVANCED CONFIGURATION
  {
    category: 'ai',
    key: 'model_specific_configs',
    value: {
      'gpt-3.5-turbo': {
        maxTokens: 4096,
        costPer1kInput: 0.0015,
        costPer1kOutput: 0.002,
        contextWindow: 4096,
        preferredFor: ['summaries', 'categorization', 'quick_analysis'],
      },
      'gpt-4': {
        maxTokens: 8192,
        costPer1kInput: 0.03,
        costPer1kOutput: 0.06,
        contextWindow: 8192,
        preferredFor: ['complex_analysis', 'strategic_insights', 'requirements'],
      },
      'gpt-4-turbo': {
        maxTokens: 4096,
        costPer1kInput: 0.01,
        costPer1kOutput: 0.03,
        contextWindow: 128000,
        preferredFor: ['detailed_analysis', 'clustering', 'comprehensive_summaries'],
      },
    },
    dataType: 'json',
    description: 'Model-specific configuration including costs, limits, and use cases',
    environment: 'all',
    scope: 'global',
    tags: ['ai', 'models', 'costs', 'optimization'],
  },
  {
    category: 'ai',
    key: 'operation_defaults',
    value: {
      issue_analysis: {
        model: 'gpt-3.5-turbo',
        maxTokens: 500,
        temperature: 0.7,
      },
      cluster_analysis: {
        model: 'gpt-4-turbo',
        maxTokens: 700,
        temperature: 0.7,
      },
      categorization: {
        model: 'gpt-3.5-turbo',
        maxTokens: 800,
        temperature: 0.3,
      },
      initiative_generation: {
        model: 'gpt-4',
        maxTokens: 1500,
        temperature: 0.3,
      },
      requirement_cards: {
        model: 'gpt-4',
        maxTokens: 500,
        temperature: 0.3,
      },
    },
    dataType: 'json',
    description: 'Default AI configuration for different operation types',
    environment: 'all',
    scope: 'global',
    tags: ['ai', 'operations', 'defaults'],
  },
  {
    category: 'ai',
    key: 'service_health_monitoring',
    value: {
      healthCheckInterval: 300000, // 5 minutes
      maxRetries: 3,
      retryBackoffMultiplier: 2,
      connectionTimeoutMs: 30000,
      circuitBreakerThreshold: 5,
      circuitBreakerResetTimeout: 60000,
      enableMetricsCollection: true,
      enableCostTracking: true,
    },
    dataType: 'json',
    description: 'AI service health monitoring and reliability configuration',
    environment: 'all',
    scope: 'global',
    tags: ['ai', 'monitoring', 'reliability', 'health'],
  },
  {
    category: 'ai',
    key: 'ab_testing_configs',
    value: {
      enableABTesting: false,
      testGroups: {
        control: {
          percentage: 50,
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
        },
        experimental: {
          percentage: 50,
          model: 'gpt-4-turbo',
          temperature: 0.5,
        },
      },
      testDurationDays: 7,
      minimumSampleSize: 100,
      statisticalSignificanceThreshold: 0.95,
    },
    dataType: 'json',
    description: 'A/B testing configuration for AI parameter optimization',
    environment: 'all',
    scope: 'global',
    tags: ['ai', 'ab-testing', 'optimization', 'experimentation'],
  },
];

async function seedSystemConfiguration(adminUserId) {
  console.log('🔧 Seeding default system configurations...');

  let seedCount = 0;
  let updateCount = 0;

  for (const config of DEFAULT_SYSTEM_CONFIGURATIONS) {
    try {
      const existing = await prisma.systemConfiguration.findUnique({
        where: {
          category_key_environment_scope: {
            category: config.category,
            key: config.key,
            environment: config.environment,
            scope: config.scope,
          },
        },
      });

      if (existing) {
        // Update existing configuration but preserve version and user changes
        await prisma.systemConfiguration.update({
          where: { id: existing.id },
          data: {
            description: config.description,
            validation: config.validation,
            constraints: config.constraints,
            tags: config.tags,
            updatedBy: adminUserId,
          },
        });
        updateCount++;
        console.log(`  ✅ Updated: ${config.category}.${config.key}`);
      } else {
        // Create new configuration
        await prisma.systemConfiguration.create({
          data: {
            ...config,
            updatedBy: adminUserId,
          },
        });
        seedCount++;
        console.log(`  🆕 Created: ${config.category}.${config.key}`);
      }
    } catch (error) {
      console.error(`  ❌ Failed to seed ${config.category}.${config.key}:`, error);
    }
  }

  console.log(`\n🎉 System configuration seeding completed!`);
  console.log(`  📊 Created: ${seedCount} new configurations`);
  console.log(`  🔄 Updated: ${updateCount} existing configurations`);
  console.log(`  📈 Total configurations: ${DEFAULT_SYSTEM_CONFIGURATIONS.length}`);

  return {
    created: seedCount,
    updated: updateCount,
    total: DEFAULT_SYSTEM_CONFIGURATIONS.length,
  };
}

async function main() {
  try {
    console.log('🚀 Starting system configuration seeding...\n');

    // Find an admin user for attribution
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminUser) {
      console.log(
        '⚠️  No admin user found, configurations will be created without user attribution'
      );
    }

    // Seed the system configurations
    const result = await seedSystemConfiguration(adminUser?.id);

    console.log('\n📋 Seeding Summary:');
    console.log(`  🆕 New configurations: ${result.created}`);
    console.log(`  🔄 Updated configurations: ${result.updated}`);
    console.log(`  📈 Total configurations: ${result.total}`);

    // Verify the seeding worked
    console.log('\n🔍 Verification:');
    const configCount = await prisma.systemConfiguration.count();
    console.log(`  💾 Total configurations in database: ${configCount}`);

    const categories = await prisma.systemConfiguration.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    console.log(`  📂 Categories created: ${categories.map((c) => c.category).join(', ')}`);

    console.log('\n✅ System configuration seeding completed successfully!');
    console.log('🎯 Ready for Story 3.2: Configuration Service Implementation');
  } catch (error) {
    console.error('❌ System configuration seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
