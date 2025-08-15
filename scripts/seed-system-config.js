const { PrismaClient } = require('@prisma/client');

const DEFAULT_SYSTEM_CONFIGURATIONS = [
  // Scoring Configuration
  {
    category: 'scoring',
    key: 'issue_thresholds',
    value: {
      critical: 80,
      high: 60,
      medium: 40,
      low: 0,
    },
    dataType: 'json',
    description: 'Issue heatmap score thresholds for priority classification',
    environment: 'all',
    scope: 'global',
    tags: ['scoring', 'thresholds', 'priority'],
  },
  {
    category: 'scoring',
    key: 'validation_thresholds',
    value: {
      excellent: 80,
      good: 60,
      needsImprovement: 40,
    },
    dataType: 'json',
    description: 'Form validation score thresholds for quality assessment',
    environment: 'all',
    scope: 'global',
    tags: ['scoring', 'validation', 'quality'],
  },
  {
    category: 'scoring',
    key: 'color_mapping',
    value: {
      critical: { color: 'bg-red-500', textColor: 'text-white' },
      high: { color: 'bg-orange-500', textColor: 'text-white' },
      medium: { color: 'bg-yellow-500', textColor: 'text-black' },
      low: { color: 'bg-green-500', textColor: 'text-white' },
    },
    dataType: 'json',
    description: 'Color scheme mapping for different priority levels',
    environment: 'all',
    scope: 'global',
    tags: ['ui', 'colors', 'priority'],
  },

  // AI Configuration
  {
    category: 'ai',
    key: 'fallback_model',
    value: 'gpt-3.5-turbo',
    dataType: 'string',
    description: 'Default AI model to use when specific operation config fails',
    environment: 'all',
    scope: 'global',
    tags: ['ai', 'fallback', 'model'],
  },
  {
    category: 'ai',
    key: 'model_specific_configs',
    value: {
      'gpt-3.5-turbo': {
        maxTokens: 4096,
        costPer1kInput: 0.001,
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
      healthCheckInterval: 300000,
      maxRetries: 3,
      retryDelay: 1000,
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

  // Performance Configuration Settings
  {
    category: 'performance',
    key: 'api_response_thresholds',
    value: {
      warning: 500,
      critical: 2000,
      timeout: 30000,
      healthCheck: 100,
    },
    dataType: 'json',
    description: 'API response time monitoring thresholds',
    environment: 'all',
    scope: 'global',
    tags: ['performance', 'monitoring', 'api'],
  },
  {
    category: 'performance',
    key: 'database_configuration',
    value: {
      queryTimeout: 10000,
      connectionPoolMin: 2,
      connectionPoolMax: 10,
      slowQueryThreshold: 1000,
      retryAttempts: 3,
      retryDelay: 1000,
    },
    dataType: 'json',
    description: 'Database performance and connection configuration',
    environment: 'all',
    scope: 'global',
    tags: ['performance', 'database', 'connection-pool'],
  },
  {
    category: 'performance',
    key: 'caching_strategy',
    value: {
      defaultTTL: 300,
      systemConfigTTL: 3600,
      aiResponseTTL: 1800,
      userSessionTTL: 86400,
      maxCacheSize: 1000,
      evictionPolicy: 'LRU',
      enableCompression: true,
      cacheWarming: true,
    },
    dataType: 'json',
    description: 'Caching strategy and TTL configuration',
    environment: 'all',
    scope: 'global',
    tags: ['performance', 'caching', 'ttl'],
  },
  {
    category: 'performance',
    key: 'rate_limiting',
    value: {
      apiCallsPerMinute: 100,
      apiCallsPerHour: 1000,
      aiBurstLimit: 5,
      aiCooldownPeriod: 60000,
      adminRateMultiplier: 5,
      enableRateLimiting: true,
      blockDuration: 300000,
    },
    dataType: 'json',
    description: 'API rate limiting and throttling configuration',
    environment: 'all',
    scope: 'global',
    tags: ['performance', 'rate-limiting', 'throttling'],
  },
  {
    category: 'performance',
    key: 'memory_management',
    value: {
      heapWarningThreshold: 80,
      heapCriticalThreshold: 90,
      garbageCollectionTrigger: 85,
      maxRequestSize: 10485760,
      maxResponseSize: 52428800,
      enableMemoryProfiling: false,
    },
    dataType: 'json',
    description: 'Memory usage monitoring and management configuration',
    environment: 'all',
    scope: 'global',
    tags: ['performance', 'memory', 'monitoring'],
  },

  // UX Configuration
  {
    category: 'ux',
    key: 'animation_settings',
    value: {
      enableAnimations: true,
      animationDuration: 200,
      easeFunction: 'ease-in-out',
    },
    dataType: 'json',
    description: 'User experience animation configuration',
    environment: 'all',
    scope: 'global',
    tags: ['ux', 'animations', 'performance'],
  },
  {
    category: 'ux',
    key: 'accessibility_settings',
    value: {
      enableHighContrast: false,
      enableScreenReaderSupport: true,
      keyboardNavigationEnabled: true,
      focusIndicatorStyle: 'ring',
    },
    dataType: 'json',
    description: 'Accessibility and inclusive design configuration',
    environment: 'all',
    scope: 'global',
    tags: ['ux', 'accessibility', 'a11y'],
  },

  // Development Configuration
  {
    category: 'development',
    key: 'debug_settings',
    value: {
      enableDebugMode: false,
      logLevel: 'info',
      enablePerformanceProfiling: false,
      logAIInteractions: true,
      trackPerformanceMetrics: true,
      enableConfigurationChangeLogs: true,
    },
    dataType: 'json',
    description: 'Development and debugging configuration settings',
    environment: 'development',
    scope: 'global',
    tags: ['development', 'debugging', 'logging'],
  },
];

async function seedSystemConfiguration(adminUserId) {
  const prisma = new PrismaClient();

  console.log('🌱 Starting system configuration seeding...');
  console.log(`📋 Total configurations to process: ${DEFAULT_SYSTEM_CONFIGURATIONS.length}`);

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
        const hasChanges =
          JSON.stringify(existing.value) !== JSON.stringify(config.value) ||
          existing.description !== config.description;

        if (hasChanges) {
          await prisma.systemConfiguration.update({
            where: { id: existing.id },
            data: {
              value: config.value,
              description: config.description,
              version: { increment: 1 },
              updatedBy: adminUserId,
            },
          });
          updateCount++;
          console.log(`  🔄 Updated: ${config.category}.${config.key}`);
        } else {
          console.log(`  ✅ Unchanged: ${config.category}.${config.key}`);
        }
      } else {
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

  await prisma.$disconnect();
}

if (require.main === module) {
  seedSystemConfiguration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedSystemConfiguration, DEFAULT_SYSTEM_CONFIGURATIONS };
