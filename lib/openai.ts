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

  public async generateRequirementCards(
    title: string,
    problem: string,
    goal: string,
    businessContext?: any
  ): Promise<{
    cards: Array<{
      title: string;
      description: string;
      type: 'BUSINESS' | 'FUNCTIONAL' | 'ACCEPTANCE';
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      category?: string;
    }>;
  } | null> {
    if (!this.isConfigured() || !this.config?.enabled) {
      return null;
    }

    try {
      const contextStr = businessContext
        ? `Business Context: ${businessContext.industry}, ${businessContext.size} employees`
        : '';

      const prompt = `
You are an expert business analyst helping SMB leaders create requirement cards for their initiative.

Initiative:
Title: "${title}"
Problem: "${problem}"
Goal: "${goal}"
${contextStr}

Generate 5-8 requirement cards that cover:
1. Business requirements (what the business needs)
2. Functional requirements (how it should work)
3. Acceptance criteria (how to verify success)

Each card should be specific, actionable, and help execution teams understand what to build.

Format as JSON:
{
  "cards": [
    {
      "title": "Clear, specific requirement title",
      "description": "Detailed description that execution teams can understand and implement",
      "type": "BUSINESS|FUNCTIONAL|ACCEPTANCE",
      "priority": "LOW|MEDIUM|HIGH|CRITICAL",
      "category": "optional grouping like 'User Experience' or 'Data Management'"
    }
  ]
}

Focus on requirements that are:
- Specific and measurable
- Clear for implementation teams
- Business-value focused for SMB operations
- Realistic and achievable
`;

      const response = await this.client!.chat.completions.create({
        model: this.config.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: this.config.maxTokens || 800,
        temperature: 0.4,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        try {
          const parsed = JSON.parse(content);
          // Validate the structure
          if (parsed.cards && Array.isArray(parsed.cards)) {
            return parsed;
          }
          return null;
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

  /**
   * Generate a cohesive initiative suggestion from multiple related issues
   */
  public async generateInitiativeFromIssues(
    issues: Array<{ id: string; description: string; heatmapScore: number; votes: number }>,
    businessContext?: any
  ): Promise<{
    title: string;
    problem: string;
    goal: string;
    kpis: string[];
    type: string;
    estimatedCost: number;
    estimatedBenefit: number;
    estimatedHours: number;
    reasoning?: string;
  } | null> {
    if (!this.isConfigured() || !this.config?.enabled) {
      return null;
    }

    const issueDescriptions = issues.map((i) => i.description).join('\n• ');
    const totalVotes = issues.reduce((sum, i) => sum + i.votes, 0);
    const avgHeatmapScore = issues.reduce((sum, i) => sum + i.heatmapScore, 0) / issues.length;
    const maxHeatmapScore = Math.max(...issues.map((i) => i.heatmapScore));

    const prompt = `You are an expert business strategist helping a ${businessContext?.industry || 'business'} company with ${businessContext?.size || 'unknown'} employees create a comprehensive initiative from multiple related issues.

CONTEXT:
Company Industry: ${businessContext?.industry || 'Unknown'}
Company Size: ${businessContext?.size || 'unknown'} employees
Number of Issues: ${issues.length}
Total Community Votes: ${totalVotes}
Average Issue Severity: ${avgHeatmapScore.toFixed(1)}/100
Highest Issue Severity: ${maxHeatmapScore}/100

ISSUES TO ADDRESS:
• ${issueDescriptions}

REQUIREMENTS:
Create a strategic initiative that addresses all these issues comprehensively. Consider:
- Root cause analysis across all issues
- Synergies between issue resolutions
- Resource optimization by solving multiple problems together
- Business impact and ROI potential
- Implementation complexity and timeline

RESPONSE FORMAT (JSON):
{
  "title": "Strategic initiative title (60 chars max)",
  "problem": "Comprehensive problem statement connecting all issues",
  "goal": "Specific, measurable goal addressing the root causes",
  "kpis": ["KPI 1", "KPI 2", "KPI 3"],
  "type": "operational|strategic|innovation",
  "estimatedCost": 50000,
  "estimatedBenefit": 200000,
  "estimatedHours": 320,
  "complexity": "low|medium|high",
  "reasoning": "Brief explanation of how this initiative addresses all issues"
}`;

    try {
      const response = await this.client!.chat.completions.create({
        model: this.config.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: this.config.maxTokens || 800,
        temperature: this.config.temperature || 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return null;

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: parsed.title || `Strategic Initiative for ${issues.length} Issues`,
        problem:
          parsed.problem ||
          `Multiple operational issues affecting business performance: ${issueDescriptions}`,
        goal:
          parsed.goal ||
          `Systematically address and resolve ${issues.length} related operational issues`,
        kpis: Array.isArray(parsed.kpis)
          ? parsed.kpis
          : ['Issue Resolution Rate', 'Process Efficiency', 'Customer Satisfaction'],
        type: parsed.type || 'operational',
        estimatedCost:
          typeof parsed.estimatedCost === 'number' ? parsed.estimatedCost : 25000 * issues.length,
        estimatedBenefit:
          typeof parsed.estimatedBenefit === 'number'
            ? parsed.estimatedBenefit
            : 75000 * issues.length,
        estimatedHours:
          typeof parsed.estimatedHours === 'number' ? parsed.estimatedHours : 40 * issues.length,
        reasoning: parsed.reasoning,
      };
    } catch (err) {
      console.error('OpenAI API error:', err);
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
