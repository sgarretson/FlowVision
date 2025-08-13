import { openAIService } from './openai';
import { prisma } from './prisma';
import { SolutionType } from '@prisma/client';

export interface SolutionRecommendation {
  title: string;
  description: string;
  type: SolutionType;
  priority: number;
  estimatedCost?: number;
  estimatedHours?: number;
  confidence: number;
  reasoning: string;
  dependencies?: string[];
  tags: string[];
}

export interface RecommendationContext {
  initiative?: {
    id: string;
    title: string;
    problem: string;
    goal?: string;
  };
  issues?: Array<{
    id: string;
    description: string;
    heatmapScore: number;
    votes: number;
    systemImpacts?: Array<{
      systemCategory: {
        name: string;
        type: string;
      };
      impactLevel: string;
    }>;
  }>;
  systemAnalytics?: {
    riskSystems: string[];
    impactDistribution: Record<string, number>;
    systemTypeBreakdown: Record<string, any>;
  };
  organizationContext?: {
    industry: string;
    size: string;
    existingSolutions: string[];
  };
}

export class AISolutionEngine {
  private static instance: AISolutionEngine;

  public static getInstance(): AISolutionEngine {
    if (!AISolutionEngine.instance) {
      AISolutionEngine.instance = new AISolutionEngine();
    }
    return AISolutionEngine.instance;
  }

  /**
   * Generate solution recommendations for an initiative or set of issues
   */
  async generateSolutionRecommendations(
    context: RecommendationContext,
    maxRecommendations: number = 5
  ): Promise<SolutionRecommendation[]> {
    try {
      if (!openAIService.isConfigured()) {
        throw new Error('OpenAI service not configured');
      }

      // Build comprehensive prompt with context
      const prompt = this.buildRecommendationPrompt(context, maxRecommendations);

      const response = await openAIService.generateCompletion(prompt, {
        model: 'gpt-3.5-turbo',
        maxTokens: 2000,
        temperature: 0.7,
      });

      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parse the AI response
      const recommendations = this.parseRecommendations(response);

      // Validate and enhance recommendations
      return this.validateAndEnhanceRecommendations(recommendations, context);
    } catch (error) {
      console.error('❌ Error generating solution recommendations:', error);
      throw new Error(
        `Failed to generate solution recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Build context-aware prompt for solution recommendations
   */
  private buildRecommendationPrompt(
    context: RecommendationContext,
    maxRecommendations: number
  ): string {
    let prompt = `You are an expert business analyst and solution architect specializing in organizational improvement. Generate ${maxRecommendations} actionable solution recommendations based on the following context:

## INITIATIVE CONTEXT
`;

    if (context.initiative) {
      prompt += `
**Title**: ${context.initiative.title}
**Problem**: ${context.initiative.problem}
**Goal**: ${context.initiative.goal || 'Not specified'}
`;
    }

    if (context.issues && context.issues.length > 0) {
      prompt += `
## IDENTIFIED ISSUES (${context.issues.length} issues)
`;
      context.issues.forEach((issue, index) => {
        prompt += `
**Issue ${index + 1}**: ${issue.description}
- Heat Score: ${issue.heatmapScore}/100
- Votes: ${issue.votes}`;

        if (issue.systemImpacts && issue.systemImpacts.length > 0) {
          prompt += `
- System Impacts: ${issue.systemImpacts
            .map((impact) => `${impact.systemCategory.name} (${impact.impactLevel})`)
            .join(', ')}`;
        }
        prompt += '\n';
      });
    }

    if (context.systemAnalytics) {
      prompt += `
## SYSTEM ANALYSIS
**High-Risk Systems**: ${context.systemAnalytics.riskSystems.join(', ')}
**Impact Distribution**: ${Object.entries(context.systemAnalytics.impactDistribution)
        .map(([level, count]) => `${level}: ${count}`)
        .join(', ')}
`;
    }

    if (context.organizationContext) {
      prompt += `
## ORGANIZATION CONTEXT
**Industry**: ${context.organizationContext.industry}
**Size**: ${context.organizationContext.size}
**Existing Solutions**: ${context.organizationContext.existingSolutions.join(', ')}
`;
    }

    prompt += `
## SOLUTION REQUIREMENTS

Generate solutions that:
1. Address the root causes, not just symptoms
2. Are practical and implementable 
3. Consider both technical and process improvements
4. Include training/change management where needed
5. Account for system interdependencies

## RESPONSE FORMAT

Return a valid JSON array with this exact structure:

[
  {
    "title": "Solution title (50 chars max)",
    "description": "Detailed solution description explaining approach, benefits, and implementation steps",
    "type": "TECHNOLOGY|PROCESS|TRAINING|POLICY",
    "priority": 1-10,
    "estimatedCost": 0-100000,
    "estimatedHours": 1-1000,
    "confidence": 1-100,
    "reasoning": "Why this solution addresses the core issues",
    "dependencies": ["dependency1", "dependency2"],
    "tags": ["tag1", "tag2", "tag3"]
  }
]

Focus on high-impact, cost-effective solutions. Prioritize solutions by potential ROI and implementation feasibility.`;

    return prompt;
  }

  /**
   * Parse AI response into structured recommendations
   */
  private parseRecommendations(response: string): SolutionRecommendation[] {
    try {
      // Clean the response to extract JSON
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON array found in AI response');
      }

      const recommendations = JSON.parse(jsonMatch[0]) as SolutionRecommendation[];

      if (!Array.isArray(recommendations)) {
        throw new Error('AI response is not a valid array');
      }

      return recommendations;
    } catch (error) {
      console.error('❌ Failed to parse AI recommendations:', error);
      console.error('Raw response:', response);

      // Return fallback recommendation
      return [
        {
          title: 'Process Improvement Initiative',
          description:
            'Systematic review and optimization of existing processes to address identified issues.',
          type: 'PROCESS',
          priority: 5,
          estimatedCost: 5000,
          estimatedHours: 80,
          confidence: 60,
          reasoning: 'Fallback recommendation due to AI parsing error',
          dependencies: [],
          tags: ['process-improvement', 'fallback'],
        },
      ];
    }
  }

  /**
   * Validate and enhance recommendations with business rules
   */
  private validateAndEnhanceRecommendations(
    recommendations: SolutionRecommendation[],
    context: RecommendationContext
  ): SolutionRecommendation[] {
    return recommendations.map((rec) => {
      // Validate and clamp values
      const validated: SolutionRecommendation = {
        ...rec,
        priority: Math.max(1, Math.min(10, rec.priority)),
        confidence: Math.max(1, Math.min(100, rec.confidence)),
        estimatedCost: rec.estimatedCost ? Math.max(0, rec.estimatedCost) : undefined,
        estimatedHours: rec.estimatedHours ? Math.max(1, rec.estimatedHours) : undefined,
        tags: rec.tags || [],
        dependencies: rec.dependencies || [],
      };

      // Enhance based on context
      if (context.issues && context.issues.length > 0) {
        const highHeatIssues = context.issues.filter((issue) => issue.heatmapScore > 70);
        if (highHeatIssues.length > 0) {
          validated.priority = Math.min(10, validated.priority + 1);
          validated.tags.push('high-impact');
        }
      }

      // Add industry-specific tags
      if (context.organizationContext?.industry) {
        validated.tags.push(context.organizationContext.industry);
      }

      return validated;
    });
  }

  /**
   * Generate task recommendations for a given solution
   */
  async generateTaskRecommendations(
    solution: {
      id: string;
      title: string;
      description: string;
      type: SolutionType;
    },
    maxTasks: number = 8
  ): Promise<
    Array<{
      title: string;
      description: string;
      estimatedHours: number;
      priority: number;
      dependencies: string[];
      tags: string[];
      confidence: number;
      reasoning: string;
    }>
  > {
    try {
      if (!openAIService.isConfigured()) {
        throw new Error('OpenAI service not configured');
      }

      const prompt = `You are a project management expert. Break down this solution into specific, actionable tasks:

## SOLUTION DETAILS
**Title**: ${solution.title}
**Description**: ${solution.description}
**Type**: ${solution.type}

## TASK REQUIREMENTS
Generate ${maxTasks} tasks that:
1. Are specific and actionable
2. Have clear deliverables
3. Can be assigned to team members
4. Include proper sequencing/dependencies
5. Are sized appropriately (1-40 hours each)

## RESPONSE FORMAT
Return a valid JSON array:

[
  {
    "title": "Task title (60 chars max)",
    "description": "Specific task description with clear deliverables",
    "estimatedHours": 1-40,
    "priority": 1-10,
    "dependencies": ["task that must complete first"],
    "tags": ["skill", "department", "phase"],
    "confidence": 1-100,
    "reasoning": "Why this task is necessary and properly sized"
  }
]

Order tasks by logical sequence and dependencies.`;

      const response = await openAIService.generateCompletion(prompt, {
        model: 'gpt-3.5-turbo',
        maxTokens: 1500,
        temperature: 0.6,
      });

      if (!response) {
        throw new Error('No response from OpenAI for task generation');
      }

      // Parse and validate task recommendations
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in task response');
      }

      const tasks = JSON.parse(jsonMatch[0]);

      return tasks.map((task: any) => ({
        ...task,
        estimatedHours: Math.max(1, Math.min(40, task.estimatedHours || 4)),
        priority: Math.max(1, Math.min(10, task.priority || 5)),
        confidence: Math.max(1, Math.min(100, task.confidence || 80)),
        dependencies: task.dependencies || [],
        tags: task.tags || [],
      }));
    } catch (error) {
      console.error('❌ Error generating task recommendations:', error);
      throw new Error(
        `Failed to generate task recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Analyze solution effectiveness and suggest improvements
   */
  async analyzeSolutionEffectiveness(solutionId: string): Promise<{
    effectivenessScore: number;
    insights: string[];
    recommendations: string[];
    confidence: number;
  }> {
    try {
      // Get solution data with tasks and progress
      const solution = await prisma.initiativeSolution.findUnique({
        where: { id: solutionId },
        include: {
          tasks: true,
          initiative: {
            include: {
              addressedIssues: true,
            },
          },
        },
      });

      if (!solution) {
        throw new Error('Solution not found');
      }

      // Calculate metrics
      const completedTasks = solution.tasks.filter((t) => t.status === 'COMPLETED').length;
      const totalTasks = solution.tasks.length;
      const progressScore = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      const overdueTasks = solution.tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED'
      ).length;

      const insights = [];
      const recommendations = [];

      if (progressScore < 50) {
        insights.push('Solution progress is below expected pace');
        recommendations.push('Review task assignments and remove blockers');
      }

      if (overdueTasks > 0) {
        insights.push(`${overdueTasks} tasks are overdue`);
        recommendations.push('Reassess timelines and resource allocation');
      }

      const effectivenessScore = Math.max(
        0,
        Math.min(100, progressScore - overdueTasks * 10 + (solution.progress || 0))
      );

      return {
        effectivenessScore,
        insights,
        recommendations,
        confidence: 85,
      };
    } catch (error) {
      console.error('❌ Error analyzing solution effectiveness:', error);
      throw new Error(
        `Failed to analyze solution effectiveness: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

// Export singleton instance
export const aiSolutionEngine = AISolutionEngine.getInstance();
