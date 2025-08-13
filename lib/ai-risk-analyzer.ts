import { openAIService } from './openai';
import { prisma } from './prisma';

export interface RiskPrediction {
  systemCategoryId: string;
  systemName: string;
  currentRiskScore: number;
  predictedRiskScore: number;
  riskTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
  confidence: number;
  timeframe: number; // days
  factors: RiskFactor[];
  recommendations: string[];
  reasoning: string;
}

export interface RiskFactor {
  factor: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  likelihood: number; // 0-100
  description: string;
}

export interface SystemRiskAnalysis {
  systemId: string;
  systemName: string;
  systemType: string;
  currentMetrics: {
    totalIssues: number;
    criticalIssues: number;
    averageHeatScore: number;
    trendDirection: 'UP' | 'DOWN' | 'STABLE';
    velocityChange: number; // percentage change in issue rate
  };
  historicalData: {
    issueCount: number;
    avgHeatScore: number;
    period: string; // '7d', '30d', '90d'
  }[];
  predictions: RiskPrediction[];
}

export class AIRiskAnalyzer {
  private static instance: AIRiskAnalyzer;

  public static getInstance(): AIRiskAnalyzer {
    if (!AIRiskAnalyzer.instance) {
      AIRiskAnalyzer.instance = new AIRiskAnalyzer();
    }
    return AIRiskAnalyzer.instance;
  }

  /**
   * Analyze risk trends for all systems and predict future risks
   */
  async analyzeSystemRisks(timeframeDays: number = 30): Promise<SystemRiskAnalysis[]> {
    try {
      // Get all systems with their current issues and impacts
      const systems = await prisma.systemCategory.findMany({
        include: {
          issueImpacts: {
            include: {
              issue: {
                select: {
                  id: true,
                  heatmapScore: true,
                  votes: true,
                  createdAt: true,
                  description: true,
                },
              },
            },
          },
        },
      });

      const analyses: SystemRiskAnalysis[] = [];

      for (const system of systems) {
        if (system.issueImpacts.length === 0) continue; // Skip systems with no issues

        // Calculate current metrics
        const currentMetrics = this.calculateCurrentMetrics(system);

        // Get historical data for trend analysis
        const historicalData = await this.getHistoricalData(system.id);

        // Generate AI-powered risk predictions
        const predictions = await this.generateRiskPredictions(
          system,
          currentMetrics,
          historicalData,
          timeframeDays
        );

        analyses.push({
          systemId: system.id,
          systemName: system.name,
          systemType: system.type,
          currentMetrics,
          historicalData,
          predictions,
        });
      }

      // Sort by highest predicted risk
      return analyses.sort((a, b) => {
        const maxRiskA = Math.max(...a.predictions.map((p) => p.predictedRiskScore));
        const maxRiskB = Math.max(...b.predictions.map((p) => p.predictedRiskScore));
        return maxRiskB - maxRiskA;
      });
    } catch (error) {
      console.error('❌ Error analyzing system risks:', error);
      throw new Error(
        `Failed to analyze system risks: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Calculate current risk metrics for a system
   */
  private calculateCurrentMetrics(system: any) {
    const issues = system.issueImpacts.map((impact: any) => impact.issue);
    const totalIssues = issues.length;
    const criticalIssues = system.issueImpacts.filter(
      (impact: any) => impact.impactLevel === 'CRITICAL'
    ).length;
    const averageHeatScore =
      totalIssues > 0
        ? issues.reduce((sum: number, issue: any) => sum + issue.heatmapScore, 0) / totalIssues
        : 0;

    // Calculate trend direction based on issue creation dates
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentIssues = issues.filter(
      (issue: any) => new Date(issue.createdAt) > sevenDaysAgo
    ).length;
    const olderIssues = issues.filter(
      (issue: any) =>
        new Date(issue.createdAt) > thirtyDaysAgo && new Date(issue.createdAt) <= sevenDaysAgo
    ).length;

    const velocityChange = olderIssues > 0 ? ((recentIssues - olderIssues) / olderIssues) * 100 : 0;

    let trendDirection: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
    if (velocityChange > 20) trendDirection = 'UP';
    else if (velocityChange < -20) trendDirection = 'DOWN';

    return {
      totalIssues,
      criticalIssues,
      averageHeatScore: Math.round(averageHeatScore),
      trendDirection,
      velocityChange: Math.round(velocityChange),
    };
  }

  /**
   * Get historical data for trend analysis
   */
  private async getHistoricalData(systemId: string) {
    const now = new Date();
    const periods = [
      { days: 7, label: '7d' },
      { days: 30, label: '30d' },
      { days: 90, label: '90d' },
    ];

    const historicalData = [];

    for (const period of periods) {
      const periodStart = new Date(now.getTime() - period.days * 24 * 60 * 60 * 1000);

      const impacts = await prisma.issueSystemImpact.findMany({
        where: {
          systemCategoryId: systemId,
          issue: {
            createdAt: {
              gte: periodStart,
              lte: now,
            },
          },
        },
        include: {
          issue: true,
        },
      });

      const issueCount = impacts.length;
      const avgHeatScore =
        issueCount > 0
          ? Math.round(
              impacts.reduce((sum, impact) => sum + impact.issue.heatmapScore, 0) / issueCount
            )
          : 0;

      historicalData.push({
        issueCount,
        avgHeatScore,
        period: period.label,
      });
    }

    return historicalData;
  }

  /**
   * Generate AI-powered risk predictions
   */
  private async generateRiskPredictions(
    system: any,
    currentMetrics: any,
    historicalData: any[],
    timeframeDays: number
  ): Promise<RiskPrediction[]> {
    try {
      if (!openAIService.isConfigured()) {
        return this.generateFallbackPredictions(system, currentMetrics);
      }

      const prompt = this.buildRiskPredictionPrompt(
        system,
        currentMetrics,
        historicalData,
        timeframeDays
      );

      const response = await openAIService.generateCompletion(prompt, {
        model: 'gpt-3.5-turbo',
        maxTokens: 1500,
        temperature: 0.6,
      });

      if (!response) {
        return this.generateFallbackPredictions(system, currentMetrics);
      }

      return this.parseRiskPredictions(response, system);
    } catch (error) {
      console.error('❌ Error generating AI risk predictions:', error);
      return this.generateFallbackPredictions(system, currentMetrics);
    }
  }

  /**
   * Build comprehensive prompt for risk prediction
   */
  private buildRiskPredictionPrompt(
    system: any,
    currentMetrics: any,
    historicalData: any[],
    timeframeDays: number
  ): string {
    return `You are an expert risk analyst for architecture & engineering firms. Analyze this system and predict future risks:

## SYSTEM ANALYSIS
**System**: ${system.name} (${system.type})
**Description**: ${system.description || 'No description provided'}

## CURRENT STATE
**Total Issues**: ${currentMetrics.totalIssues}
**Critical Issues**: ${currentMetrics.criticalIssues}
**Average Heat Score**: ${currentMetrics.averageHeatScore}/100
**Trend**: ${currentMetrics.trendDirection}
**Velocity Change**: ${currentMetrics.velocityChange}%

## HISTORICAL DATA
${historicalData
  .map(
    (data) => `**${data.period}**: ${data.issueCount} issues, avg heat score ${data.avgHeatScore}`
  )
  .join('\n')}

## PREDICTION REQUIREMENTS
Predict risks for the next ${timeframeDays} days considering:
1. Current issue velocity and severity trends
2. System interdependencies in A&E workflows
3. Seasonal patterns (project cycles, deadlines)
4. Industry-specific risk factors
5. Resource constraints and workload

## RESPONSE FORMAT
Return a valid JSON array with 1-3 predictions:

[
  {
    "currentRiskScore": 1-100,
    "predictedRiskScore": 1-100,
    "riskTrend": "INCREASING|STABLE|DECREASING",
    "confidence": 1-100,
    "timeframe": ${timeframeDays},
    "factors": [
      {
        "factor": "Brief factor name",
        "impact": "HIGH|MEDIUM|LOW",
        "likelihood": 1-100,
        "description": "Detailed explanation"
      }
    ],
    "recommendations": [
      "Specific actionable recommendation 1",
      "Specific actionable recommendation 2"
    ],
    "reasoning": "Detailed analysis explaining the prediction"
  }
]

Focus on practical A&E operational risks like project delays, client issues, technical problems, and resource conflicts.`;
  }

  /**
   * Parse AI risk prediction response
   */
  private parseRiskPredictions(response: string, system: any): RiskPrediction[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return this.generateFallbackPredictions(system, {
          totalIssues: 0,
          criticalIssues: 0,
          averageHeatScore: 0,
        });
      }

      const predictions = JSON.parse(jsonMatch[0]);

      return predictions.map((pred: any) => ({
        systemCategoryId: system.id,
        systemName: system.name,
        currentRiskScore: Math.max(1, Math.min(100, pred.currentRiskScore || 50)),
        predictedRiskScore: Math.max(1, Math.min(100, pred.predictedRiskScore || 50)),
        riskTrend: pred.riskTrend || 'STABLE',
        confidence: Math.max(1, Math.min(100, pred.confidence || 70)),
        timeframe: pred.timeframe || 30,
        factors: pred.factors || [],
        recommendations: pred.recommendations || [],
        reasoning: pred.reasoning || 'AI analysis of system risk patterns',
      }));
    } catch (error) {
      console.error('❌ Failed to parse risk predictions:', error);
      return this.generateFallbackPredictions(system, {
        totalIssues: 0,
        criticalIssues: 0,
        averageHeatScore: 0,
      });
    }
  }

  /**
   * Generate fallback predictions when AI is not available
   */
  private generateFallbackPredictions(system: any, currentMetrics: any): RiskPrediction[] {
    const baseRisk = Math.min(
      90,
      currentMetrics.criticalIssues * 20 + currentMetrics.averageHeatScore * 0.8
    );

    return [
      {
        systemCategoryId: system.id,
        systemName: system.name,
        currentRiskScore: Math.round(baseRisk),
        predictedRiskScore: Math.round(baseRisk + currentMetrics.velocityChange * 0.5),
        riskTrend:
          currentMetrics.velocityChange > 10
            ? 'INCREASING'
            : currentMetrics.velocityChange < -10
              ? 'DECREASING'
              : 'STABLE',
        confidence: 60,
        timeframe: 30,
        factors: [
          {
            factor: 'Issue Volume',
            impact: currentMetrics.totalIssues > 5 ? 'HIGH' : 'MEDIUM',
            likelihood: 80,
            description: 'Current issue volume and trend analysis',
          },
        ],
        recommendations: [
          'Monitor issue resolution velocity',
          'Review system dependencies and impacts',
        ],
        reasoning: 'Fallback analysis based on current metrics and trends',
      },
    ];
  }

  /**
   * Get risk alerts for high-priority systems
   */
  async getRiskAlerts(threshold: number = 75): Promise<
    Array<{
      systemId: string;
      systemName: string;
      riskScore: number;
      alertLevel: 'HIGH' | 'MEDIUM' | 'LOW';
      message: string;
      actionRequired: boolean;
    }>
  > {
    try {
      const analyses = await this.analyzeSystemRisks();
      const alerts = [];

      for (const analysis of analyses) {
        const maxRisk = Math.max(...analysis.predictions.map((p) => p.predictedRiskScore));

        if (maxRisk >= threshold) {
          alerts.push({
            systemId: analysis.systemId,
            systemName: analysis.systemName,
            riskScore: maxRisk,
            alertLevel: (maxRisk >= 90 ? 'HIGH' : maxRisk >= 75 ? 'MEDIUM' : 'LOW') as
              | 'HIGH'
              | 'MEDIUM'
              | 'LOW',
            message: `High risk predicted for ${analysis.systemName} - ${maxRisk}% risk score`,
            actionRequired: maxRisk >= 85,
          });
        }
      }

      return alerts.sort((a, b) => b.riskScore - a.riskScore);
    } catch (error) {
      console.error('❌ Error generating risk alerts:', error);
      return [];
    }
  }
}

// Export singleton instance
export const aiRiskAnalyzer = AIRiskAnalyzer.getInstance();
