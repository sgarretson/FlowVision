import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Default System Configuration Seed Data
 *
 * This defines all the default business rules and system settings that were previously hardcoded.
 * Categories:
 * - scoring: Issue priority and validation scoring thresholds
 * - ai: AI service configuration and fallbacks
 * - performance: System performance and timing settings
 * - ux: User experience timing and interaction settings
 */

export const DEFAULT_SYSTEM_CONFIGURATIONS = [
  // ================================
  // SCORING CONFIGURATION
  // ================================
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
    validation: {
      type: 'object',
      properties: {
        excellent: { type: 'number', minimum: 60, maximum: 100 },
        good: { type: 'number', minimum: 40, maximum: 99 },
        needsImprovement: { type: 'number', minimum: 20, maximum: 79 },
        poor: { type: 'number', minimum: 0, maximum: 59 },
      },
    },
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

  // ================================
  // AI CONFIGURATION
  // ================================
  {
    category: 'ai',
    key: 'fallback_model',
    value: 'gpt-3.5-turbo',
    dataType: 'string',
    description: 'Default AI model to use when primary configuration is unavailable',
    environment: 'all',
    scope: 'global',
    tags: ['ai', 'fallback', 'reliability'],
    validation: {
      type: 'string',
      enum: ['gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-4', 'gpt-4-turbo-preview'],
    },
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
    validation: {
      type: 'object',
      properties: {
        categorization: { type: 'number', minimum: 100, maximum: 4000 },
        analysis: { type: 'number', minimum: 500, maximum: 8000 },
        summary: { type: 'number', minimum: 100, maximum: 2000 },
        default: { type: 'number', minimum: 100, maximum: 1000 },
      },
    },
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
    validation: {
      type: 'object',
      properties: {
        high: { type: 'number', minimum: 70, maximum: 100 },
        medium: { type: 'number', minimum: 50, maximum: 89 },
        low: { type: 'number', minimum: 30, maximum: 69 },
        minimum: { type: 'number', minimum: 0, maximum: 49 },
      },
    },
  },

  // ================================
  // AI ADVANCED CONFIGURATION
  // ================================
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
    validation: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          maxTokens: { type: 'number', minimum: 100, maximum: 32000 },
          costPer1kInput: { type: 'number', minimum: 0 },
          costPer1kOutput: { type: 'number', minimum: 0 },
          contextWindow: { type: 'number', minimum: 1000 },
          preferredFor: { type: 'array', items: { type: 'string' } },
        },
      },
    },
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
    validation: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          model: { type: 'string' },
          maxTokens: { type: 'number', minimum: 100, maximum: 8000 },
          temperature: { type: 'number', minimum: 0, maximum: 2 },
        },
        required: ['model', 'maxTokens', 'temperature'],
      },
    },
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
    validation: {
      type: 'object',
      properties: {
        healthCheckInterval: { type: 'number', minimum: 60000, maximum: 3600000 },
        maxRetries: { type: 'number', minimum: 1, maximum: 10 },
        retryBackoffMultiplier: { type: 'number', minimum: 1, maximum: 5 },
        connectionTimeoutMs: { type: 'number', minimum: 5000, maximum: 120000 },
        circuitBreakerThreshold: { type: 'number', minimum: 3, maximum: 20 },
        circuitBreakerResetTimeout: { type: 'number', minimum: 30000, maximum: 300000 },
        enableMetricsCollection: { type: 'boolean' },
        enableCostTracking: { type: 'boolean' },
      },
    },
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
    validation: {
      type: 'object',
      properties: {
        enableABTesting: { type: 'boolean' },
        testGroups: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              percentage: { type: 'number', minimum: 0, maximum: 100 },
              model: { type: 'string' },
              temperature: { type: 'number', minimum: 0, maximum: 2 },
            },
          },
        },
        testDurationDays: { type: 'number', minimum: 1, maximum: 30 },
        minimumSampleSize: { type: 'number', minimum: 10, maximum: 10000 },
        statisticalSignificanceThreshold: { type: 'number', minimum: 0.8, maximum: 0.99 },
      },
    },
  },

  // ================================
  // PERFORMANCE CONFIGURATION
  // ================================
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
    validation: {
      type: 'object',
      properties: {
        aiRequest: { type: 'number', minimum: 5000, maximum: 120000 },
        apiRequest: { type: 'number', minimum: 1000, maximum: 30000 },
        databaseQuery: { type: 'number', minimum: 1000, maximum: 15000 },
        fileUpload: { type: 'number', minimum: 10000, maximum: 300000 },
      },
    },
  },
  {
    category: 'performance',
    key: 'cache_settings',
    value: {
      configurationTTL: 300, // 5 minutes
      aiResponseTTL: 3600, // 1 hour
      userDataTTL: 1800, // 30 minutes
      staticDataTTL: 86400, // 24 hours
    },
    dataType: 'json',
    description: 'Cache time-to-live values in seconds',
    environment: 'all',
    scope: 'global',
    tags: ['performance', 'caching', 'memory'],
    validation: {
      type: 'object',
      properties: {
        configurationTTL: { type: 'number', minimum: 60, maximum: 3600 },
        aiResponseTTL: { type: 'number', minimum: 300, maximum: 86400 },
        userDataTTL: { type: 'number', minimum: 300, maximum: 7200 },
        staticDataTTL: { type: 'number', minimum: 3600, maximum: 604800 },
      },
    },
  },
  {
    category: 'performance',
    key: 'rate_limiting',
    value: {
      aiRequests: { perMinute: 30, perHour: 500 },
      apiRequests: { perMinute: 100, perHour: 2000 },
      fileUploads: { perMinute: 10, perHour: 50 },
    },
    dataType: 'json',
    description: 'Rate limiting thresholds for various operations',
    environment: 'all',
    scope: 'global',
    tags: ['performance', 'rate-limiting', 'security'],
  },

  // ================================
  // UX CONFIGURATION
  // ================================
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
    validation: {
      type: 'object',
      properties: {
        debounceDelay: { type: 'number', minimum: 300, maximum: 3000 },
        navigationDelay: { type: 'number', minimum: 500, maximum: 5000 },
        feedbackDelay: { type: 'number', minimum: 1000, maximum: 10000 },
        tooltipDelay: { type: 'number', minimum: 100, maximum: 2000 },
      },
    },
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
    validation: {
      type: 'object',
      properties: {
        minimumDescriptionLength: { type: 'number', minimum: 10, maximum: 100 },
        maximumDescriptionLength: { type: 'number', minimum: 200, maximum: 2000 },
        requiredFieldsForAI: { type: 'number', minimum: 1, maximum: 10 },
        confidenceDisplayThreshold: { type: 'number', minimum: 0, maximum: 100 },
      },
    },
  },

  // ================================
  // DEVELOPMENT CONFIGURATION
  // ================================
  {
    category: 'development',
    key: 'debug_settings',
    value: {
      enableVerboseLogging: false,
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

/**
 * Seed default system configurations
 */
export async function seedSystemConfiguration(adminUserId?: string) {
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
            // Don't overwrite value - respect existing customizations
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

export default seedSystemConfiguration;
