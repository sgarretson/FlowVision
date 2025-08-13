import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/systems/analytics
 * Get comprehensive system analytics and insights
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const systemType = searchParams.get('type') as 'TECHNOLOGY' | 'PROCESS' | 'PEOPLE' | null;
    const timeRange = searchParams.get('timeRange') || '30'; // days

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Build where clause for filtering
    const whereClause: any = {
      createdAt: {
        gte: startDate,
      },
    };

    if (systemType) {
      whereClause.systemCategory = {
        type: systemType,
      };
    }

    // Get system impact statistics
    const impactStats = await prisma.issueSystemImpact.groupBy({
      by: ['systemCategoryId', 'impactLevel'],
      where: whereClause,
      _count: true,
      _avg: {
        priority: true,
      },
    });

    // Get system categories with usage data
    const systemsWithImpacts = await prisma.systemCategory.findMany({
      where: {
        isActive: true,
        ...(systemType && { type: systemType }),
      },
      include: {
        issueImpacts: {
          where: {
            createdAt: {
              gte: startDate,
            },
          },
          include: {
            issue: {
              select: {
                heatmapScore: true,
                votes: true,
              },
            },
          },
        },
        _count: {
          select: {
            issueImpacts: true,
          },
        },
      },
      orderBy: {
        issueImpacts: {
          _count: 'desc',
        },
      },
    });

    // Calculate system risk scores
    const systemRiskAnalysis = systemsWithImpacts.map((system) => {
      const impacts = system.issueImpacts;
      const totalImpacts = impacts.length;

      if (totalImpacts === 0) {
        return {
          systemId: system.id,
          systemName: system.name,
          systemType: system.type,
          riskScore: 0,
          totalImpacts: 0,
          criticalImpacts: 0,
          averageHeatmapScore: 0,
          totalVotes: 0,
        };
      }

      const criticalImpacts = impacts.filter((i) => i.impactLevel === 'CRITICAL').length;
      const highImpacts = impacts.filter((i) => i.impactLevel === 'HIGH').length;
      const averageHeatmapScore =
        impacts.reduce((sum, i) => sum + i.issue.heatmapScore, 0) / totalImpacts;
      const totalVotes = impacts.reduce((sum, i) => sum + i.issue.votes, 0);

      // Calculate risk score (0-100)
      const riskScore = Math.min(
        100,
        Math.round(
          criticalImpacts * 25 + highImpacts * 15 + totalImpacts * 5 + averageHeatmapScore * 2
        )
      );

      return {
        systemId: system.id,
        systemName: system.name,
        systemType: system.type,
        riskScore,
        totalImpacts,
        criticalImpacts,
        highImpacts,
        averageHeatmapScore: Math.round(averageHeatmapScore * 10) / 10,
        totalVotes,
        color: system.color,
      };
    });

    // Get cross-system impact analysis
    const crossSystemImpacts = (await prisma.$queryRaw`
      SELECT 
        i.id as issue_id,
        i.description as issue_description,
        i."heatmapScore" as heatmap_score,
        COUNT(isi.*) as affected_systems_count,
        ARRAY_AGG(sc.name) as affected_systems,
        ARRAY_AGG(sc.type) as system_types,
        ARRAY_AGG(isi."impactLevel") as impact_levels
      FROM "Issue" i
      JOIN "IssueSystemImpact" isi ON i.id = isi."issueId"
      JOIN "SystemCategory" sc ON isi."systemCategoryId" = sc.id
      WHERE i."createdAt" >= ${startDate}
      GROUP BY i.id, i.description, i."heatmapScore"
      HAVING COUNT(isi.*) > 1
      ORDER BY COUNT(isi.*) DESC, i."heatmapScore" DESC
      LIMIT 10
    `) as any[];

    // Calculate overall system health metrics
    const totalSystems = systemsWithImpacts.length;
    const systemsWithIssues = systemsWithImpacts.filter((s) => s.issueImpacts.length > 0).length;
    const systemsAtRisk = systemRiskAnalysis.filter((s) => s.riskScore > 50).length;
    const averageRiskScore =
      systemRiskAnalysis.reduce((sum, s) => sum + s.riskScore, 0) / totalSystems;

    // Get trending systems (most impacts in recent period)
    const trendingPeriod = new Date();
    trendingPeriod.setDate(trendingPeriod.getDate() - 7); // Last 7 days

    const trendingSystems = await prisma.issueSystemImpact.groupBy({
      by: ['systemCategoryId'],
      where: {
        createdAt: {
          gte: trendingPeriod,
        },
      },
      _count: true,
      orderBy: {
        _count: {
          systemCategoryId: 'desc',
        },
      },
      take: 5,
    });

    const trendingSystemsWithDetails = await Promise.all(
      trendingSystems.map(async (trend) => {
        const system = await prisma.systemCategory.findUnique({
          where: { id: trend.systemCategoryId },
          select: {
            id: true,
            name: true,
            type: true,
            color: true,
          },
        });
        return {
          ...system,
          recentImpacts: trend._count,
        };
      })
    );

    // Get impact level distribution
    const impactDistribution = await prisma.issueSystemImpact.groupBy({
      by: ['impactLevel'],
      where: whereClause,
      _count: true,
    });

    const analytics = {
      overview: {
        totalSystems,
        systemsWithIssues,
        systemsAtRisk,
        averageRiskScore: Math.round(averageRiskScore * 10) / 10,
        healthPercentage: Math.round(((totalSystems - systemsAtRisk) / totalSystems) * 100),
      },
      riskAnalysis: systemRiskAnalysis.slice(0, 10), // Top 10 riskiest systems
      crossSystemImpacts,
      trendingSystems: trendingSystemsWithDetails,
      impactDistribution: impactDistribution.reduce(
        (acc, item) => {
          acc[item.impactLevel.toLowerCase()] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      systemTypeBreakdown: systemsWithImpacts.reduce(
        (acc, system) => {
          const type = system.type.toLowerCase();
          if (!acc[type]) {
            acc[type] = {
              total: 0,
              withIssues: 0,
              totalImpacts: 0,
            };
          }
          acc[type].total++;
          if (system.issueImpacts.length > 0) {
            acc[type].withIssues++;
          }
          acc[type].totalImpacts += system.issueImpacts.length;
          return acc;
        },
        {} as Record<string, any>
      ),
      timeRange: parseInt(timeRange),
      generatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error('Error fetching system analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch system analytics' }, { status: 500 });
  }
}
