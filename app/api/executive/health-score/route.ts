import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface HealthScoreMetrics {
  score: number;
  trend: 'improving' | 'declining' | 'stable';
  components: {
    initiativeHealth: number;
    issueVelocity: number;
    teamUtilization: number;
    roiTrend: number;
  };
  lastUpdated: Date;
}

/**
 * Calculate organizational health score (0-100)
 * Based on: initiative progress, issue resolution velocity, team utilization, ROI trends
 */
export async function GET(request: NextRequest) {
  try {
    // Get current metrics
    const [initiatives, issues, completedInitiatives, recentCompletions] = await Promise.all([
      // Active initiatives with progress
      prisma.initiative.findMany({
        where: { 
          status: { in: ['APPROVED', 'ACTIVE'] }
        },
        select: { progress: true, status: true, createdAt: true, updatedAt: true }
      }),
      
      // Recent issues and resolution patterns
      prisma.issue.findMany({
        select: { 
          votes: true, 
          heatmapScore: true, 
          createdAt: true,
          clusterId: true 
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      
      // Completed initiatives for ROI calculation
      prisma.initiative.findMany({
        where: { status: 'COMPLETED' },
        select: { roi: true, completedAt: true, createdAt: true }
      }),
      
      // Recent completions for velocity calculation
      prisma.initiative.findMany({
        where: { 
          status: 'COMPLETED',
          completedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        },
        select: { completedAt: true, estimatedHours: true, actualHours: true }
      })
    ]);

    // 1. Initiative Health (30% weight)
    const initiativeHealth = calculateInitiativeHealth(initiatives);
    
    // 2. Issue Velocity (25% weight) - How quickly are issues being addressed
    const issueVelocity = calculateIssueVelocity(issues);
    
    // 3. Team Utilization (20% weight) - Efficiency metrics
    const teamUtilization = calculateTeamUtilization(recentCompletions);
    
    // 4. ROI Trend (25% weight) - Financial performance
    const roiTrend = calculateRoiTrend(completedInitiatives);

    // Weighted health score
    const healthScore = Math.round(
      (initiativeHealth * 0.30) +
      (issueVelocity * 0.25) +
      (teamUtilization * 0.20) +
      (roiTrend * 0.25)
    );

    // Determine trend by comparing with historical data
    const trend = await calculateHealthTrend(healthScore);

    const response: HealthScoreMetrics = {
      score: Math.max(0, Math.min(100, healthScore)),
      trend,
      components: {
        initiativeHealth,
        issueVelocity,
        teamUtilization,
        roiTrend
      },
      lastUpdated: new Date()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Health score calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate health score' },
      { status: 500 }
    );
  }
}

function calculateInitiativeHealth(initiatives: any[]): number {
  if (initiatives.length === 0) return 50; // Neutral if no initiatives
  
  const averageProgress = initiatives.reduce((sum, init) => sum + (init.progress || 0), 0) / initiatives.length;
  
  // Bonus for initiatives that are progressing (updated recently)
  const now = new Date();
  const recentlyUpdated = initiatives.filter(init => {
    const daysSinceUpdate = (now.getTime() - new Date(init.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate <= 7; // Updated within last week
  }).length;
  
  const activityBonus = (recentlyUpdated / initiatives.length) * 20;
  
  return Math.min(100, averageProgress + activityBonus);
}

function calculateIssueVelocity(issues: any[]): number {
  if (issues.length === 0) return 75; // Good if no issues
  
  // Higher scores for lower average heatmap scores (fewer critical issues)
  const averageHeatmap = issues.reduce((sum, issue) => sum + (issue.heatmapScore || 50), 0) / issues.length;
  
  // Bonus for issues that have been voted on (engagement)
  const engagedIssues = issues.filter(issue => issue.votes > 0).length;
  const engagementRate = issues.length > 0 ? (engagedIssues / issues.length) * 100 : 0;
  
  // Bonus for clustered issues (organized approach)
  const clusteredIssues = issues.filter(issue => issue.clusterId).length;
  const clusteringRate = issues.length > 0 ? (clusteredIssues / issues.length) * 10 : 0;
  
  // Invert heatmap score (lower heatmap = better velocity score)
  const baseScore = Math.max(0, 100 - averageHeatmap);
  
  return Math.min(100, baseScore + (engagementRate * 0.2) + clusteringRate);
}

function calculateTeamUtilization(recentCompletions: any[]): number {
  if (recentCompletions.length === 0) return 60; // Neutral if no recent data
  
  // Calculate efficiency: estimated vs actual hours
  const efficiencyScores = recentCompletions
    .filter(comp => comp.estimatedHours && comp.actualHours)
    .map(comp => {
      const efficiency = comp.estimatedHours / comp.actualHours;
      // Score 100 if on-time, decrease as over-budget
      return Math.min(100, Math.max(0, efficiency * 100));
    });
  
  if (efficiencyScores.length === 0) return 70;
  
  const averageEfficiency = efficiencyScores.reduce((sum, score) => sum + score, 0) / efficiencyScores.length;
  
  // Bonus for completing initiatives (velocity)
  const completionVelocity = Math.min(20, recentCompletions.length * 2);
  
  return Math.min(100, averageEfficiency + completionVelocity);
}

function calculateRoiTrend(completedInitiatives: any[]): number {
  if (completedInitiatives.length === 0) return 50; // Neutral if no data
  
  const roiValues = completedInitiatives
    .filter(init => init.roi !== null && init.roi !== undefined)
    .map(init => init.roi);
  
  if (roiValues.length === 0) return 50;
  
  const averageRoi = roiValues.reduce((sum, roi) => sum + roi, 0) / roiValues.length;
  
  // Convert ROI to 0-100 scale (0% ROI = 50 points, 100% ROI = 100 points)
  const baseScore = Math.min(100, Math.max(0, 50 + (averageRoi * 0.5)));
  
  // Bonus for having multiple successful initiatives
  const portfolioBonus = Math.min(10, roiValues.length);
  
  return Math.min(100, baseScore + portfolioBonus);
}

async function calculateHealthTrend(currentScore: number): Promise<'improving' | 'declining' | 'stable'> {
  try {
    // Get health scores from the last 7 days (would need to store historical data)
    // For now, we'll use a simple heuristic based on current metrics
    
    // This is a simplified implementation - in production, you'd store historical health scores
    const recentInitiativeUpdates = await prisma.initiative.count({
      where: {
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    });
    
    const recentIssues = await prisma.issue.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    });
    
    // Heuristic: more activity = improving, high issue creation = declining
    if (recentInitiativeUpdates > 3 && recentIssues <= 2) {
      return 'improving';
    } else if (recentIssues > 5 || recentInitiativeUpdates === 0) {
      return 'declining';
    } else {
      return 'stable';
    }
    
  } catch (error) {
    console.error('Trend calculation error:', error);
    return 'stable';
  }
}