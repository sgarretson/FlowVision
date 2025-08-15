import { aiConfigLoader } from './ai-config-loader';
import AIMigration from './ai-migration';

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100 quality score
  feedback: ValidationFeedback[];
  suggestions: SmartSuggestion[];
  completeness: CompletenessMetrics;
}

export interface ValidationFeedback {
  type: 'error' | 'warning' | 'info' | 'success';
  field?: string;
  message: string;
  suggestion?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface SmartSuggestion {
  type: 'category' | 'completion' | 'example' | 'template';
  content: string;
  confidence: number;
  reasoning: string;
}

export interface CompletenessMetrics {
  hasBusinessImpact: boolean;
  hasFrequency: boolean;
  hasAffectedDepartments: boolean;
  hasSpecificExamples: boolean;
  hasMeasurableMetrics: boolean;
  wordCount: number;
  sentenceCount: number;
  readabilityScore: number;
}

export class SmartFormValidator {
  private static instance: SmartFormValidator;

  public static getInstance(): SmartFormValidator {
    if (!SmartFormValidator.instance) {
      SmartFormValidator.instance = new SmartFormValidator();
    }
    return SmartFormValidator.instance;
  }

  /**
   * Validate issue description with AI-powered analysis
   */
  public async validateIssueDescription(
    description: string,
    selectedCategories?: {
      businessArea?: string;
      department?: string;
      impactType?: string;
    }
  ): Promise<ValidationResult> {
    // Basic validation first
    const basicValidation = this.performBasicValidation(description);

    // AI-powered analysis
    const aiAnalysis = await this.performAIValidation(description, selectedCategories);

    // Combine results
    return this.combineValidationResults(basicValidation, aiAnalysis);
  }

  /**
   * Get contextual suggestions for improving issue description
   */
  public async getImprovementSuggestions(
    description: string,
    currentScore: number
  ): Promise<SmartSuggestion[]> {
    try {
      const isAIConfigured = await aiConfigLoader.isConfigured();
      if (!isAIConfigured) {
        return this.getFallbackSuggestions(description, currentScore);
      }

      const prompt = `
Analyze this issue description and provide specific improvement suggestions:

Current Description: "${description}"
Current Quality Score: ${currentScore}/100

Provide 3-5 specific, actionable suggestions to improve this issue description. Focus on:
1. Adding business impact details
2. Including frequency/timing information
3. Specifying affected departments/people
4. Adding measurable metrics
5. Providing concrete examples

Return as JSON:
{
  "suggestions": [
    {
      "type": "completion",
      "content": "Add frequency information like 'This happens 2-3 times per week'",
      "confidence": 85,
      "reasoning": "Adding frequency helps prioritize the issue"
    }
  ]
}
`;

      const response = await AIMigration.generateStructuredResponse(prompt);
      if (response) {
        const parsed = JSON.parse(response);
        return parsed.suggestions || [];
      }

      return this.getFallbackSuggestions(description, currentScore);
    } catch (error) {
      console.error('AI improvement suggestions failed:', error);
      return this.getFallbackSuggestions(description, currentScore);
    }
  }

  /**
   * Validate field dependencies and show progressive disclosure
   */
  public getProgressiveFieldVisibility(
    description: string,
    currentCategories: any
  ): {
    showAdvancedFields: boolean;
    recommendedFields: string[];
    hiddenFields: string[];
  } {
    const hasMinimumDescription = description.length >= 50;
    const hasCategories = currentCategories.businessArea || currentCategories.department;

    const showAdvancedFields = hasMinimumDescription && hasCategories;

    const recommendedFields = [];
    const hiddenFields = [];

    if (hasMinimumDescription) {
      recommendedFields.push('priority', 'affectedUsers');
    }

    if (showAdvancedFields) {
      recommendedFields.push('timeline', 'budget', 'successMetrics');
    } else {
      hiddenFields.push('timeline', 'budget', 'successMetrics');
    }

    return {
      showAdvancedFields,
      recommendedFields,
      hiddenFields,
    };
  }

  private performBasicValidation(description: string): Partial<ValidationResult> {
    const feedback: ValidationFeedback[] = [];
    const completeness = this.analyzeCompleteness(description);

    // Length validation
    if (description.length < 20) {
      feedback.push({
        type: 'error',
        field: 'description',
        message: 'Description is too short',
        suggestion: 'Provide at least 20 characters with specific details',
        priority: 'high',
      });
    } else if (description.length < 50) {
      feedback.push({
        type: 'warning',
        field: 'description',
        message: 'Description could be more detailed',
        suggestion: 'Add more context about the business impact and frequency',
        priority: 'medium',
      });
    }

    // Quality indicators
    if (!completeness.hasBusinessImpact) {
      feedback.push({
        type: 'info',
        field: 'description',
        message: 'Consider adding business impact details',
        suggestion: 'Explain how this affects productivity, costs, or customer satisfaction',
        priority: 'medium',
      });
    }

    if (!completeness.hasFrequency) {
      feedback.push({
        type: 'info',
        field: 'description',
        message: 'Include frequency information',
        suggestion: 'Mention how often this occurs (daily, weekly, occasionally)',
        priority: 'low',
      });
    }

    // Calculate basic score
    let score = 0;
    if (description.length >= 20) score += 20;
    if (description.length >= 50) score += 20;
    if (completeness.hasBusinessImpact) score += 25;
    if (completeness.hasFrequency) score += 15;
    if (completeness.hasSpecificExamples) score += 20;

    return {
      score: Math.min(score, 100),
      feedback,
      completeness,
    };
  }

  private async performAIValidation(
    description: string,
    selectedCategories?: any
  ): Promise<Partial<ValidationResult>> {
    try {
      const isAIConfigured = await aiConfigLoader.isConfigured();
      if (!isAIConfigured) {
        return { suggestions: [] };
      }

      const prompt = `
Analyze this issue description for quality and completeness:

Description: "${description}"
Selected Categories: ${JSON.stringify(selectedCategories || {})}

Evaluate the description on:
1. Clarity and specificity
2. Business impact articulation
3. Affected stakeholders identification
4. Actionability and next steps
5. Measurable outcomes

Provide validation feedback and improvement suggestions in JSON format:
{
  "aiScore": 75,
  "feedback": [
    {
      "type": "warning",
      "message": "Missing frequency information",
      "suggestion": "Add how often this issue occurs",
      "priority": "medium"
    }
  ],
  "suggestions": [
    {
      "type": "completion",
      "content": "This affects our daily operations by...",
      "confidence": 80,
      "reasoning": "Adding operational impact clarifies business value"
    }
  ]
}
`;

      const response = await AIMigration.generateStructuredResponse(prompt);
      if (response) {
        const parsed = JSON.parse(response);
        return {
          score: parsed.aiScore,
          feedback: parsed.feedback || [],
          suggestions: parsed.suggestions || [],
        };
      }
    } catch (error) {
      console.error('AI validation failed:', error);
    }

    return { suggestions: [] };
  }

  private combineValidationResults(
    basic: Partial<ValidationResult>,
    ai: Partial<ValidationResult>
  ): ValidationResult {
    // Combine scores (weighted average)
    const basicScore = basic.score || 0;
    const aiScore = ai.score || basicScore;
    const combinedScore = Math.round(basicScore * 0.6 + aiScore * 0.4);

    // Combine feedback
    const allFeedback = [...(basic.feedback || []), ...(ai.feedback || [])];

    // Remove duplicates and sort by priority
    const uniqueFeedback = this.deduplicateFeedback(allFeedback);

    return {
      isValid: combinedScore >= 60 && allFeedback.filter((f) => f.type === 'error').length === 0,
      score: combinedScore,
      feedback: uniqueFeedback,
      suggestions: ai.suggestions || [],
      completeness: basic.completeness!,
    };
  }

  private analyzeCompleteness(description: string): CompletenessMetrics {
    const words = description.split(/\s+/).filter((word) => word.length > 0);
    const sentences = description.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    // Keyword analysis for business impact
    const businessImpactKeywords = [
      'cost',
      'revenue',
      'customer',
      'productivity',
      'efficiency',
      'quality',
      'time',
      'delay',
      'impact',
      'affect',
    ];
    const hasBusinessImpact = businessImpactKeywords.some((keyword) =>
      description.toLowerCase().includes(keyword)
    );

    // Frequency indicators
    const frequencyKeywords = [
      'daily',
      'weekly',
      'monthly',
      'often',
      'sometimes',
      'always',
      'never',
      'occasionally',
      'frequently',
    ];
    const hasFrequency = frequencyKeywords.some((keyword) =>
      description.toLowerCase().includes(keyword)
    );

    // Department/people indicators
    const departmentKeywords = [
      'team',
      'department',
      'user',
      'customer',
      'client',
      'employee',
      'staff',
      'manager',
    ];
    const hasAffectedDepartments = departmentKeywords.some((keyword) =>
      description.toLowerCase().includes(keyword)
    );

    // Example indicators
    const exampleKeywords = ['example', 'for instance', 'such as', 'like', 'including'];
    const hasSpecificExamples = exampleKeywords.some((keyword) =>
      description.toLowerCase().includes(keyword)
    );

    // Metric indicators
    const metricKeywords = [
      '%',
      'percent',
      'hours',
      'minutes',
      'days',
      'week',
      'month',
      '$',
      'cost',
      'save',
      'reduce',
      'increase',
    ];
    const hasMeasurableMetrics = metricKeywords.some((keyword) =>
      description.toLowerCase().includes(keyword)
    );

    // Simple readability score (based on sentence and word length)
    const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
    const avgCharsPerWord = words.length > 0 ? description.length / words.length : 0;
    const readabilityScore = Math.max(0, 100 - avgWordsPerSentence * 2 - avgCharsPerWord * 3);

    return {
      hasBusinessImpact,
      hasFrequency,
      hasAffectedDepartments,
      hasSpecificExamples,
      hasMeasurableMetrics,
      wordCount: words.length,
      sentenceCount: sentences.length,
      readabilityScore: Math.round(readabilityScore),
    };
  }

  private deduplicateFeedback(feedback: ValidationFeedback[]): ValidationFeedback[] {
    const seen = new Set<string>();
    const priorityOrder = { high: 3, medium: 2, low: 1 };

    return feedback
      .filter((item) => {
        const key = `${item.type}-${item.message}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  }

  private getFallbackSuggestions(description: string, currentScore: number): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    if (currentScore < 40) {
      suggestions.push({
        type: 'completion',
        content: 'Add more details about what exactly is happening and when',
        confidence: 90,
        reasoning: 'Low score indicates insufficient detail',
      });
    }

    if (currentScore < 60) {
      suggestions.push({
        type: 'example',
        content: 'Include business impact like "This delays project deliveries by 2-3 days"',
        confidence: 85,
        reasoning: 'Adding measurable impact improves issue priority assessment',
      });
    }

    if (
      !description.toLowerCase().includes('team') &&
      !description.toLowerCase().includes('department')
    ) {
      suggestions.push({
        type: 'completion',
        content: 'Specify which teams or departments are affected',
        confidence: 80,
        reasoning: 'Identifying affected stakeholders helps with assignment and prioritization',
      });
    }

    return suggestions;
  }
}

// Export singleton instance
export const smartFormValidator = SmartFormValidator.getInstance();
