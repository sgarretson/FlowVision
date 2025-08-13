import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [initiativeCount, issueCount, latestInitiatives] = await Promise.all([
      prisma.initiative.count(),
      prisma.issue.count(),
      prisma.initiative.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, status: true, progress: true, updatedAt: true },
      }),
    ]);

    const statusGroups = await prisma.initiative.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const brief = {
      headline: 'Executive Weekly Brief',
      metrics: {
        initiatives: initiativeCount,
        issues: issueCount,
        byStatus: Object.fromEntries(statusGroups.map((g) => [g.status, g._count._all])),
      },
      latestInitiatives,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(brief);
  } catch (e) {
    console.warn('Brief generation failed:', e);
    return NextResponse.json({ error: 'Failed to generate brief' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { includeCharts = true, includeRecommendations = true, format = 'json' } = body;

    // Get comprehensive data for enhanced report
    const [initiativeCount, issueCount, latestInitiatives, clusters, recentActivity] =
      await Promise.all([
        prisma.initiative.count(),
        prisma.issue.count(),
        prisma.initiative.findMany({
          orderBy: { updatedAt: 'desc' },
          take: 10,
          include: {
            owner: { select: { name: true } },
            cluster: { select: { name: true, severity: true } },
          },
        }),
        prisma.issueCluster.findMany({
          where: { isActive: true },
          include: {
            _count: { select: { issues: true } },
          },
        }),
        prisma.auditLog.count({
          where: {
            timestamp: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

    const statusGroups = await prisma.initiative.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const brief = {
      headline: 'Executive Summary Report',
      generatedAt: new Date().toISOString(),
      metrics: {
        initiatives: initiativeCount,
        issues: issueCount,
        byStatus: Object.fromEntries(statusGroups.map((g) => [g.status, g._count._all])),
        weeklyActivity: recentActivity,
      },
      initiatives: latestInitiatives.map((init) => ({
        title: init.title,
        status: init.status,
        progress: init.progress,
        owner: init.owner?.name || 'Unassigned',
        cluster: init.cluster?.name || 'Unclustered',
        priority: init.cluster?.severity || 'medium',
      })),
      clusters: clusters.map((cluster) => ({
        name: cluster.name,
        issueCount: cluster._count.issues,
        severity: cluster.severity,
      })),
      recommendations: includeRecommendations
        ? [
            'Focus on completing ACTIVE initiatives to improve delivery rate',
            'Address critical clusters to reduce operational friction',
            'Consider resource reallocation for bottlenecked initiatives',
          ]
        : [],
      configuration: {
        includeCharts,
        includeRecommendations,
        format,
      },
    };

    if (format === 'pdf') {
      // For PDF format, return the data that can be used by client-side PDF generation
      return NextResponse.json({
        ...brief,
        contentType: 'application/pdf-data',
        instructions: 'Use client-side PDF generation with this data',
      });
    }

    return NextResponse.json(brief);
  } catch (error) {
    console.error('Enhanced brief generation failed:', error);
    return NextResponse.json({ error: 'Failed to generate enhanced brief' }, { status: 500 });
  }
}
