import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RoiForecast {
  current: {
    totalInvestment: number;
    realizedRoi: number;
    pendingRoi: number;
    portfolioValue: number;
  };
  forecast: {
    threeMonth: number;
    sixMonth: number;
    twelveMonth: number;
    confidence: number; // 0-100%
  };
  topPerformers: Array<{
    id: string;
    title: string;
    roi: number;
    status: string;
  }>;
  recommendations: string[];
  lastUpdated: Date;
}

/**
 * AI-Powered ROI Forecasting for Executive Dashboard
 * Provides current ROI metrics and predictive analytics
 */
export async function GET(request: NextRequest) {
  try {
    // Get all initiatives with financial data
    const initiatives = await prisma.initiative.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        budget: true,
        roi: true,
        progress: true,
        timelineStart: true,
        timelineEnd: true,
        estimatedHours: true,
        actualHours: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Calculate current ROI metrics
    const current = await calculateCurrentRoi(initiatives);
    
    // Generate ROI forecasts using ML-inspired heuristics
    const forecast = await calculateRoiForecast(initiatives);
    
    // Identify top performing initiatives
    const topPerformers = getTopPerformers(initiatives);
    
    // Generate AI-powered recommendations
    const recommendations = generateRoiRecommendations(initiatives, current, forecast);

    const response: RoiForecast = {
      current,
      forecast,
      topPerformers,
      recommendations,
      lastUpdated: new Date()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('ROI forecast error:', error);
    return NextResponse.json(
      { error: 'Failed to generate ROI forecast' },
      { status: 500 }
    );
  }
}

async function calculateCurrentRoi(initiatives: any[]) {
  let totalInvestment = 0;
  let realizedRoi = 0;
  let pendingRoi = 0;
  
  const completedInitiatives = initiatives.filter(i => i.status === 'COMPLETED');
  const activeInitiatives = initiatives.filter(i => ['APPROVED', 'ACTIVE'].includes(i.status));

  // Calculate total investment (sum of all budgets)
  totalInvestment = initiatives
    .filter(i => i.budget)
    .reduce((sum, i) => sum + i.budget, 0);

  // Calculate realized ROI from completed initiatives
  if (completedInitiatives.length > 0) {
    const completedRois = completedInitiatives
      .filter(i => i.roi !== null && i.roi !== undefined)
      .map(i => i.roi);
    
    if (completedRois.length > 0) {
      realizedRoi = completedRois.reduce((sum, roi) => sum + roi, 0) / completedRois.length;
    }
  }

  // Estimate pending ROI from active initiatives using progress and historical data
  if (activeInitiatives.length > 0 && completedInitiatives.length > 0) {
    const historicalAvgRoi = realizedRoi || 15; // Default to 15% if no historical data
    
    // Weight pending ROI by progress and apply confidence factor
    pendingRoi = activeInitiatives.reduce((sum, initiative) => {
      const progressWeight = (initiative.progress || 0) / 100;
      const confidenceFactor = 0.7; // Conservative estimate
      const estimatedRoi = historicalAvgRoi * progressWeight * confidenceFactor;
      return sum + estimatedRoi;
    }, 0);
    
    if (activeInitiatives.length > 0) {
      pendingRoi = pendingRoi / activeInitiatives.length;
    }
  }

  // Calculate portfolio value (investment + returns)
  const portfolioValue = totalInvestment * (1 + (realizedRoi + pendingRoi) / 100);

  return {
    totalInvestment: Math.round(totalInvestment),
    realizedRoi: Math.round(realizedRoi * 100) / 100,
    pendingRoi: Math.round(pendingRoi * 100) / 100,
    portfolioValue: Math.round(portfolioValue)
  };
}

async function calculateRoiForecast(initiatives: any[]) {
  const completedInitiatives = initiatives.filter(i => i.status === 'COMPLETED');
  const activeInitiatives = initiatives.filter(i => ['APPROVED', 'ACTIVE'].includes(i.status));
  
  // Base forecast on historical performance if available
  let baseRoi = 15; // Default assumption
  let confidence = 50; // Base confidence
  
  if (completedInitiatives.length > 0) {
    const historicalRois = completedInitiatives
      .filter(i => i.roi !== null && i.roi !== undefined)
      .map(i => i.roi);
    
    if (historicalRois.length > 0) {
      baseRoi = historicalRois.reduce((sum, roi) => sum + roi, 0) / historicalRois.length;
      confidence = Math.min(90, 50 + (historicalRois.length * 5)); // Increase confidence with more data
    }
  }

  // Analyze active initiative pipeline for forecasting
  const pipelineStrength = analyzePipelineStrength(activeInitiatives);
  
  // Apply trend analysis
  const trendMultiplier = calculateTrendMultiplier(initiatives);
  
  // Generate forecasts with increasing uncertainty over time
  const threeMonth = baseRoi * pipelineStrength * trendMultiplier;
  const sixMonth = threeMonth * 0.95; // Slight degradation for longer timeline
  const twelveMonth = sixMonth * 0.9; // More uncertainty for 12-month forecast

  return {
    threeMonth: Math.round(threeMonth * 100) / 100,
    sixMonth: Math.round(sixMonth * 100) / 100,
    twelveMonth: Math.round(twelveMonth * 100) / 100,
    confidence: Math.round(confidence)
  };
}

function analyzePipelineStrength(activeInitiatives: any[]): number {
  if (activeInitiatives.length === 0) return 0.8; // Conservative if no active initiatives
  
  // Factors that strengthen pipeline:
  // 1. Number of active initiatives
  // 2. Progress distribution
  // 3. Timeline health
  
  const initiativeCountFactor = Math.min(1.2, 0.8 + (activeInitiatives.length * 0.1));
  
  // Average progress across active initiatives
  const avgProgress = activeInitiatives.reduce((sum, i) => sum + (i.progress || 0), 0) / activeInitiatives.length;
  const progressFactor = 0.7 + (avgProgress / 100) * 0.3;
  
  // Timeline health (initiatives not severely overdue)
  const now = new Date();
  const onTimeInitiatives = activeInitiatives.filter(i => {
    if (!i.timelineEnd) return true; // No deadline = assume on time
    return i.timelineEnd > now;
  });
  const timelineFactor = onTimeInitiatives.length / activeInitiatives.length;
  
  return Math.min(1.3, initiativeCountFactor * progressFactor * timelineFactor);
}

function calculateTrendMultiplier(initiatives: any[]): number {
  // Analyze recent activity trends
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const recentInitiatives = initiatives.filter(i => 
    new Date(i.createdAt) >= thirtyDaysAgo
  );
  
  const recentUpdates = initiatives.filter(i => 
    new Date(i.updatedAt) >= thirtyDaysAgo && 
    new Date(i.updatedAt) > new Date(i.createdAt)
  );
  
  // Positive trend if there's been recent activity
  if (recentInitiatives.length > 0 || recentUpdates.length > 2) {
    return 1.1; // 10% boost for positive activity
  } else if (recentUpdates.length === 0) {
    return 0.9; // 10% reduction for stagnant activity
  }
  
  return 1.0; // Neutral
}

function getTopPerformers(initiatives: any[]) {
  return initiatives
    .filter(i => i.roi !== null && i.roi !== undefined && i.roi > 0)
    .sort((a, b) => (b.roi || 0) - (a.roi || 0))
    .slice(0, 5)
    .map(i => ({
      id: i.id,
      title: i.title,
      roi: Math.round(i.roi * 100) / 100,
      status: i.status
    }));
}

function generateRoiRecommendations(initiatives: any[], current: any, forecast: any): string[] {
  const recommendations: string[] = [];
  
  // Recommendation based on current ROI performance
  if (current.realizedRoi < 10) {
    recommendations.push("Consider reviewing initiative selection criteria to improve ROI outcomes");
  } else if (current.realizedRoi > 25) {
    recommendations.push("Excellent ROI performance - consider scaling successful initiative patterns");
  }
  
  // Recommendation based on portfolio balance
  const activeCount = initiatives.filter(i => ['APPROVED', 'ACTIVE'].includes(i.status)).length;
  const completedCount = initiatives.filter(i => i.status === 'COMPLETED').length;
  
  if (activeCount > completedCount * 2) {
    recommendations.push("High number of active initiatives - consider focusing resources for faster completion");
  }
  
  // Recommendation based on forecast confidence
  if (forecast.confidence < 60) {
    recommendations.push("Low forecast confidence - gather more initiative outcome data to improve predictions");
  }
  
  // Budget utilization recommendation
  if (current.totalInvestment < 50000) {
    recommendations.push("Consider increasing initiative investment to drive more significant organizational impact");
  }
  
  // Timeline recommendation
  const overdueInitiatives = initiatives.filter(i => {
    return i.timelineEnd && new Date(i.timelineEnd) < new Date() && i.status !== 'COMPLETED';
  });
  
  if (overdueInitiatives.length > 0) {
    recommendations.push(`${overdueInitiatives.length} initiatives are overdue - review resource allocation and priorities`);
  }
  
  // Default positive recommendation
  if (recommendations.length === 0) {
    recommendations.push("Initiative portfolio is performing well - maintain current execution standards");
  }
  
  return recommendations.slice(0, 4); // Limit to top 4 recommendations
}