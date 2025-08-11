import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  category: 'timeline' | 'resource' | 'roi' | 'issue';
  title: string;
  description: string;
  recommendation: string;
  priority: number; // 1-10, 10 being most urgent
  relatedId?: string; // Initiative or Issue ID
  relatedType?: 'initiative' | 'issue' | 'cluster';
  createdAt: Date;
}

/**
 * AI-Powered Predictive Alerts for Executive Dashboard
 * Identifies potential problems before they become critical
 */
export async function GET(request: NextRequest) {
  try {
    const alerts: Alert[] = [];

    // 1. Timeline Risk Alerts
    const timelineAlerts = await generateTimelineAlerts();
    alerts.push(...timelineAlerts);

    // 2. Resource Allocation Alerts
    const resourceAlerts = await generateResourceAlerts();
    alerts.push(...resourceAlerts);

    // 3. ROI Performance Alerts
    const roiAlerts = await generateRoiAlerts();
    alerts.push(...roiAlerts);

    // 4. Issue Pattern Alerts
    const issueAlerts = await generateIssuePatternAlerts();
    alerts.push(...issueAlerts);

    // 5. Anomaly Detection Alerts
    const anomalyAlerts = await generateAnomalyAlerts();
    alerts.push(...anomalyAlerts);

    // Sort by priority (highest first)
    alerts.sort((a, b) => b.priority - a.priority);

    return NextResponse.json({
      alerts: alerts.slice(0, 10), // Top 10 most important alerts
      totalCount: alerts.length,
      lastUpdated: new Date(),
    });
  } catch (error) {
    console.error('Alert generation error:', error);
    return NextResponse.json({ error: 'Failed to generate alerts' }, { status: 500 });
  }
}

async function generateTimelineAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];

  // Find initiatives at risk of missing deadlines
  const activeInitiatives = await prisma.initiative.findMany({
    where: {
      status: { in: ['APPROVED', 'ACTIVE'] },
      timelineEnd: { gte: new Date() }, // Not yet overdue
    },
    select: {
      id: true,
      title: true,
      progress: true,
      timelineStart: true,
      timelineEnd: true,
      estimatedHours: true,
      actualHours: true,
    },
  });

  for (const initiative of activeInitiatives) {
    const now = new Date();
    if (!initiative.timelineStart || !initiative.timelineEnd) {
      continue;
    }
    const startMs = new Date(initiative.timelineStart).getTime();
    const endMs = new Date(initiative.timelineEnd).getTime();
    const totalDuration = endMs - startMs;
    if (totalDuration <= 0) continue;
    const elapsed = now.getTime() - startMs;
    const expectedProgress = (elapsed / totalDuration) * 100;
    const actualProgress = initiative.progress || 0;

    // Alert if significantly behind schedule
    const progressGap = expectedProgress - actualProgress;

    if (progressGap > 20) {
      // More than 20% behind schedule
      alerts.push({
        id: `timeline-${initiative.id}`,
        type: progressGap > 40 ? 'critical' : 'warning',
        category: 'timeline',
        title: `Initiative Behind Schedule`,
        description: `"${initiative.title}" is ${Math.round(progressGap)}% behind expected progress`,
        recommendation:
          progressGap > 40
            ? 'Immediate resource reallocation or scope reduction needed'
            : 'Consider additional resources or timeline adjustment',
        priority: progressGap > 40 ? 9 : 6,
        relatedId: initiative.id,
        relatedType: 'initiative',
        createdAt: now,
      });
    }

    // Alert for initiatives approaching deadline with low progress
    const daysUntilDeadline = (endMs - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysUntilDeadline <= 14 && actualProgress < 70) {
      alerts.push({
        id: `deadline-${initiative.id}`,
        type: 'critical',
        category: 'timeline',
        title: `Deadline Risk`,
        description: `"${initiative.title}" has ${Math.round(daysUntilDeadline)} days remaining with ${actualProgress}% completion`,
        recommendation: 'Escalate immediately or negotiate deadline extension',
        priority: 10,
        relatedId: initiative.id,
        relatedType: 'initiative',
        createdAt: now,
      });
    }
  }

  return alerts;
}

async function generateResourceAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];
  const now = new Date();

  // Check for over-allocated team members (simplified heuristic)
  const activeInitiatives = await prisma.initiative.findMany({
    where: { status: { in: ['APPROVED', 'ACTIVE'] } },
    include: {
      owner: {
        select: { name: true, email: true },
      },
    },
  });

  // Group initiatives by owner to detect overallocation
  const ownerWorkload = new Map<string, number>();
  activeInitiatives.forEach((initiative) => {
    const ownerId = initiative.ownerId;
    const currentLoad = ownerWorkload.get(ownerId) || 0;
    ownerWorkload.set(ownerId, currentLoad + 1);
  });

  // Alert for team members with too many active initiatives
  for (const [ownerId, workload] of ownerWorkload.entries()) {
    if (workload > 3) {
      // More than 3 active initiatives per person
      const owner = activeInitiatives.find((i) => i.ownerId === ownerId)?.owner;

      alerts.push({
        id: `resource-${ownerId}`,
        type: 'warning',
        category: 'resource',
        title: `Resource Overallocation`,
        description: `${owner?.name || 'Team member'} has ${workload} active initiatives`,
        recommendation: 'Consider redistributing workload or prioritizing initiatives',
        priority: 7,
        createdAt: now,
      });
    }
  }

  return alerts;
}

async function generateRoiAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];
  const now = new Date();

  // Find initiatives with concerning ROI trends
  const initiativesWithBudget = await prisma.initiative.findMany({
    where: {
      status: { in: ['ACTIVE', 'COMPLETED'] },
      budget: { gt: 0 },
    },
    select: {
      id: true,
      title: true,
      budget: true,
      actualHours: true,
      estimatedHours: true,
      roi: true,
      status: true,
    },
  });

  for (const initiative of initiativesWithBudget) {
    // Alert for budget overruns
    if (initiative.actualHours && initiative.estimatedHours) {
      const budgetOverrun =
        ((initiative.actualHours - initiative.estimatedHours) / initiative.estimatedHours) * 100;

      if (budgetOverrun > 25) {
        // More than 25% over budget
        alerts.push({
          id: `budget-${initiative.id}`,
          type: budgetOverrun > 50 ? 'critical' : 'warning',
          category: 'roi',
          title: `Budget Overrun Alert`,
          description: `"${initiative.title}" is ${Math.round(budgetOverrun)}% over estimated hours`,
          recommendation: 'Review scope and consider budget adjustment or efficiency improvements',
          priority: budgetOverrun > 50 ? 8 : 5,
          relatedId: initiative.id,
          relatedType: 'initiative',
          createdAt: now,
        });
      }
    }

    // Alert for low ROI initiatives
    if (initiative.roi !== null && initiative.roi < 10 && initiative.status === 'COMPLETED') {
      alerts.push({
        id: `roi-${initiative.id}`,
        type: 'info',
        category: 'roi',
        title: `Low ROI Initiative`,
        description: `"${initiative.title}" achieved ${initiative.roi}% ROI`,
        recommendation: 'Analyze lessons learned and apply to future initiative planning',
        priority: 3,
        relatedId: initiative.id,
        relatedType: 'initiative',
        createdAt: now,
      });
    }
  }

  return alerts;
}

async function generateIssuePatternAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];
  const now = new Date();

  // Check for issue clustering patterns
  const clusters = await prisma.issueCluster.findMany({
    include: {
      issues: {
        select: {
          id: true,
          heatmapScore: true,
          createdAt: true,
        },
      },
    },
  });

  for (const cluster of clusters) {
    // Alert for clusters with high-severity issues
    const highSeverityIssues = cluster.issues.filter((issue) => issue.heatmapScore > 80);

    if (highSeverityIssues.length > 2) {
      alerts.push({
        id: `cluster-${cluster.id}`,
        type: 'warning',
        category: 'issue',
        title: `Critical Issue Cluster`,
        description: `${cluster.name} cluster has ${highSeverityIssues.length} high-severity issues`,
        recommendation: 'Create dedicated initiative to address this cluster systematically',
        priority: 8,
        relatedId: cluster.id,
        relatedType: 'cluster',
        createdAt: now,
      });
    }

    // Alert for rapidly growing clusters
    const recentIssues = cluster.issues.filter(
      (issue) => now.getTime() - new Date(issue.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000 // Last 7 days
    );

    if (recentIssues.length > 3) {
      alerts.push({
        id: `growth-${cluster.id}`,
        type: 'warning',
        category: 'issue',
        title: `Emerging Issue Pattern`,
        description: `${cluster.name} cluster gained ${recentIssues.length} new issues this week`,
        recommendation: 'Investigate root cause before pattern becomes systemic',
        priority: 7,
        relatedId: cluster.id,
        relatedType: 'cluster',
        createdAt: now,
      });
    }
  }

  return alerts;
}

async function generateAnomalyAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];
  const now = new Date();

  // Check for unusual activity patterns
  const [issueCount, initiativeCount] = await Promise.all([
    prisma.issue.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.initiative.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  // Alert for unusual issue spike
  if (issueCount > 10) {
    // More than 10 issues in a week might indicate systemic problems
    alerts.push({
      id: 'anomaly-issues',
      type: 'warning',
      category: 'issue',
      title: `Unusual Issue Activity`,
      description: `${issueCount} new issues reported in the last 7 days`,
      recommendation: 'Investigate potential systemic issues or process breakdowns',
      priority: 6,
      createdAt: now,
    });
  }

  // Alert for lack of activity
  if (issueCount === 0 && initiativeCount === 0) {
    alerts.push({
      id: 'anomaly-inactive',
      type: 'info',
      category: 'issue',
      title: `Low Activity Period`,
      description: 'No new issues or initiatives created in the last 7 days',
      recommendation: 'Ensure team is actively using the platform for issue reporting',
      priority: 2,
      createdAt: now,
    });
  }

  return alerts;
}
