import { prisma } from '@/lib/prisma';
import { openAIService } from '@/lib/openai';
import { optimizedOpenAIService } from '@/lib/optimized-openai-service';

export interface DatabaseAIConfig {
  id: string;
  key: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  enabled: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AI Configuration Loader - manages loading AI configuration from database
 */
export class AIConfigLoader {
  private static lastLoadTime = 0;
  private static CONFIG_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Load AI configuration from database and configure services
   */
  static async loadAndConfigureFromDatabase(): Promise<boolean> {
    try {
      // Cache check - avoid hitting database too frequently
      const now = Date.now();
      if (now - this.lastLoadTime < this.CONFIG_CACHE_DURATION) {
        return openAIService.isConfigured();
      }

      // Get the most recent AI configuration from database
      const aiConfig = await prisma.aIConfiguration.findFirst({
        where: {
          enabled: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      if (aiConfig && aiConfig.apiKey && aiConfig.apiKey !== 'sk-your-openai-api-key-here') {
        console.log('Loading AI configuration from database...');

        const config = {
          apiKey: aiConfig.apiKey,
          model: aiConfig.model,
          maxTokens: aiConfig.maxTokens,
          temperature: aiConfig.temperature,
          enabled: aiConfig.enabled,
        };

        // Configure both services
        openAIService.configure(config);
        optimizedOpenAIService.configure(config);

        this.lastLoadTime = now;

        console.log('✅ AI configuration loaded successfully from database');
        return true;
      } else {
        console.log('No valid AI configuration found in database, checking environment...');

        // Fallback to environment variables
        const envApiKey = process.env.OPENAI_API_KEY;
        if (envApiKey) {
          const envConfig = {
            apiKey: envApiKey,
            model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '500'),
            temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
            enabled: process.env.OPENAI_ENABLED !== 'false',
          };

          openAIService.configure(envConfig);
          optimizedOpenAIService.configure(envConfig);

          console.log('✅ AI configuration loaded from environment variables');
          return true;
        }

        console.log('❌ No AI configuration available');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to load AI configuration from database:', error);
      return false;
    }
  }

  /**
   * Check if AI is configured (checks database if not already configured)
   */
  static async isConfigured(): Promise<boolean> {
    // First check if already configured in memory
    if (openAIService.isConfigured()) {
      return true;
    }

    // If not configured, try loading from database
    return await this.loadAndConfigureFromDatabase();
  }

  /**
   * Force reload configuration from database
   */
  static async forceReload(): Promise<boolean> {
    this.lastLoadTime = 0; // Reset cache
    return await this.loadAndConfigureFromDatabase();
  }

  /**
   * Get current configuration status
   */
  static async getConfigurationStatus(): Promise<{
    configured: boolean;
    source: 'database' | 'environment' | 'none';
    hasApiKey: boolean;
    model?: string;
  }> {
    try {
      // Check database first
      const aiConfig = await prisma.aIConfiguration.findFirst({
        where: { enabled: true },
        orderBy: { updatedAt: 'desc' },
      });

      if (aiConfig && aiConfig.apiKey) {
        return {
          configured: true,
          source: 'database',
          hasApiKey: true,
          model: aiConfig.model,
        };
      }

      // Check environment
      const envApiKey = process.env.OPENAI_API_KEY;
      if (envApiKey) {
        return {
          configured: true,
          source: 'environment',
          hasApiKey: true,
          model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        };
      }

      return {
        configured: false,
        source: 'none',
        hasApiKey: false,
      };
    } catch (error) {
      console.error('Failed to get configuration status:', error);
      return {
        configured: false,
        source: 'none',
        hasApiKey: false,
      };
    }
  }
}
