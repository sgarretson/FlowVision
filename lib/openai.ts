import OpenAI from 'openai';

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  enabled?: boolean;
}

export interface AIUsageStats {
  totalRequests: number;
  totalTokens: number;
  lastUsed: string;
  costEstimate: number;
}

class OpenAIService {
  private client: OpenAI | null = null;
  private config: OpenAIConfig | null = null;

  constructor() {
    this.initializeFromEnv();
  }

  private initializeFromEnv() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.config = {
        apiKey,
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '500'),
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
        enabled: process.env.OPENAI_ENABLED !== 'false',
      };
      this.client = new OpenAI({ apiKey });
    }
  }

  public configure(config: OpenAIConfig) {
    this.config = config;
    this.client = new OpenAI({ apiKey: config.apiKey });
  }

  public isConfigured(): boolean {
    return !!(this.client && this.config?.apiKey);
  }

  public async testConnection(): Promise<{ success: boolean; error?: string; model?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'OpenAI API not configured' };
    }

    try {
      const response = await this.client!.chat.completions.create({
        model: this.config!.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test connection' }],
        max_tokens: 10,
      });

      return {
        success: true,
        model: response.model || this.config!.model,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  public async generateIssueInsights(
    description: string,
    businessContext?: any
  ): Promise<string | null> {
    if (!this.isConfigured() || !this.config?.enabled) {
      return null;
    }

    try {
      const prompt = `
Analyze this operational issue for a ${businessContext?.industry || 'business'} company with ${businessContext?.size || 'unknown'} employees:

Issue: "${description}"

Provide insights on:
1. Root cause analysis
2. Potential impact on operations
3. Suggested priority level (High/Medium/Low)
4. Quick win solutions
5. Long-term strategic considerations

Keep response concise and actionable.
`;

      const response = await this.client!.chat.completions.create({
        model: this.config.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: this.config.maxTokens || 500,
        temperature: this.config.temperature || 0.7,
      });

      return response.choices[0]?.message?.content || null;
    } catch (error) {
      console.error('OpenAI API error:', error);
      return null;
    }
  }

  public async generateInitiativeRecommendations(
    title: string,
    problem: string,
    businessContext?: any
  ): Promise<{
    recommendations?: string;
    estimatedDifficulty?: number;
    estimatedROI?: number;
    suggestedKPIs?: string[];
  } | null> {
    if (!this.isConfigured() || !this.config?.enabled) {
      return null;
    }

    try {
      const prompt = `
For a ${businessContext?.industry || 'business'} company with ${businessContext?.size || 'unknown'} employees:

Initiative: "${title}"
Problem: "${problem}"

Provide structured analysis:
1. Implementation recommendations
2. Difficulty score (0-100, where 100 is most difficult)
3. Expected ROI score (0-100, where 100 is highest ROI)
4. Suggested KPIs to track success (list 3-5 specific metrics)

Format as JSON with keys: recommendations, estimatedDifficulty, estimatedROI, suggestedKPIs
`;

      const response = await this.client!.chat.completions.create({
        model: this.config.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: this.config.maxTokens || 500,
        temperature: this.config.temperature || 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        try {
          return JSON.parse(content);
        } catch {
          // If JSON parsing fails, return as text recommendations
          return { recommendations: content };
        }
      }
      return null;
    } catch (error) {
      console.error('OpenAI API error:', error);
      return null;
    }
  }

  public async generateRequirementsFromDescription(description: string): Promise<{
    title?: string;
    problem?: string;
    goal?: string;
    acceptanceCriteria?: string[];
  } | null> {
    if (!this.isConfigured() || !this.config?.enabled) {
      return null;
    }

    try {
      const prompt = `
Convert this business description into a structured requirement:

"${description}"

Extract and format as JSON:
{
  "title": "Clear, actionable title",
  "problem": "Problem statement",
  "goal": "Desired outcome",
  "acceptanceCriteria": ["criterion 1", "criterion 2", "criterion 3"]
}
`;

      const response = await this.client!.chat.completions.create({
        model: this.config.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: this.config.maxTokens || 400,
        temperature: 0.3, // Lower temperature for more structured output
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        try {
          return JSON.parse(content);
        } catch {
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error('OpenAI API error:', error);
      return null;
    }
  }

  public getConfig(): OpenAIConfig | null {
    return this.config;
  }

  public async getUsageEstimate(): Promise<AIUsageStats | null> {
    // In a real implementation, you'd track this in your database
    // For now, return mock data
    return {
      totalRequests: 0,
      totalTokens: 0,
      lastUsed: new Date().toISOString(),
      costEstimate: 0,
    };
  }
}

// Export singleton instance
export const openAIService = new OpenAIService();

// Type exports
export type { OpenAI };
export default openAIService;
