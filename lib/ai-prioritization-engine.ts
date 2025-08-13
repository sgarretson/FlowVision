import { openAIService } from './openai';
import { prisma } from './prisma';

export interface PrioritizationCriteria {
  businessImpact: number; // 1-10
  urgency: number; // 1-10
  resourceAvailability: number; // 1-10
  riskMitigation: number; // 1-10
  strategicAlignment: number; // 1-10
  customCriteria?: { [key: string]: number };
}

export interface InitiativePriorityScore {
  initiativeId: string;
  currentPriority: number;
  aiRecommendedPriority: number;
  confidenceScore: number;
  reasoningFactors: {
    factor: string;
    weight: number;
    score: number;
    reasoning: string;
  }[];
  overallReasoning: string;
  suggestedActions: string[];
  comparisonNotes?: string;
}

export interface PrioritizationContext {
  organizationGoals: string[];
  currentQuarter: string;
  availableResources: {
    budget: number;
    teamCapacity: number;
    timeline: number;
  };
  strategicThemes: string[];
  riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class AIPrioritizationEngine {
  private static instance: AIPrioritizationEngine;

  public static getInstance(): AIPrioritizationEngine {
    if (!AIPrioritizationEngine.instance) {
      AIPrioritizationEngine.instance = new AIPrioritizationEngine();
    }
    return AIPrioritizationEngine.instance;
  }

  /**
   * Analyze and re-prioritize initiatives using AI
   */
  async reprioritizeInitiatives(
    context: PrioritizationContext,
    initiativeIds?: string[]
  ): Promise<InitiativePriorityScore[]> {
    try {
      // Get initiatives with comprehensive data
      const initiatives = await this.getInitiativesWithContext(initiativeIds);

      if (initiatives.length === 0) {
        return [];
      }

      // Generate AI-powered priority recommendations
      const priorityScores: InitiativePriorityScore[] = [];

      for (const initiative of initiatives) {
        const priorityScore = await this.analyzeInitiativePriority(initiative, context);
        priorityScores.push(priorityScore);
      }

      // Sort by AI recommended priority (highest first)
      priorityScores.sort((a, b) => b.aiRecommendedPriority - a.aiRecommendedPriority);

      // Add comparative analysis
      this.addComparativeAnalysis(priorityScores);

      return priorityScores;
    } catch (error) {
      console.error('❌ Error reprioritizing initiatives:', error);
      throw new Error(
        `Failed to reprioritize initiatives: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get initiatives with comprehensive context data
   */
  private async getInitiativesWithContext(initiativeIds?: string[]) {
    const whereClause = initiativeIds ? { id: { in: initiativeIds } } : {};

    return await prisma.initiative.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            name: true,
            role: true,
          },
        },
        addressedIssues: {
          include: {
            systemImpacts: {
              include: {
                systemCategory: true,
              },
            },
          },
        },
        solutions: {
          select: {
            id: true,
            type: true,
            status: true,
            estimatedCost: true,
            estimatedHours: true,
            progress: true,
          },
        },
        milestones: {
          select: {
            status: true,
            dueDate: true,
            progress: true,
          },
        },
        requirementCards: {
          select: {
            priority: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Analyze individual initiative priority using AI
   */
  private async analyzeInitiativePriority(
    initiative: any,
    context: PrioritizationContext
  ): Promise<InitiativePriorityScore> {
    try {
      if (!openAIService.isConfigured()) {
        return this.generateFallbackPriority(initiative);
      }

      const prompt = this.buildPrioritizationPrompt(initiative, context);

      const response = await openAIService.generateCompletion(prompt, {
        model: 'gpt-3.5-turbo',
        maxTokens: 1200,
        temperature: 0.5, // More deterministic for prioritization
      });

      if (!response) {
        return this.generateFallbackPriority(initiative);
      }

      return this.parsePriorityAnalysis(response, initiative);
    } catch (error) {
      console.error('❌ Error analyzing initiative priority:', error);
      return this.generateFallbackPriority(initiative);
    }
  }

  /**
   * Build comprehensive prompt for AI prioritization
   */
  private buildPrioritizationPrompt(initiative: any, context: PrioritizationContext): string {
    const totalIssues = initiative.addressedIssues?.length || 0;
    const avgHeatScore =
      totalIssues > 0
        ? initiative.addressedIssues.reduce(
            (sum: number, issue: any) => sum + issue.heatmapScore,
            0
          ) / totalIssues
        : 0;

    const criticalSystemImpacts =
      initiative.addressedIssues?.flatMap(
        (issue: any) =>
          issue.systemImpacts?.filter((impact: any) => impact.impactLevel === 'CRITICAL') || []
      ).length || 0;

    const totalEstimatedCost =
      initiative.solutions?.reduce((sum: number, sol: any) => sum + (sol.estimatedCost || 0), 0) ||
      0;

    const completedMilestones =
      initiative.milestones?.filter((m: any) => m.status === 'COMPLETED').length || 0;
    const totalMilestones = initiative.milestones?.length || 0;

    return `You are an expert strategic advisor for architecture & engineering firms. Analyze this initiative's priority within organizational context:

## INITIATIVE DETAILS
**Title**: ${initiative.title}
**Problem**: ${initiative.problem}
**Goal**: ${initiative.goal || 'Not specified'}
**Status**: ${initiative.status}
**Current Priority**: ${initiative.priorityScore}/100
**ROI**: ${initiative.roi}%
**Difficulty**: ${initiative.difficulty}/100

## ISSUE CONTEXT
**Issues Addressed**: ${totalIssues} issues
**Average Heat Score**: ${Math.round(avgHeatScore)}/100
**Critical System Impacts**: ${criticalSystemImpacts}

## PROGRESS & RESOURCES
**Solutions Planned**: ${initiative.solutions?.length || 0}
**Estimated Cost**: $${totalEstimatedCost.toLocaleString()}
**Milestone Progress**: ${completedMilestones}/${totalMilestones}
**Assigned Owner**: ${initiative.owner?.name} (${initiative.owner?.role})

## ORGANIZATIONAL CONTEXT
**Goals**: ${context.organizationGoals.join(', ')}
**Current Quarter**: ${context.currentQuarter}
**Available Budget**: $${context.availableResources.budget.toLocaleString()}
**Team Capacity**: ${context.availableResources.teamCapacity}%
**Strategic Themes**: ${context.strategicThemes.join(', ')}
**Risk Tolerance**: ${context.riskTolerance}

## PRIORITIZATION ANALYSIS
Consider these factors for A&E firms:
1. **Client Impact**: How does this affect client satisfaction and project delivery?
2. **Revenue Protection**: Does this protect or enhance revenue streams?
3. **Operational Efficiency**: Will this improve day-to-day operations?
4. **Risk Mitigation**: Does this address critical business risks?
5. **Strategic Alignment**: How well does this support long-term goals?
6. **Resource Optimization**: Is this the best use of available resources?

## RESPONSE FORMAT
Return valid JSON:

{
  "aiRecommendedPriority": 1-100,
  "confidenceScore": 1-100,
  "reasoningFactors": [
    {
      "factor": "Factor name",
      "weight": 1-10,
      "score": 1-10,
      "reasoning": "Why this factor matters for this initiative"
    }
  ],
  "overallReasoning": "Comprehensive explanation of priority recommendation",
  "suggestedActions": [
    "Specific actionable next step 1",
    "Specific actionable next step 2"
  ]
}

Focus on business value, implementation feasibility, and strategic importance for A&E operations.`;
  }

  /**
   * Parse AI priority analysis response
   */
  private parsePriorityAnalysis(response: string, initiative: any): InitiativePriorityScore {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return this.generateFallbackPriority(initiative);
      }

      const analysis = JSON.parse(jsonMatch[0]);

      return {
        initiativeId: initiative.id,
        currentPriority: initiative.priorityScore || 50,
        aiRecommendedPriority: Math.max(1, Math.min(100, analysis.aiRecommendedPriority || 50)),
        confidenceScore: Math.max(1, Math.min(100, analysis.confidenceScore || 70)),
        reasoningFactors: (analysis.reasoningFactors || []).map((factor: any) => ({
          factor: factor.factor || 'Unknown Factor',
          weight: Math.max(1, Math.min(10, factor.weight || 5)),
          score: Math.max(1, Math.min(10, factor.score || 5)),
          reasoning: factor.reasoning || 'No reasoning provided',
        })),
        overallReasoning: analysis.overallReasoning || 'AI analysis of initiative priority',
        suggestedActions: analysis.suggestedActions || [],
        comparisonNotes: '',
      };
    } catch (error) {
      console.error('❌ Failed to parse priority analysis:', error);
      return this.generateFallbackPriority(initiative);
    }
  }

  /**
   * Generate fallback priority when AI is not available
   */
  private generateFallbackPriority(initiative: any): InitiativePriorityScore {
    const issueCount = initiative.addressedIssues?.length || 0;
    const avgHeatScore =
      issueCount > 0
        ? initiative.addressedIssues.reduce(
            (sum: number, issue: any) => sum + issue.heatmapScore,
            0
          ) / issueCount
        : 0;

    const fallbackPriority = Math.min(
      100,
      Math.max(
        1,
        (initiative.roi || 50) * 0.4 +
          avgHeatScore * 0.3 +
          (100 - (initiative.difficulty || 50)) * 0.3
      )
    );

    return {
      initiativeId: initiative.id,
      currentPriority: initiative.priorityScore || 50,
      aiRecommendedPriority: Math.round(fallbackPriority),
      confidenceScore: 60,
      reasoningFactors: [
        {
          factor: 'ROI Potential',
          weight: 8,
          score: Math.round((initiative.roi || 50) / 10),
          reasoning: 'Return on investment consideration',
        },
        {
          factor: 'Issue Severity',
          weight: 7,
          score: Math.round(avgHeatScore / 10),
          reasoning: 'Average heat score of addressed issues',
        },
        {
          factor: 'Implementation Feasibility',
          weight: 6,
          score: Math.round((100 - (initiative.difficulty || 50)) / 10),
          reasoning: 'Inverse of implementation difficulty',
        },
      ],
      overallReasoning:
        'Fallback priority calculation based on ROI, issue severity, and feasibility',
      suggestedActions: [
        'Review initiative scope and requirements',
        'Validate resource allocation and timeline',
      ],
      comparisonNotes: '',
    };
  }

  /**
   * Add comparative analysis between initiatives
   */
  private addComparativeAnalysis(priorityScores: InitiativePriorityScore[]) {
    priorityScores.forEach((score, index) => {
      if (index === 0) {
        score.comparisonNotes = 'Highest recommended priority - should be top focus';
      } else if (index === priorityScores.length - 1) {
        score.comparisonNotes = 'Lowest recommended priority - consider deferring';
      } else {
        const percentile = Math.round((1 - index / (priorityScores.length - 1)) * 100);
        score.comparisonNotes = `${percentile}th percentile priority among analyzed initiatives`;
      }
    });
  }

  /**
   * Apply AI-recommended priorities to initiatives
   */
  async applyRecommendedPriorities(
    priorityScores: InitiativePriorityScore[],
    userId: string
  ): Promise<{ updated: number; errors: string[] }> {
    const errors: string[] = [];
    let updated = 0;

    for (const score of priorityScores) {
      try {
        await prisma.initiative.update({
          where: { id: score.initiativeId },
          data: {
            priorityScore: score.aiRecommendedPriority,
            // Store AI reasoning in a comment or field if needed
          },
        });
        updated++;
      } catch (error) {
        errors.push(
          `Failed to update initiative ${score.initiativeId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Log the bulk update
    await prisma.auditLog.create({
      data: {
        action: 'AI_PRIORITY_UPDATE',
        userId,
        details: {
          updatedCount: updated,
          errorCount: errors.length,
          totalProcessed: priorityScores.length,
        },
      },
    });

    return { updated, errors };
  }
}

// Export singleton instance
export const aiPrioritizationEngine = AIPrioritizationEngine.getInstance();
