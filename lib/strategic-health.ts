/**
 * Strategic Health Score Calculation
 * Calculates organization-wide health metrics for executive dashboard
 */

import { prisma } from '@/lib/prisma';

export interface StrategicHealthMetrics {
  overallScore: number;
  indicators: {
    initiativeVelocity: number;
    issueResolution: number;
    businessImpact: number;
    aiEfficiency: number;
    resourceUtilization: number;
  };
  trends: {
    direction: 'up' | 'down' | 'stable';
    changePercent: number;
    timeframe: string;
  };
  insights: string[];
  recommendations: string[];
}

export interface BusinessImpactSummary {
  monthlyValue: number;
  yearToDateValue: number;
  projectedAnnualValue: number;
  costSavings: number;
  productivityGains: number;
  riskReduction: number;
}

export interface CriticalAlert {
  id: string;
  type: 'issue' | 'initiative' | 'system' | 'performance';
  severity: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  actionRequired: string;
  department?: string;
  deadline?: Date;
  estimatedImpact: string;
}

export interface InitiativeProgress {
  totalInitiatives: number;
  onTrackCount: number;
  atRiskCount: number;
  overDueCount: number;
  completionRate: number;
  avgProgress: number;
  keyMilestones: {
    upcoming: number;
    overdue: number;
  };
}

/**
 * Calculate Strategic Health Score (0-100)
 * Weighted average of key organizational health indicators
 */
export async function calculateStrategicHealth(): Promise<StrategicHealthMetrics> {
  try {
    // Get current data
    const [initiatives, issues, auditLogs, thirtyDaysAgo] = await Promise.all([
      prisma.initiative.findMany({
        include: {
          owner: { select: { id: true, name: true } },
          solutions: true,
        },
      }),
      prisma.issue.findMany({
        include: {
          initiatives: { select: { id: true, status: true } },
        },
      }),
      prisma.auditLog.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    ]);

    // Calculate individual indicators
    const initiativeVelocity = calculateInitiativeVelocity(initiatives);
    const issueResolution = calculateIssueResolution(issues);
    const businessImpact = calculateBusinessImpactScore(initiatives);
    const aiEfficiency = calculateAIEfficiency(auditLogs, issues, initiatives);
    const resourceUtilization = calculateResourceUtilization(initiatives);

    // Weighted overall score
    const weights = {
      initiativeVelocity: 0.25,
      issueResolution: 0.2,
      businessImpact: 0.25,
      aiEfficiency: 0.15,
      resourceUtilization: 0.15,
    };

    const overallScore = Math.round(
      initiativeVelocity * weights.initiativeVelocity +
        issueResolution * weights.issueResolution +
        businessImpact * weights.businessImpact +
        aiEfficiency * weights.aiEfficiency +
        resourceUtilization * weights.resourceUtilization
    );

    // Generate insights and recommendations
    const insights = generateHealthInsights({
      overallScore,
      initiativeVelocity,
      issueResolution,
      businessImpact,
      aiEfficiency,
      resourceUtilization,
    });

    const recommendations = generateHealthRecommendations({
      overallScore,
      initiativeVelocity,
      issueResolution,
      businessImpact,
      aiEfficiency,
      resourceUtilization,
    });

    // Calculate trends (simplified for MVP)
    const direction: 'up' | 'down' | 'stable' =
      overallScore >= 75 ? 'up' : overallScore >= 60 ? 'stable' : 'down';
    const trends = {
      direction,
      changePercent: Math.round((overallScore - 70) * 0.1), // Simulated trend
      timeframe: '30 days',
    };

    return {
      overallScore,
      indicators: {
        initiativeVelocity,
        issueResolution,
        businessImpact,
        aiEfficiency,
        resourceUtilization,
      },
      trends,
      insights,
      recommendations,
    };
  } catch (error) {
    console.error('Failed to calculate strategic health:', error);
    throw new Error('Strategic health calculation failed');
  }
}

/**
 * Calculate Business Impact Summary
 */
export async function calculateBusinessImpact(): Promise<BusinessImpactSummary> {
  try {
    const initiatives = await prisma.initiative.findMany({
      where: {
        roi: { not: null },
        budget: { not: null },
      },
    });

    // Calculate estimated values based on ROI and budget
    const monthlyValue = initiatives.reduce((sum, init) => {
      const roi = init.roi || 0;
      const budget = init.budget || 0;
      const monthlyROI = (budget * (roi / 100)) / 12;
      return sum + monthlyROI;
    }, 0);

    const yearToDateValue = monthlyValue * 12; // Simplified for MVP
    const projectedAnnualValue = monthlyValue * 12;

    // Categorize impact types
    const costSavings = monthlyValue * 0.4; // 40% cost savings
    const productivityGains = monthlyValue * 0.4; // 40% productivity
    const riskReduction = monthlyValue * 0.2; // 20% risk reduction

    return {
      monthlyValue: Math.round(monthlyValue),
      yearToDateValue: Math.round(yearToDateValue),
      projectedAnnualValue: Math.round(projectedAnnualValue),
      costSavings: Math.round(costSavings),
      productivityGains: Math.round(productivityGains),
      riskReduction: Math.round(riskReduction),
    };
  } catch (error) {
    console.error('Failed to calculate business impact:', error);
    throw new Error('Business impact calculation failed');
  }
}

/**
 * Get Critical Alerts requiring executive attention
 */
export async function getCriticalAlerts(): Promise<CriticalAlert[]> {
  try {
    const alerts: CriticalAlert[] = [];

    // Get critical issues
    const criticalIssues = await prisma.issue.findMany({
      where: {
        heatmapScore: { gte: 80 },
        votes: { gte: 10 },
      },
      orderBy: { heatmapScore: 'desc' },
      take: 3,
    });

    criticalIssues.forEach((issue) => {
      alerts.push({
        id: issue.id,
        type: 'issue',
        severity: 'critical',
        title: `Critical Issue: ${issue.department || 'Unknown Department'}`,
        description: issue.description.substring(0, 100) + '...',
        actionRequired: 'Review and assign to initiative',
        department: issue.department || undefined,
        estimatedImpact: 'High organizational impact',
      });
    });

    // Get overdue initiatives
    const overdueInitiatives = await prisma.initiative.findMany({
      where: {
        timelineEnd: { lt: new Date() },
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      include: {
        owner: { select: { name: true } },
      },
      take: 2,
    });

    overdueInitiatives.forEach((initiative) => {
      alerts.push({
        id: initiative.id,
        type: 'initiative',
        severity: 'high',
        title: `Overdue Initiative: ${initiative.title}`,
        description: `Initiative is past deadline and requires attention`,
        actionRequired: 'Review timeline and resource allocation',
        deadline: initiative.timelineEnd || undefined,
        estimatedImpact: 'Medium to high business impact',
      });
    });

    return alerts.slice(0, 5); // Limit to top 5 alerts
  } catch (error) {
    console.error('Failed to get critical alerts:', error);
    return [];
  }
}

/**
 * Calculate Initiative Progress Summary
 */
export async function getInitiativeProgress(): Promise<InitiativeProgress> {
  try {
    const initiatives = await prisma.initiative.findMany({
      include: {
        milestones: true,
      },
    });

    const totalInitiatives = initiatives.length;
    const onTrackCount = initiatives.filter(
      (i) => i.progress >= 70 && (!i.timelineEnd || i.timelineEnd > new Date())
    ).length;

    const atRiskCount = initiatives.filter(
      (i) => i.progress < 70 && i.progress > 30 && i.status === 'ACTIVE'
    ).length;

    const overDueCount = initiatives.filter(
      (i) => i.timelineEnd && i.timelineEnd < new Date() && i.status !== 'COMPLETED'
    ).length;

    const completedCount = initiatives.filter((i) => i.status === 'COMPLETED').length;
    const completionRate = totalInitiatives > 0 ? (completedCount / totalInitiatives) * 100 : 0;

    const avgProgress =
      totalInitiatives > 0
        ? initiatives.reduce((sum, i) => sum + i.progress, 0) / totalInitiatives
        : 0;

    // Calculate milestone metrics
    const allMilestones = initiatives.flatMap((i) => i.milestones);
    const upcomingMilestones = allMilestones.filter(
      (m) =>
        m.dueDate &&
        m.dueDate > new Date() &&
        m.dueDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ).length;

    const overdueMilestones = allMilestones.filter(
      (m) => m.dueDate && m.dueDate < new Date() && m.status !== 'COMPLETED'
    ).length;

    return {
      totalInitiatives,
      onTrackCount,
      atRiskCount,
      overDueCount,
      completionRate: Math.round(completionRate),
      avgProgress: Math.round(avgProgress),
      keyMilestones: {
        upcoming: upcomingMilestones,
        overdue: overdueMilestones,
      },
    };
  } catch (error) {
    console.error('Failed to calculate initiative progress:', error);
    throw new Error('Initiative progress calculation failed');
  }
}

// Helper functions for health score calculation
function calculateInitiativeVelocity(initiatives: any[]): number {
  if (initiatives.length === 0) return 50;

  const activeInitiatives = initiatives.filter((i) => i.status === 'ACTIVE');
  const avgProgress =
    activeInitiatives.length > 0
      ? activeInitiatives.reduce((sum, i) => sum + i.progress, 0) / activeInitiatives.length
      : 0;

  // Score based on average progress and initiative count
  const progressScore = Math.min(avgProgress, 100);
  const velocityBonus = Math.min(activeInitiatives.length * 5, 20);

  return Math.min(progressScore + velocityBonus, 100);
}

function calculateIssueResolution(issues: any[]): number {
  if (issues.length === 0) return 80;

  const highVoteIssues = issues.filter((i) => i.votes >= 5);
  const addressedIssues = issues.filter((i) => i.addressedIssues?.length > 0);

  const resolutionRate = issues.length > 0 ? (addressedIssues.length / issues.length) * 100 : 0;
  const qualityScore = highVoteIssues.length <= issues.length * 0.3 ? 80 : 60;

  return Math.min((resolutionRate + qualityScore) / 2, 100);
}

function calculateBusinessImpactScore(initiatives: any[]): number {
  if (initiatives.length === 0) return 50;

  const initiativesWithROI = initiatives.filter((i) => i.roi && i.roi > 0);
  const avgROI =
    initiativesWithROI.length > 0
      ? initiativesWithROI.reduce((sum, i) => sum + (i.roi || 0), 0) / initiativesWithROI.length
      : 0;

  // Score based on ROI and coverage
  const roiScore = Math.min(avgROI, 100);
  const coverageBonus = (initiativesWithROI.length / initiatives.length) * 20;

  return Math.min(roiScore + coverageBonus, 100);
}

function calculateAIEfficiency(auditLogs: any[], issues: any[], initiatives: any[]): number {
  const aiOperations = auditLogs.filter((log) => log.action?.startsWith('AI_'));
  const issuesWithAI = issues.filter((i) => i.aiSummary);
  const initiativesWithAI = initiatives.filter((i) => i.aiAnalysisContext);

  const totalItems = issues.length + initiatives.length;
  const aiCoverage =
    totalItems > 0 ? ((issuesWithAI.length + initiativesWithAI.length) / totalItems) * 100 : 0;
  const activityScore = Math.min(aiOperations.length * 2, 40);

  return Math.min(aiCoverage + activityScore, 100);
}

function calculateResourceUtilization(initiatives: any[]): number {
  const initiativesWithBudget = initiatives.filter((i) => i.budget && i.estimatedHours);

  if (initiativesWithBudget.length === 0) return 70;

  const utilizationScores = initiativesWithBudget.map((i) => {
    const efficiency =
      i.actualHours && i.estimatedHours
        ? Math.min((i.estimatedHours / i.actualHours) * 100, 100)
        : 80; // Default score if no actual hours tracked
    return efficiency;
  });

  return utilizationScores.length > 0
    ? utilizationScores.reduce((sum, score) => sum + score, 0) / utilizationScores.length
    : 70;
}

function generateHealthInsights(metrics: any): string[] {
  const insights: string[] = [];

  if (metrics.overallScore >= 85) {
    insights.push('Organization is performing excellently across all strategic dimensions');
  } else if (metrics.overallScore >= 70) {
    insights.push('Organization shows strong performance with some areas for optimization');
  } else {
    insights.push('Organization requires focused attention to improve strategic outcomes');
  }

  if (metrics.initiativeVelocity < 60) {
    insights.push('Initiative velocity is below optimal - consider resource reallocation');
  }

  if (metrics.issueResolution < 70) {
    insights.push(
      'Issue resolution rate needs improvement - focus on addressing high-priority items'
    );
  }

  if (metrics.aiEfficiency > 80) {
    insights.push('AI utilization is driving significant operational efficiency gains');
  }

  return insights;
}

function generateHealthRecommendations(metrics: any): string[] {
  const recommendations: string[] = [];

  if (metrics.businessImpact < 70) {
    recommendations.push('Review initiative ROI calculations and focus on high-impact projects');
  }

  if (metrics.resourceUtilization < 75) {
    recommendations.push('Optimize resource allocation across active initiatives');
  }

  if (metrics.aiEfficiency < 60) {
    recommendations.push('Increase AI adoption for analysis and decision support');
  }

  if (metrics.initiativeVelocity < 70) {
    recommendations.push('Streamline initiative processes and remove blockers');
  }

  return recommendations;
}
