// AI Migration utility for gradual rollout of optimized service
import { openAIService } from '@/lib/openai';
import { aiService } from '@/lib/ai-service';
import { aiConfigLoader } from '@/lib/ai-config-loader';
import { executeAIOperation, AIServiceError } from '@/lib/ai-error-handler';

export class AIMigration {
  // Feature flag for gradual rollout
  static isOptimizedEnabled(userId?: string): boolean {
    // Check environment variable for global enable/disable
    const globalEnabled = process.env.ENABLE_OPTIMIZED_AI === 'true';
    if (!globalEnabled) return false;

    // For testing, enable for specific users first
    const testUsers = (process.env.OPTIMIZED_AI_TEST_USERS || '').split(',');
    if (userId && testUsers.includes(userId)) return true;

    // Gradual rollout percentage (0-100)
    const rolloutPercentage = parseInt(process.env.OPTIMIZED_AI_ROLLOUT || '0');
    if (rolloutPercentage === 0) return false;
    if (rolloutPercentage >= 100) return true;

    // Use user ID hash for consistent rollout
    if (userId) {
      const hash = this.hashUserId(userId);
      return hash < rolloutPercentage;
    }

    // Default to old service for anonymous users
    return false;
  }

  private static hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % 100;
  }

  // Wrapper methods that route to appropriate service with error handling
  static async generateIssueSummary(
    description: string,
    department?: string,
    category?: string,
    businessContext?: any,
    userId?: string
  ): Promise<any> {
    try {
      // Ensure configuration is loaded before proceeding
      await aiConfigLoader.loadConfig();

      // Check if AI services are configured
      const isConfigured = await this.isConfigured();
      if (!isConfigured) {
        throw new AIServiceError('AI services not configured', 'NOT_CONFIGURED');
      }

      // Use executeAIOperation for robust error handling
      return await executeAIOperation(async () => {
        // Temporarily force original service until optimized service is fixed
        if (false && this.isOptimizedEnabled(userId)) {
          return aiService.generateIssueSummary(
            description,
            department,
            category,
            businessContext,
            userId || 'anonymous'
          );
        } else {
          // Use original service with format conversion
          const result = await openAIService.generateIssueSummary(
            description,
            department,
            category,
            businessContext
          );
          return result;
        }
      }, 'AIMigration.generateIssueSummary');
    } catch (error) {
      console.error('AIMigration.generateIssueSummary failed:', error);
      // Return null to indicate failure - calling code should handle gracefully
      return null;
    }
  }

  static async generateClusterSummary(
    clusterName: string,
    clusterDescription: string,
    issues: Array<{
      description: string;
      department?: string;
      category?: string;
      votes: number;
      heatmapScore: number;
    }>,
    businessContext?: any,
    userId?: string
  ): Promise<any> {
    if (this.isOptimizedEnabled(userId)) {
      return aiService.generateClusterSummary(
        clusterName,
        clusterDescription,
        issues,
        businessContext,
        userId || 'anonymous'
      );
    } else {
      // Fallback to original service
      return openAIService.generateClusterSummary(
        clusterName,
        clusterDescription,
        issues,
        businessContext
      );
    }
  }

  static async generateRequirementsFromSummary(
    summary: string,
    initiativeTitle: string,
    initiativeGoal: string,
    businessContext?: any,
    userId?: string
  ): Promise<any> {
    if (this.isOptimizedEnabled(userId)) {
      return aiService.generateRequirementsFromSummary(
        summary,
        initiativeTitle,
        initiativeGoal,
        businessContext,
        userId || 'anonymous'
      );
    } else {
      // Fallback to original service
      return openAIService.generateRequirementsFromSummary(
        summary,
        initiativeTitle,
        initiativeGoal,
        businessContext
      );
    }
  }

  // Backwards compatibility methods
  static async generateIssueInsights(
    description: string,
    businessContext?: any,
    userId?: string
  ): Promise<{ insights: string; model: string } | null> {
    if (this.isOptimizedEnabled(userId)) {
      const result = await aiService.generateIssueInsights(description, businessContext);
      return result ? { insights: result, model: 'optimized-service' } : null;
    } else {
      return openAIService.generateIssueInsights(description, businessContext);
    }
  }

  static async generateInitiativeRecommendations(
    title: string,
    problem: string,
    businessContext?: any,
    userId?: string
  ): Promise<any> {
    if (this.isOptimizedEnabled(userId)) {
      return aiService.generateInitiativeRecommendations(title, problem, businessContext);
    } else {
      return openAIService.generateInitiativeRecommendations(title, problem, businessContext);
    }
  }

  static async generateRequirementsFromDescription(
    description: string,
    userId?: string
  ): Promise<any> {
    if (this.isOptimizedEnabled(userId)) {
      return aiService.generateRequirementsFromDescription(description);
    } else {
      return openAIService.generateRequirementsFromDescription(description);
    }
  }

  static async generateRequirementCards(
    title: string,
    problem: string,
    goal: string,
    businessContext?: any,
    userId?: string
  ): Promise<any> {
    if (this.isOptimizedEnabled(userId)) {
      return aiService.generateRequirementCards(title, problem, goal, businessContext);
    } else {
      return openAIService.generateRequirementCards(title, problem, goal, businessContext);
    }
  }

  // Service management methods with database integration
  static async isConfigured(): Promise<boolean> {
    const config = await aiConfigLoader.loadConfig();
    return config !== null && config.enabled;
  }

  static async testConnection(): Promise<{ success: boolean; error?: string; model?: string }> {
    // Ensure configuration is loaded first
    await aiConfigLoader.loadConfig();

    // Test both services and return the active one
    if (aiService.isConfigured()) {
      return aiService.testConnection();
    }
    return openAIService.testConnection();
  }

  static async getConfig(): Promise<any> {
    return aiConfigLoader.getConfig();
  }

  static async configure(config: any, userId?: string): Promise<boolean> {
    if (userId) {
      return aiConfigLoader.saveConfig(config, userId);
    } else {
      // Fallback to direct service configuration (temporary)
      openAIService.configure(config);
      aiService.configure(config);
      return true;
    }
  }

  static async reloadConfig(): Promise<boolean> {
    const config = await aiConfigLoader.reloadConfig();
    return config !== null;
  }

  // Performance monitoring
  static async getPerformanceMetrics(): Promise<any> {
    if (aiService.isConfigured()) {
      return aiService.getPerformanceMetrics();
    }
    return null;
  }

  static clearCache(): void {
    if (aiService.isConfigured()) {
      aiService.clearCache();
    }
  }

  // New method for structured AI responses (JSON format)
  static async generateStructuredResponse(prompt: string, userId?: string): Promise<string | null> {
    if (this.isOptimizedEnabled(userId)) {
      return aiService.generateStructuredResponse(prompt);
    } else {
      return openAIService.generateStructuredResponse(prompt);
    }
  }
}

// Export default instance for easy import
export default AIMigration;
