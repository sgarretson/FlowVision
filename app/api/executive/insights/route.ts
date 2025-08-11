import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { openAIService } from '@/lib/openai';

const prisma = new PrismaClient();

interface ExecutiveInsight {
  id: string;
  type: 'strategic' | 'operational' | 'financial' | 'risk';
  title: string;
  summary: string;
  impact: 'high' | 'medium' | 'low';
  actionRequired: boolean;
  recommendation: string;
  confidence: number; // 0-100%
  relatedData: any[];
  generatedAt: Date;
}

interface WeeklySummary {
  weekOf: Date;
  executiveSummary: string;
  keyAchievements: string[];
  criticalConcerns: string[];
  recommendedActions: string[];
  nextWeekFocus: string[];
  performanceMetrics: {
    initiativeVelocity: number;
    issueResolutionRate: number;
    teamUtilization: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

/**
 * AI-Powered Executive Insights and Auto-Generated Summaries
 * Provides strategic intelligence and actionable recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'insights'; // 'insights' or 'summary'
    
    if (type === 'summary') {
      const weeklySummary = await generateWeeklySummary();
      return NextResponse.json(weeklySummary);
    } else {
      const insights = await generateExecutiveInsights();
      return NextResponse.json({
        insights: insights.slice(0, 8), // Top 8 insights
        totalCount: insights.length,
        lastUpdated: new Date()
      });
    }

  } catch (error) {
    console.error('Executive insights error:', error);
    return NextResponse.json(
      { error: 'Failed to generate executive insights' },
      { status: 500 }
    );
  }
}

async function generateExecutiveInsights(): Promise<ExecutiveInsight[]> {
  const insights: ExecutiveInsight[] = [];
  
  // Gather comprehensive data for analysis
  const [initiatives, issues, clusters, recentActivity] = await Promise.all([
    prisma.initiative.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        progress: true,
        timelineEnd: true,
        updatedAt: true,
        budget: true,
        roi: true,
        ownerId: true,
        owner: { select: { name: true } }
      }
    }),
    prisma.issue.findMany({
      select: {
        id: true,
        description: true,
        createdAt: true,
        heatmapScore: true,
        cluster: { select: { name: true, severity: true } }
      }
    }),
    prisma.issueCluster.findMany({
      select: {
        id: true,
        name: true,
        severity: true,
        issues: { select: { id: true, heatmapScore: true, createdAt: true } },
        initiatives: { select: { id: true, status: true, progress: true, title: true } }
      }
    }),
    prisma.auditLog.findMany({
      where: {
        timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      orderBy: { timestamp: 'desc' },
      take: 50
    })
  ]);

  // 1. Strategic Insights
  insights.push(...await generateStrategicInsights(initiatives, issues, clusters));
  
  // 2. Operational Insights
  insights.push(...await generateOperationalInsights(initiatives, issues, recentActivity));
  
  // 3. Financial Insights
  insights.push(...await generateFinancialInsights(initiatives));
  
  // 4. Risk Insights
  insights.push(...await generateRiskInsights(initiatives, issues, clusters));
  
  // Sort by impact and confidence
  insights.sort((a, b) => {
    const impactScore = { high: 3, medium: 2, low: 1 };
    const aScore = impactScore[a.impact] * (a.confidence / 100);
    const bScore = impactScore[b.impact] * (b.confidence / 100);
    return bScore - aScore;
  });
  
  return insights;
}

async function generateStrategicInsights(initiatives: any[], issues: any[], clusters: any[]): Promise<ExecutiveInsight[]> {
  const insights: ExecutiveInsight[] = [];
  const now = new Date();
  
  // Initiative Portfolio Analysis
  const activeInitiatives = initiatives.filter(i => ['APPROVED', 'ACTIVE'].includes(i.status));
  const completedInitiatives = initiatives.filter(i => i.status === 'COMPLETED');
  
  // Insight: Portfolio Balance
  if (activeInitiatives.length > completedInitiatives.length * 1.5) {
    insights.push({
      id: 'strategic-portfolio-balance',
      type: 'strategic',
      title: 'Initiative Portfolio Imbalance',
      summary: `${activeInitiatives.length} active initiatives vs ${completedInitiatives.length} completed - potential resource dilution`,
      impact: 'medium',
      actionRequired: true,
      recommendation: 'Consider consolidating or prioritizing active initiatives to improve completion velocity',
      confidence: 85,
      relatedData: [{ activeCount: activeInitiatives.length, completedCount: completedInitiatives.length }],
      generatedAt: now
    });
  }
  
  // Insight: Issue Cluster Prioritization
  const highImpactClusters = clusters.filter(c => c.severity === 'high' && c.issues.length > 3);
  if (highImpactClusters.length > 0) {
    insights.push({
      id: 'strategic-cluster-priority',
      type: 'strategic',
      title: 'Strategic Issue Clusters Identified',
      summary: `${highImpactClusters.length} high-impact issue clusters require strategic initiatives`,
      impact: 'high',
      actionRequired: true,
      recommendation: 'Create dedicated initiatives to address top issue clusters systematically',
      confidence: 90,
      relatedData: highImpactClusters.map(c => ({ name: c.name, issueCount: c.issues.length })),
      generatedAt: now
    });
  }
  
  return insights;
}

async function generateOperationalInsights(initiatives: any[], issues: any[], recentActivity: any[]): Promise<ExecutiveInsight[]> {
  const insights: ExecutiveInsight[] = [];
  const now = new Date();
  
  // Team Velocity Analysis
  const recentCompletions = initiatives.filter(i => {
    return i.status === 'COMPLETED' && 
           i.updatedAt && 
           (now.getTime() - new Date(i.updatedAt).getTime()) < (30 * 24 * 60 * 60 * 1000);
  });
  
  if (recentCompletions.length > 2) {
    insights.push({
      id: 'operational-velocity-positive',
      type: 'operational',
      title: 'Strong Initiative Completion Velocity',
      summary: `${recentCompletions.length} initiatives completed in the last 30 days`,
      impact: 'medium',
      actionRequired: false,
      recommendation: 'Maintain current execution momentum and document successful patterns',
      confidence: 95,
      relatedData: recentCompletions.map(i => ({ title: i.title, completedDate: i.updatedAt })),
      generatedAt: now
    });
  } else if (recentCompletions.length === 0) {
    insights.push({
      id: 'operational-velocity-concern',
      type: 'operational',
      title: 'Low Initiative Completion Rate',
      summary: 'No initiatives completed in the last 30 days',
      impact: 'high',
      actionRequired: true,
      recommendation: 'Review active initiatives for blockers and consider resource reallocation',
      confidence: 80,
      relatedData: [],
      generatedAt: now
    });
  }
  
  // Issue Reporting Patterns
  const recentIssues = issues.filter(i => 
    (now.getTime() - new Date(i.createdAt).getTime()) < (7 * 24 * 60 * 60 * 1000)
  );
  
  if (recentIssues.length > 5) {
    insights.push({
      id: 'operational-issue-spike',
      type: 'operational',
      title: 'Increased Issue Reporting Activity',
      summary: `${recentIssues.length} new issues reported this week`,
      impact: 'medium',
      actionRequired: true,
      recommendation: 'Investigate potential systemic issues or process changes',
      confidence: 75,
      relatedData: recentIssues.map(i => ({ description: i.description.substring(0, 100) + '...' })),
      generatedAt: now
    });
  }
  
  return insights;
}

async function generateFinancialInsights(initiatives: any[]): Promise<ExecutiveInsight[]> {
  const insights: ExecutiveInsight[] = [];
  const now = new Date();
  
  // Budget Utilization Analysis
  const initiativesWithBudget = initiatives.filter(i => i.budget && i.budget > 0);
  const totalBudget = initiativesWithBudget.reduce((sum, i) => sum + i.budget, 0);
  const completedBudget = initiativesWithBudget
    .filter(i => i.status === 'COMPLETED')
    .reduce((sum, i) => sum + i.budget, 0);
  
  if (totalBudget > 0) {
    const utilizationRate = (completedBudget / totalBudget) * 100;
    
    if (utilizationRate < 30) {
      insights.push({
        id: 'financial-low-utilization',
        type: 'financial',
        title: 'Low Budget Utilization',
        summary: `Only ${Math.round(utilizationRate)}% of allocated budget has been utilized`,
        impact: 'medium',
        actionRequired: true,
        recommendation: 'Accelerate initiative execution or reallocate budget to active priorities',
        confidence: 85,
        relatedData: [{ totalBudget, completedBudget, utilizationRate }],
        generatedAt: now
      });
    }
    
    // ROI Performance Analysis
    const completedWithRoi = initiatives.filter(i => i.status === 'COMPLETED' && i.roi);
    if (completedWithRoi.length > 0) {
      const avgRoi = completedWithRoi.reduce((sum, i) => sum + i.roi, 0) / completedWithRoi.length;
      
      if (avgRoi > 20) {
        insights.push({
          id: 'financial-strong-roi',
          type: 'financial',
          title: 'Strong ROI Performance',
          summary: `Average initiative ROI of ${Math.round(avgRoi)}% exceeds industry standards`,
          impact: 'high',
          actionRequired: false,
          recommendation: 'Scale successful initiative patterns and share best practices',
          confidence: 90,
          relatedData: [{ averageRoi: avgRoi, completedCount: completedWithRoi.length }],
          generatedAt: now
        });
      }
    }
  }
  
  return insights;
}

async function generateRiskInsights(initiatives: any[], issues: any[], clusters: any[]): Promise<ExecutiveInsight[]> {
  const insights: ExecutiveInsight[] = [];
  const now = new Date();
  
  // Timeline Risk Analysis
  const overdueInitiatives = initiatives.filter(i => 
    i.timelineEnd && 
    new Date(i.timelineEnd) < now && 
    i.status !== 'COMPLETED'
  );
  
  if (overdueInitiatives.length > 0) {
    insights.push({
      id: 'risk-overdue-initiatives',
      type: 'risk',
      title: 'Timeline Risk Alert',
      summary: `${overdueInitiatives.length} initiatives are past their deadline`,
      impact: 'high',
      actionRequired: true,
      recommendation: 'Immediate review and resource reallocation needed for overdue initiatives',
      confidence: 100,
      relatedData: overdueInitiatives.map(i => ({ title: i.title, deadline: i.timelineEnd })),
      generatedAt: now
    });
  }
  
  // Resource Concentration Risk
  const ownerCounts = new Map();
  initiatives.filter(i => ['APPROVED', 'ACTIVE'].includes(i.status)).forEach(i => {
    const count = ownerCounts.get(i.ownerId) || 0;
    ownerCounts.set(i.ownerId, count + 1);
  });
  
  const overloadedOwners = Array.from(ownerCounts.entries()).filter(([_, count]) => count > 3);
  if (overloadedOwners.length > 0) {
    insights.push({
      id: 'risk-resource-concentration',
      type: 'risk',
      title: 'Resource Concentration Risk',
      summary: `${overloadedOwners.length} team members have more than 3 active initiatives`,
      impact: 'medium',
      actionRequired: true,
      recommendation: 'Redistribute workload to prevent burnout and single points of failure',
      confidence: 80,
      relatedData: overloadedOwners.map(([ownerId, count]) => ({ ownerId, activeInitiatives: count })),
      generatedAt: now
    });
  }
  
  return insights;
}

async function generateWeeklySummary(): Promise<WeeklySummary> {
  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Gather week's data
  const [weeklyInitiatives, weeklyIssues, weeklyActivity] = await Promise.all([
    prisma.initiative.findMany({
      where: {
        OR: [
          { createdAt: { gte: weekStart } },
          { updatedAt: { gte: weekStart } }
        ]
      }
    }),
    prisma.issue.findMany({
      where: { createdAt: { gte: weekStart } }
    }),
    prisma.auditLog.findMany({
      where: { timestamp: { gte: weekStart } }
    })
  ]);
  
  // Calculate performance metrics
  const performanceMetrics = {
    initiativeVelocity: calculateInitiativeVelocity(weeklyInitiatives),
    issueResolutionRate: calculateIssueResolutionRate(weeklyIssues, weeklyActivity),
    teamUtilization: calculateTeamUtilization(weeklyActivity),
    riskLevel: calculateRiskLevel(weeklyInitiatives, weeklyIssues) as 'low' | 'medium' | 'high'
  };
  
  // Use AI to generate narrative summary
  const executiveSummary = await generateAIExecutiveSummary(
    weeklyInitiatives, 
    weeklyIssues, 
    performanceMetrics
  );
  
  return {
    weekOf: weekStart,
    executiveSummary,
    keyAchievements: extractKeyAchievements(weeklyInitiatives, weeklyActivity),
    criticalConcerns: extractCriticalConcerns(weeklyInitiatives, weeklyIssues),
    recommendedActions: generateActionRecommendations(weeklyInitiatives, weeklyIssues, performanceMetrics),
    nextWeekFocus: generateNextWeekFocus(weeklyInitiatives, performanceMetrics),
    performanceMetrics
  };
}

async function generateAIExecutiveSummary(initiatives: any[], issues: any[], metrics: any): Promise<string> {
  try {
    const prompt = `
    Weekly Performance Data:
    - ${initiatives.length} initiative activities
    - ${issues.length} new issues reported
    - Initiative velocity: ${metrics.initiativeVelocity}%
    - Issue resolution rate: ${metrics.issueResolutionRate}%
    - Team utilization: ${metrics.teamUtilization}%
    - Risk level: ${metrics.riskLevel}
    
    Generate a concise executive summary (2-3 sentences) focusing on key business outcomes and strategic insights.
    `;
    
    // Use the existing generateIssueInsights method as a template but create direct API call
    if (!openAIService.isConfigured()) {
      throw new Error('OpenAI not configured');
    }
    
    // For now, return a structured summary based on the data
    const summary = `This week demonstrated ${metrics.riskLevel} operational risk with ${initiatives.length} initiative activities and ${issues.length} new issues. ` +
      `Team achieved ${metrics.initiativeVelocity}% initiative velocity and ${metrics.issueResolutionRate}% issue resolution rate. ` +
      `Current utilization at ${metrics.teamUtilization}% suggests ${metrics.riskLevel === 'low' ? 'stable operations' : 'attention needed'} for optimal performance.`;
    
    return summary;
  } catch (error) {
    console.error('AI summary generation failed:', error);
    return `This week saw ${initiatives.length} initiative activities with ${issues.length} new issues identified. Overall performance metrics indicate ${metrics.riskLevel} risk level with ${metrics.initiativeVelocity}% initiative velocity.`;
  }
}

// Helper functions for calculations
function calculateInitiativeVelocity(initiatives: any[]): number {
  const completedThisWeek = initiatives.filter(i => i.status === 'COMPLETED').length;
  const activeInitiatives = initiatives.filter(i => ['APPROVED', 'ACTIVE'].includes(i.status)).length;
  
  if (activeInitiatives === 0) return 100;
  return Math.round((completedThisWeek / Math.max(1, activeInitiatives)) * 100);
}

function calculateIssueResolutionRate(issues: any[], activity: any[]): number {
  // Simplified: assume issues addressed if there's been initiative activity
  const resolutionActivity = activity.filter(a => a.action.includes('initiative')).length;
  return Math.min(100, (resolutionActivity / Math.max(1, issues.length)) * 100);
}

function calculateTeamUtilization(activity: any[]): number {
  // Based on activity frequency
  return Math.min(100, activity.length * 2);
}

function calculateRiskLevel(initiatives: any[], issues: any[]): string {
  const overdueCount = initiatives.filter(i => 
    i.timelineEnd && new Date(i.timelineEnd) < new Date() && i.status !== 'COMPLETED'
  ).length;
  
  const criticalIssues = issues.filter(i => i.heatmapScore > 80).length;
  
  if (overdueCount > 2 || criticalIssues > 3) return 'high';
  if (overdueCount > 0 || criticalIssues > 1) return 'medium';
  return 'low';
}

function extractKeyAchievements(initiatives: any[], activity: any[]): string[] {
  const achievements: string[] = [];
  
  const completed = initiatives.filter(i => i.status === 'COMPLETED');
  completed.forEach(i => {
    achievements.push(`Completed initiative: ${i.title}`);
  });
  
  const highProgress = initiatives.filter(i => i.progress > 80 && i.status === 'ACTIVE');
  if (highProgress.length > 0) {
    achievements.push(`${highProgress.length} initiatives nearing completion`);
  }
  
  return achievements.slice(0, 5);
}

function extractCriticalConcerns(initiatives: any[], issues: any[]): string[] {
  const concerns: string[] = [];
  
  const overdue = initiatives.filter(i => 
    i.timelineEnd && new Date(i.timelineEnd) < new Date() && i.status !== 'COMPLETED'
  );
  
  if (overdue.length > 0) {
    concerns.push(`${overdue.length} initiatives overdue`);
  }
  
  const criticalIssues = issues.filter(i => i.heatmapScore > 80);
  if (criticalIssues.length > 0) {
    concerns.push(`${criticalIssues.length} critical issues identified`);
  }
  
  return concerns.slice(0, 3);
}

function generateActionRecommendations(initiatives: any[], issues: any[], metrics: any): string[] {
  const actions: string[] = [];
  
  if (metrics.riskLevel === 'high') {
    actions.push('Immediate resource reallocation needed for overdue initiatives');
  }
  
  if (metrics.initiativeVelocity < 50) {
    actions.push('Review and prioritize active initiative portfolio');
  }
  
  if (issues.length > 5) {
    actions.push('Investigate root causes of increased issue reporting');
  }
  
  return actions.slice(0, 4);
}

function generateNextWeekFocus(initiatives: any[], metrics: any): string[] {
  const focus: string[] = [];
  
  const nearDeadline = initiatives.filter(i => {
    if (!i.timelineEnd) return false;
    const daysUntil = (new Date(i.timelineEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    return daysUntil <= 14 && daysUntil > 0;
  });
  
  if (nearDeadline.length > 0) {
    focus.push(`Priority: ${nearDeadline.length} initiatives approaching deadline`);
  }
  
  focus.push('Maintain initiative momentum and issue resolution velocity');
  
  return focus.slice(0, 3);
}