import { PrismaClient, SystemConfiguration } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * TypeScript interfaces for strongly-typed configuration access
 */
export interface ConfigurationValue {
  [key: string]: any;
}

export interface ScoringThresholds {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface ValidationThresholds {
  excellent: number;
  good: number;
  needsImprovement: number;
  poor: number;
}

export interface ColorMapping {
  critical: { color: string; textColor: string };
  high: { color: string; textColor: string };
  medium: { color: string; textColor: string };
  low: { color: string; textColor: string };
}

export interface TokenLimits {
  categorization: number;
  analysis: number;
  summary: number;
  default: number;
}

export interface ConfidenceThresholds {
  high: number;
  medium: number;
  low: number;
  minimum: number;
}

export interface TimeoutValues {
  aiRequest: number;
  apiRequest: number;
  databaseQuery: number;
  fileUpload: number;
}

export interface InteractionTiming {
  debounceDelay: number;
  navigationDelay: number;
  feedbackDelay: number;
  tooltipDelay: number;
}

export interface FormValidation {
  minimumDescriptionLength: number;
  maximumDescriptionLength: number;
  requiredFieldsForAI: number;
  confidenceDisplayThreshold: number;
}

/**
 * Configuration Service with Caching and Real-time Updates
 *
 * Provides type-safe, cached access to system configuration with:
 * - Memory caching for performance (<100ms lookup requirement)
 * - Environment-specific configuration support
 * - Real-time configuration updates
 * - Comprehensive error handling and fallbacks
 * - Type safety for all configuration values
 */
class SystemConfigService {
  private static instance: SystemConfigService;
  private cache = new Map<string, { value: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly environment: string;
  private readonly scope: string;

  // Change event listeners for real-time updates
  private changeListeners = new Map<string, ((value: any) => void)[]>();

  private constructor() {
    this.environment = process.env.NODE_ENV || 'production';
    this.scope = 'global'; // Could be extended for user/org specific configs

    // Set up cache cleanup interval
    setInterval(() => this.cleanupExpiredCache(), 60000); // Every minute
  }

  /**
   * Singleton pattern for global configuration access
   */
  public static getInstance(): SystemConfigService {
    if (!SystemConfigService.instance) {
      SystemConfigService.instance = new SystemConfigService();
    }
    return SystemConfigService.instance;
  }

  /**
   * Get configuration value with type safety and caching
   */
  public async getConfig<T = any>(
    category: string,
    key: string,
    fallback?: T,
    environment?: string
  ): Promise<T> {
    const cacheKey = this.getCacheKey(category, key, environment);

    try {
      // Check cache first
      const cached = this.getFromCache(cacheKey);
      if (cached !== null) {
        return cached as T;
      }

      // Load from database
      const config = await this.loadFromDatabase(category, key, environment);

      if (config) {
        // Cache the result
        this.setCache(cacheKey, config.value, this.DEFAULT_TTL);
        return config.value as T;
      }

      // Return fallback if no configuration found
      if (fallback !== undefined) {
        console.warn(`⚠️ Configuration ${category}.${key} not found, using fallback:`, fallback);
        return fallback;
      }

      throw new Error(`Configuration ${category}.${key} not found and no fallback provided`);
    } catch (error) {
      console.error(`❌ Failed to load configuration ${category}.${key}:`, error);

      if (fallback !== undefined) {
        return fallback;
      }

      throw error;
    }
  }

  /**
   * Strongly-typed configuration getters for common configurations
   */
  public async getScoringThresholds(): Promise<ScoringThresholds> {
    return this.getConfig<ScoringThresholds>('scoring', 'issue_priority_thresholds', {
      critical: 80,
      high: 60,
      medium: 40,
      low: 0,
    });
  }

  public async getValidationThresholds(): Promise<ValidationThresholds> {
    return this.getConfig<ValidationThresholds>('scoring', 'validation_score_thresholds', {
      excellent: 80,
      good: 60,
      needsImprovement: 40,
      poor: 0,
    });
  }

  public async getColorMapping(): Promise<ColorMapping> {
    return this.getConfig<ColorMapping>('scoring', 'heatmap_color_mapping', {
      critical: { color: 'bg-red-500', textColor: 'text-white' },
      high: { color: 'bg-orange-500', textColor: 'text-white' },
      medium: { color: 'bg-yellow-500', textColor: 'text-black' },
      low: { color: 'bg-green-500', textColor: 'text-white' },
    });
  }

  public async getAIFallbackModel(): Promise<string> {
    return this.getConfig<string>('ai', 'fallback_model', 'gpt-3.5-turbo');
  }

  public async getTokenLimits(): Promise<TokenLimits> {
    return this.getConfig<TokenLimits>('ai', 'token_limits', {
      categorization: 800,
      analysis: 1500,
      summary: 500,
      default: 500,
    });
  }

  public async getConfidenceThresholds(): Promise<ConfidenceThresholds> {
    return this.getConfig<ConfidenceThresholds>('ai', 'confidence_thresholds', {
      high: 85,
      medium: 70,
      low: 50,
      minimum: 30,
    });
  }

  public async getTimeoutValues(): Promise<TimeoutValues> {
    return this.getConfig<TimeoutValues>('performance', 'timeout_values', {
      aiRequest: 30000,
      apiRequest: 10000,
      databaseQuery: 5000,
      fileUpload: 60000,
    });
  }

  public async getInteractionTiming(): Promise<InteractionTiming> {
    return this.getConfig<InteractionTiming>('ux', 'interaction_timing', {
      debounceDelay: 1000,
      navigationDelay: 1500,
      feedbackDelay: 3000,
      tooltipDelay: 500,
    });
  }

  public async getFormValidation(): Promise<FormValidation> {
    return this.getConfig<FormValidation>('ux', 'form_validation', {
      minimumDescriptionLength: 20,
      maximumDescriptionLength: 500,
      requiredFieldsForAI: 3,
      confidenceDisplayThreshold: 50,
    });
  }

  /**
   * Set configuration value with cache invalidation
   */
  public async setConfig(
    category: string,
    key: string,
    value: any,
    description?: string,
    updatedBy?: string,
    environment?: string
  ): Promise<void> {
    const env = environment || this.environment;

    try {
      // Update or create configuration in database
      await prisma.systemConfiguration.upsert({
        where: {
          category_key_environment_scope: {
            category,
            key,
            environment: env,
            scope: this.scope,
          },
        },
        update: {
          value,
          description,
          updatedBy,
          version: { increment: 1 },
        },
        create: {
          category,
          key,
          value,
          dataType: this.inferDataType(value),
          description,
          environment: env,
          scope: this.scope,
          updatedBy,
        },
      });

      // Invalidate cache
      const cacheKey = this.getCacheKey(category, key, env);
      this.invalidateCache(cacheKey);

      // Notify change listeners
      this.notifyChangeListeners(cacheKey, value);

      console.log(`✅ Configuration updated: ${category}.${key} = ${JSON.stringify(value)}`);
    } catch (error) {
      console.error(`❌ Failed to set configuration ${category}.${key}:`, error);
      throw error;
    }
  }

  /**
   * Get all configurations for a category
   */
  public async getCategoryConfigs(category: string): Promise<SystemConfiguration[]> {
    try {
      return await prisma.systemConfiguration.findMany({
        where: {
          category,
          isActive: true,
          environment: { in: [this.environment, 'all'] },
          scope: this.scope,
        },
        orderBy: { key: 'asc' },
      });
    } catch (error) {
      console.error(`❌ Failed to load category configurations for ${category}:`, error);
      return [];
    }
  }

  /**
   * Cache management methods
   */
  private getCacheKey(category: string, key: string, environment?: string): string {
    const env = environment || this.environment;
    return `${category}:${key}:${env}:${this.scope}`;
  }

  private getFromCache(cacheKey: string): any | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    // Check if expired
    if (Date.now() > cached.timestamp + cached.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.value;
  }

  private setCache(cacheKey: string, value: any, ttl: number): void {
    this.cache.set(cacheKey, {
      value,
      timestamp: Date.now(),
      ttl,
    });
  }

  private invalidateCache(cacheKey: string): void {
    this.cache.delete(cacheKey);
  }

  public clearCache(): void {
    this.cache.clear();
    console.log('🧹 Configuration cache cleared');
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.timestamp + cached.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Real-time update system
   */
  public onChange(
    category: string,
    key: string,
    callback: (value: any) => void,
    environment?: string
  ): () => void {
    const cacheKey = this.getCacheKey(category, key, environment);

    if (!this.changeListeners.has(cacheKey)) {
      this.changeListeners.set(cacheKey, []);
    }

    this.changeListeners.get(cacheKey)!.push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.changeListeners.get(cacheKey);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  private notifyChangeListeners(cacheKey: string, value: any): void {
    const listeners = this.changeListeners.get(cacheKey);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(value);
        } catch (error) {
          console.error('❌ Error in configuration change listener:', error);
        }
      });
    }
  }

  /**
   * Database operations
   */
  private async loadFromDatabase(
    category: string,
    key: string,
    environment?: string
  ): Promise<SystemConfiguration | null> {
    const env = environment || this.environment;

    // Try environment-specific first, then 'all'
    const environments = env === 'all' ? ['all'] : [env, 'all'];

    for (const envToTry of environments) {
      const config = await prisma.systemConfiguration.findUnique({
        where: {
          category_key_environment_scope: {
            category,
            key,
            environment: envToTry,
            scope: this.scope,
          },
        },
      });

      if (config && config.isActive) {
        return config;
      }
    }

    return null;
  }

  /**
   * Utility methods
   */
  private inferDataType(value: any): string {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') return 'string';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'json';
    return 'unknown';
  }

  /**
   * Health check and monitoring
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    cacheSize: number;
    dbConnection: boolean;
    lastCheck: string;
  }> {
    try {
      // Test database connection
      await prisma.systemConfiguration.count();

      return {
        status: 'healthy',
        cacheSize: this.cache.size,
        dbConnection: true,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ SystemConfigService health check failed:', error);
      return {
        status: 'unhealthy',
        cacheSize: this.cache.size,
        dbConnection: false,
        lastCheck: new Date().toISOString(),
      };
    }
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    size: number;
    entries: { key: string; age: number }[];
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, cached]) => ({
      key,
      age: now - cached.timestamp,
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }
}

// Export singleton instance
export const systemConfig = SystemConfigService.getInstance();
export default systemConfig;
