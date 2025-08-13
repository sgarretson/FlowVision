import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/rbac';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cluster = await prisma.issueCluster.findUnique({
      where: { id: params.id },
      include: {
        issues: {
          include: {
            comments: {
              include: {
                author: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!cluster) {
      return NextResponse.json({ error: 'Cluster not found' }, { status: 404 });
    }

    // Get initiatives associated with this cluster
    const initiatives = await prisma.initiative.findMany({
      where: { clusterId: cluster.id },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
        addressedIssues: {
          select: {
            id: true,
            description: true,
            heatmapScore: true,
          },
        },
        milestones: {
          select: {
            title: true,
            status: true,
            dueDate: true,
            progress: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    // Calculate analytics
    const analytics = {
      totalIssues: cluster.issues.length,
      averageScore:
        cluster.issues.length > 0
          ? Math.round(
              cluster.issues.reduce((sum, issue) => sum + issue.heatmapScore, 0) /
                cluster.issues.length
            )
          : 0,
      totalVotes: cluster.issues.reduce((sum, issue) => sum + issue.votes, 0),
      scoreDistribution: {
        high: cluster.issues.filter((issue) => issue.heatmapScore >= 85).length,
        medium: cluster.issues.filter(
          (issue) => issue.heatmapScore >= 70 && issue.heatmapScore < 85
        ).length,
        low: cluster.issues.filter((issue) => issue.heatmapScore < 70).length,
      },
      departmentBreakdown: cluster.issues.reduce(
        (acc, issue) => {
          const dept = issue.department || 'Other';
          acc[dept] = (acc[dept] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      initiativeProgress: {
        total: initiatives.length,
        active: initiatives.filter((init) => init.status === 'ACTIVE').length,
        completed: initiatives.filter((init) => init.status === 'COMPLETED').length,
        averageProgress:
          initiatives.length > 0
            ? Math.round(
                initiatives.reduce((sum, init) => sum + init.progress, 0) / initiatives.length
              )
            : 0,
      },
    };

    // Generate strategic recommendations
    const recommendations = [];

    if (analytics.totalIssues > 0 && analytics.initiativeProgress.total === 0) {
      recommendations.push('Create strategic initiatives to address cluster issues systematically');
    }

    if (analytics.scoreDistribution.high > 0) {
      recommendations.push(
        `${analytics.scoreDistribution.high} high-priority issues require immediate attention`
      );
    }

    if (
      analytics.initiativeProgress.active > 0 &&
      analytics.initiativeProgress.averageProgress < 50
    ) {
      recommendations.push('Review active initiatives to identify potential roadblocks');
    }

    if (Object.keys(analytics.departmentBreakdown).length > 3) {
      recommendations.push('Cross-departmental collaboration recommended due to wide impact');
    }

    // Transform initiatives to include addressed issues
    const initiativesWithDetails = initiatives.map((initiative) => ({
      ...initiative,
      addressedIssues: cluster.issues.slice(0, 3).map((issue) => ({
        id: issue.id,
        description: issue.description,
        heatmapScore: issue.heatmapScore,
      })),
    }));

    const clusterDetails = {
      id: cluster.id,
      name: cluster.name,
      title: cluster.name,
      theme: cluster.description,
      description: cluster.description,
      category: cluster.category,
      severity: cluster.severity,
      isActive: cluster.isActive,
      color: cluster.color || '#6366f1',
      issues: cluster.issues,
      initiatives: initiativesWithDetails,
      analytics,
      recommendations,
    };

    return NextResponse.json({
      success: true,
      cluster: clusterDetails,
    });
  } catch (error) {
    console.error('Failed to fetch cluster details:', error);
    return NextResponse.json({ error: 'Failed to fetch cluster details' }, { status: 500 });
  }
}
