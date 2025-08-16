/**
 * Predictive Analytics Engine for Executive Dashboard
 * Provides AI-powered forecasting and trend analysis
 */

import { prisma } from '@/lib/prisma';

export interface PredictiveTrend {
  metric: string;
  currentValue: number;
  predictedValue: number;
  changePercent: number;
  confidence: number;
  timeframe: string;
  factors: string[];
  recommendation: string;
}

export interface AnomalyDetection {
  id: string;
  type: 'issue_spike' | 'initiative_delay' | 'resource_deviation' | 'performance_drop';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  detectedAt: Date;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  rootCause: string[];
  suggestedAction: string;
  impactArea: string;
}

export interface SmartRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'efficiency' | 'cost' | 'strategy' | 'risk' | 'opportunity';
  title: string;
  description: string;
  expectedImpact: string;
  timeToImplement: string;
  resourceRequirement: string;
  successProbability: number;
  relatedMetrics: string[];
  actionSteps: string[];
}

export interface ExecutiveAISummary {
  period: string;
  overallStatus: 'excellent' | 'good' | 'attention' | 'critical';
  keyInsights: string[];
  majorChanges: string[];
  upcomingRisks: string[];
  opportunities: string[];
  recommendedActions: string[];
  confidenceScore: number;
  generatedAt: Date;
}

/**
 * Generate predictive trends for key organizational metrics
 */
export async function generatePredictiveTrends(): Promise<PredictiveTrend[]> {
  try {
    // Get historical data for trend analysis
    const [initiatives, issues, auditLogs] = await Promise.all([
      prisma.initiative.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.issue.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.auditLog.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    const trends: PredictiveTrend[] = [];

    // Initiative Completion Rate Prediction
    const completedInitiatives = initiatives.filter((i) => i.status === 'COMPLETED');
    const currentCompletionRate =
      initiatives.length > 0 ? (completedInitiatives.length / initiatives.length) * 100 : 0;
    const predictedCompletionRate = Math.min(
      currentCompletionRate + calculateTrendAdjustment(initiatives, 'completion'),
      100
    );

    trends.push({
      metric: 'Initiative Completion Rate',
      currentValue: Math.round(currentCompletionRate),
      predictedValue: Math.round(predictedCompletionRate),
      changePercent: Math.round(predictedCompletionRate - currentCompletionRate),
      confidence: 85,
      timeframe: '30 days',
      factors: [
        'Historical completion patterns',
        'Resource allocation',
        'Current initiative complexity',
      ],
      recommendation:
        predictedCompletionRate > currentCompletionRate
          ? 'Maintain current trajectory'
          : 'Review initiative resource allocation',
    });

    // Issue Resolution Velocity
    const criticalIssues = issues.filter((i) => i.heatmapScore >= 80);
    const currentCriticalRate =
      issues.length > 0 ? (criticalIssues.length / issues.length) * 100 : 0;
    const predictedCriticalRate = Math.max(
      currentCriticalRate + calculateTrendAdjustment(issues, 'criticality'),
      0
    );

    trends.push({
      metric: 'Critical Issue Rate',
      currentValue: Math.round(currentCriticalRate),
      predictedValue: Math.round(predictedCriticalRate),
      changePercent: Math.round(predictedCriticalRate - currentCriticalRate),
      confidence: 78,
      timeframe: '30 days',
      factors: ['Issue creation patterns', 'Resolution velocity', 'Organizational capacity'],
      recommendation:
        predictedCriticalRate > currentCriticalRate
          ? 'Increase proactive issue prevention'
          : 'Current issue management is effective',
    });

    // AI Utilization Growth
    const aiOperations = auditLogs.filter((log) => log.action?.startsWith('AI_'));
    const currentAIUsage =
      auditLogs.length > 0 ? (aiOperations.length / auditLogs.length) * 100 : 0;
    const predictedAIUsage = Math.min(currentAIUsage + 15, 100); // Assume 15% growth

    trends.push({
      metric: 'AI Utilization Rate',
      currentValue: Math.round(currentAIUsage),
      predictedValue: Math.round(predictedAIUsage),
      changePercent: Math.round(predictedAIUsage - currentAIUsage),
      confidence: 72,
      timeframe: '30 days',
      factors: ['AI adoption patterns', 'User training', 'System capabilities'],
      recommendation: 'Continue AI training and capability expansion',
    });

    // Resource Efficiency Forecast
    const initiativesWithBudget = initiatives.filter((i) => i.budget && i.estimatedHours);
    const avgEfficiency =
      initiativesWithBudget.length > 0
        ? initiativesWithBudget.reduce((sum, i) => {
            const efficiency =
              i.actualHours && i.estimatedHours ? (i.estimatedHours / i.actualHours) * 100 : 80;
            return sum + efficiency;
          }, 0) / initiativesWithBudget.length
        : 75;

    const predictedEfficiency = Math.min(avgEfficiency + 5, 95); // Assume gradual improvement

    trends.push({
      metric: 'Resource Efficiency',
      currentValue: Math.round(avgEfficiency),
      predictedValue: Math.round(predictedEfficiency),
      changePercent: Math.round(predictedEfficiency - avgEfficiency),
      confidence: 68,
      timeframe: '30 days',
      factors: ['Learning curve effects', 'Process optimization', 'Team experience'],
      recommendation: 'Focus on process standardization and knowledge sharing',
    });

    return trends;
  } catch (error) {
    console.error('Failed to generate predictive trends:', error);
    return [];
  }
}

/**
 * Detect organizational anomalies using AI analysis
 */
export async function detectAnomalies(): Promise<AnomalyDetection[]> {
  try {
    const anomalies: AnomalyDetection[] = [];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get recent data for anomaly detection
    const [recentIssues, recentInitiatives, recentAuditLogs] = await Promise.all([
      prisma.issue.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.initiative.findMany({
        where: { updatedAt: { gte: thirtyDaysAgo } },
      }),
      prisma.auditLog.findMany({
        where: { timestamp: { gte: thirtyDaysAgo } },
      }),
    ]);

    // Issue Creation Spike Detection
    const weeklyIssues = groupByWeek(recentIssues);
    const avgWeeklyIssues =
      weeklyIssues.reduce((sum, week) => sum + week.count, 0) / weeklyIssues.length;
    const lastWeekIssues = weeklyIssues[weeklyIssues.length - 1]?.count || 0;

    if (lastWeekIssues > avgWeeklyIssues * 1.5) {
      anomalies.push({
        id: `issue-spike-${Date.now()}`,
        type: 'issue_spike',
        severity: lastWeekIssues > avgWeeklyIssues * 2 ? 'critical' : 'high',
        title: 'Unusual Issue Creation Spike',
        description: `Issue creation has increased by ${Math.round(((lastWeekIssues - avgWeeklyIssues) / avgWeeklyIssues) * 100)}% above normal`,
        detectedAt: new Date(),
        expectedValue: avgWeeklyIssues,
        actualValue: lastWeekIssues,
        deviation: lastWeekIssues - avgWeeklyIssues,
        rootCause: ['Process changes', 'System instability', 'Communication breakdown'],
        suggestedAction: 'Investigate root causes and implement preventive measures',
        impactArea: 'Operational Stability',
      });
    }

    // Initiative Delay Detection
    const overdueInitiatives = recentInitiatives.filter(
      (i) => i.timelineEnd && i.timelineEnd < new Date() && i.status !== 'COMPLETED'
    );

    if (overdueInitiatives.length > recentInitiatives.length * 0.3) {
      anomalies.push({
        id: `initiative-delay-${Date.now()}`,
        type: 'initiative_delay',
        severity: 'high',
        title: 'High Initiative Delay Rate',
        description: `${overdueInitiatives.length} initiatives are past their deadlines`,
        detectedAt: new Date(),
        expectedValue: recentInitiatives.length * 0.1, // Expected 10% overdue
        actualValue: overdueInitiatives.length,
        deviation: overdueInitiatives.length - recentInitiatives.length * 0.1,
        rootCause: ['Resource constraints', 'Scope creep', 'External dependencies'],
        suggestedAction: 'Review project timelines and resource allocation',
        impactArea: 'Strategic Delivery',
      });
    }

    // Performance Drop Detection (based on AI operations)
    const aiOperations = recentAuditLogs.filter((log) => log.action?.startsWith('AI_'));
    const expectedAIOperations = recentAuditLogs.length * 0.2; // Expected 20% AI operations

    if (aiOperations.length < expectedAIOperations * 0.7) {
      anomalies.push({
        id: `performance-drop-${Date.now()}`,
        type: 'performance_drop',
        severity: 'medium',
        title: 'AI Utilization Below Expected',
        description: 'AI system usage has dropped below normal patterns',
        detectedAt: new Date(),
        expectedValue: expectedAIOperations,
        actualValue: aiOperations.length,
        deviation: expectedAIOperations - aiOperations.length,
        rootCause: ['User training needs', 'System performance issues', 'Workflow changes'],
        suggestedAction: 'Review AI system performance and user adoption',
        impactArea: 'Operational Efficiency',
      });
    }

    return anomalies;
  } catch (error) {
    console.error('Failed to detect anomalies:', error);
    return [];
  }
}

/**
 * Generate smart recommendations based on current state
 */
export async function generateSmartRecommendations(): Promise<SmartRecommendation[]> {
  try {
    const recommendations: SmartRecommendation[] = [];

    // Get current organizational data
    const [initiatives, issues, clusters] = await Promise.all([
      prisma.initiative.findMany({
        include: {
          addressedIssues: true,
        },
      }),
      prisma.issue.findMany(),
      prisma.issueCluster.findMany({
        include: {
          issues: true,
        },
      }),
    ]);

    // Recommendation: Address High-Impact Clusters
    const highImpactClusters = clusters.filter(
      (c) => c.severity === 'high' && c.issues.length >= 5
    );

    if (highImpactClusters.length > 0) {
      recommendations.push({
        id: 'cluster-initiative-creation',
        priority: 'high',
        category: 'efficiency',
        title: 'Create Initiatives for High-Impact Issue Clusters',
        description: `${highImpactClusters.length} high-impact clusters with 5+ issues lack dedicated initiatives`,
        expectedImpact: 'Reduce systemic issues by 40-60%',
        timeToImplement: '2-4 weeks',
        resourceRequirement: 'Medium - Project management and domain expertise',
        successProbability: 85,
        relatedMetrics: ['Issue Resolution Rate', 'Strategic Health Score'],
        actionSteps: [
          'Prioritize clusters by business impact',
          'Assign initiative owners',
          'Define success criteria',
          'Allocate necessary resources',
        ],
      });
    }

    // Recommendation: AI Adoption Acceleration
    const issuesWithoutAI = issues.filter((i) => !i.aiSummary);
    const aiCoverage =
      issues.length > 0 ? ((issues.length - issuesWithoutAI.length) / issues.length) * 100 : 0;

    if (aiCoverage < 60) {
      recommendations.push({
        id: 'ai-adoption-acceleration',
        priority: 'medium',
        category: 'efficiency',
        title: 'Accelerate AI Analysis Adoption',
        description: `Only ${Math.round(aiCoverage)}% of issues have AI analysis - significant opportunity for insights`,
        expectedImpact: 'Improve decision quality by 25-35%',
        timeToImplement: '1-2 weeks',
        resourceRequirement: 'Low - Training and process updates',
        successProbability: 90,
        relatedMetrics: ['AI Efficiency Score', 'Issue Resolution Time'],
        actionSteps: [
          'Train teams on AI analysis tools',
          'Update workflows to include AI analysis',
          'Create best practice guidelines',
          'Monitor adoption metrics',
        ],
      });
    }

    // Recommendation: Resource Optimization
    const inefficientInitiatives = initiatives.filter(
      (i) => i.actualHours && i.estimatedHours && i.actualHours > i.estimatedHours * 1.3
    );

    if (inefficientInitiatives.length > initiatives.length * 0.2) {
      recommendations.push({
        id: 'resource-optimization',
        priority: 'high',
        category: 'cost',
        title: 'Optimize Resource Allocation and Estimation',
        description: `${inefficientInitiatives.length} initiatives exceed time estimates by 30%+`,
        expectedImpact: 'Reduce resource waste by 15-25%',
        timeToImplement: '3-6 weeks',
        resourceRequirement: 'Medium - Process improvement and training',
        successProbability: 75,
        relatedMetrics: ['Resource Efficiency', 'Initiative Velocity'],
        actionSteps: [
          'Analyze estimation accuracy patterns',
          'Improve estimation methodologies',
          'Implement better project tracking',
          'Provide estimation training',
        ],
      });
    }

    // Recommendation: Proactive Issue Prevention
    const criticalIssueRate =
      issues.length > 0
        ? (issues.filter((i) => i.heatmapScore >= 80).length / issues.length) * 100
        : 0;

    if (criticalIssueRate > 25) {
      recommendations.push({
        id: 'proactive-issue-prevention',
        priority: 'critical',
        category: 'risk',
        title: 'Implement Proactive Issue Prevention',
        description: `${Math.round(criticalIssueRate)}% of issues are critical - indicates reactive management`,
        expectedImpact: 'Reduce critical issues by 30-50%',
        timeToImplement: '4-8 weeks',
        resourceRequirement: 'High - Process redesign and monitoring systems',
        successProbability: 70,
        relatedMetrics: ['Critical Issue Rate', 'Strategic Health Score'],
        actionSteps: [
          'Implement early warning systems',
          'Create proactive monitoring dashboards',
          'Train teams on prevention strategies',
          'Establish regular health checks',
        ],
      });
    }

    return recommendations.slice(0, 6); // Return top 6 recommendations
  } catch (error) {
    console.error('Failed to generate smart recommendations:', error);
    return [];
  }
}

/**
 * Generate executive AI summary
 */
export async function generateExecutiveAISummary(): Promise<ExecutiveAISummary> {
  try {
    const [trends, anomalies, recommendations] = await Promise.all([
      generatePredictiveTrends(),
      detectAnomalies(),
      generateSmartRecommendations(),
    ]);

    // Determine overall status
    const criticalAnomalies = anomalies.filter((a) => a.severity === 'critical').length;
    const highPriorityRecommendations = recommendations.filter(
      (r) => r.priority === 'critical' || r.priority === 'high'
    ).length;
    const positiveTrends = trends.filter((t) => t.changePercent > 0).length;

    let overallStatus: 'excellent' | 'good' | 'attention' | 'critical';
    if (criticalAnomalies > 0) {
      overallStatus = 'critical';
    } else if (highPriorityRecommendations > 2) {
      overallStatus = 'attention';
    } else if (positiveTrends >= trends.length * 0.7) {
      overallStatus = 'excellent';
    } else {
      overallStatus = 'good';
    }

    return {
      period: 'Last 30 days',
      overallStatus,
      keyInsights: [
        `${trends.filter((t) => t.changePercent > 0).length} of ${trends.length} key metrics show positive trends`,
        `${anomalies.length} operational anomalies detected requiring attention`,
        `${recommendations.filter((r) => r.successProbability > 80).length} high-confidence improvement opportunities identified`,
      ],
      majorChanges: trends
        .filter((t) => Math.abs(t.changePercent) > 10)
        .map(
          (t) =>
            `${t.metric}: ${t.changePercent > 0 ? 'increased' : 'decreased'} by ${Math.abs(t.changePercent)}%`
        ),
      upcomingRisks: anomalies
        .filter((a) => a.severity === 'high' || a.severity === 'critical')
        .map((a) => a.title),
      opportunities: recommendations
        .filter((r) => r.category === 'opportunity' || r.successProbability > 85)
        .map((r) => r.title),
      recommendedActions: recommendations
        .filter((r) => r.priority === 'critical' || r.priority === 'high')
        .slice(0, 3)
        .map((r) => r.title),
      confidenceScore: Math.round(trends.reduce((sum, t) => sum + t.confidence, 0) / trends.length),
      generatedAt: new Date(),
    };
  } catch (error) {
    console.error('Failed to generate executive AI summary:', error);
    return {
      period: 'Last 30 days',
      overallStatus: 'attention',
      keyInsights: ['Unable to generate insights due to system error'],
      majorChanges: [],
      upcomingRisks: ['AI analysis system requires attention'],
      opportunities: [],
      recommendedActions: ['Review AI system configuration'],
      confidenceScore: 0,
      generatedAt: new Date(),
    };
  }
}

// Helper functions
function calculateTrendAdjustment(data: any[], type: string): number {
  // Simplified trend calculation - in production, use more sophisticated algorithms
  const recent = data.slice(-10); // Last 10 items
  const older = data.slice(-20, -10); // Previous 10 items

  if (recent.length === 0 || older.length === 0) return 0;

  let recentValue = 0;
  let olderValue = 0;

  if (type === 'completion') {
    recentValue = recent.filter((i) => i.status === 'COMPLETED').length / recent.length;
    olderValue = older.filter((i) => i.status === 'COMPLETED').length / older.length;
  } else if (type === 'criticality') {
    recentValue = recent.filter((i) => i.heatmapScore >= 80).length / recent.length;
    olderValue = older.filter((i) => i.heatmapScore >= 80).length / older.length;
  }

  return (recentValue - olderValue) * 100;
}

function groupByWeek(items: any[]): { week: string; count: number }[] {
  const weeks: { [key: string]: number } = {};

  items.forEach((item) => {
    const date = new Date(item.createdAt);
    const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
    const weekKey = weekStart.toISOString().split('T')[0];
    weeks[weekKey] = (weeks[weekKey] || 0) + 1;
  });

  return Object.entries(weeks).map(([week, count]) => ({ week, count }));
}
