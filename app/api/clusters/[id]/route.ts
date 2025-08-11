import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/rbac';

interface ClusterUpdateRequest {
  name?: string;
  description?: string;
  severity?: string;
  isActive?: boolean;
  color?: string;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role-aware projection and reduced payloads
    const isAdmin = user.role === 'ADMIN';
    const cluster = await prisma.issueCluster.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        severity: true,
        theme: true,
        color: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        issues: {
          orderBy: { heatmapScore: 'desc' },
          select: {
            id: true,
            description: true,
            department: true,
            category: true,
            heatmapScore: true,
            votes: true,
            createdAt: true,
            comments: {
              take: 3,
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                content: true,
                createdAt: true,
                author: {
                  select: isAdmin ? { name: true, email: true } : { name: true },
                },
              },
            },
          },
        },
        initiatives: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            progress: true,
            type: true,
            clusterId: true,
            createdAt: true,
            owner: {
              select: isAdmin ? { name: true, email: true } : { name: true },
            },
            milestones: {
              select: { title: true, status: true, dueDate: true },
            },
          },
        },
      },
    });

    if (!cluster) {
      return NextResponse.json({ error: 'Cluster not found' }, { status: 404 });
    }

    // Calculate cluster analytics
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
        high: cluster.issues.filter((i) => i.heatmapScore > 85).length,
        medium: cluster.issues.filter((i) => i.heatmapScore > 70 && i.heatmapScore <= 85).length,
        low: cluster.issues.filter((i) => i.heatmapScore <= 70).length,
      },
      departmentBreakdown: cluster.issues.reduce((acc: Record<string, number>, issue) => {
        const dept = issue.department || 'Unassigned';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {}),
      initiativeProgress: {
        total: cluster.initiatives.length,
        active: cluster.initiatives.filter((i) => i.status === 'ACTIVE').length,
        completed: cluster.initiatives.filter((i) => i.status === 'COMPLETED').length,
        averageProgress:
          cluster.initiatives.length > 0
            ? Math.round(
                cluster.initiatives.reduce((sum, init) => sum + init.progress, 0) /
                  cluster.initiatives.length
              )
            : 0,
      },
    };

    // Strategic recommendations based on cluster analysis
    const recommendations = generateClusterRecommendations(cluster, analytics);

    return NextResponse.json({
      success: true,
      cluster: {
        ...cluster,
        analytics,
        recommendations,
      },
    });
  } catch (error) {
    console.error('Failed to fetch cluster:', error);
    return NextResponse.json({ error: 'Failed to fetch cluster details' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions for cluster management
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body: ClusterUpdateRequest = await request.json();

    const updatedCluster = await prisma.issueCluster.update({
      where: { id: params.id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description && { description: body.description }),
        ...(body.severity && { severity: body.severity }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.color && { color: body.color }),
        updatedAt: new Date(),
      },
      include: {
        issues: true,
        initiatives: true,
      },
    });

    // Log the cluster update
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CLUSTER_UPDATED',
        details: {
          clusterId: params.id,
          clusterName: updatedCluster.name,
          changes: body as any,
          timestamp: new Date().toISOString(),
        } as any,
      },
    });

    return NextResponse.json({
      success: true,
      cluster: updatedCluster,
    });
  } catch (error) {
    console.error('Failed to update cluster:', error);
    return NextResponse.json({ error: 'Failed to update cluster' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if cluster has associated issues or initiatives
    const cluster = await prisma.issueCluster.findUnique({
      where: { id: params.id },
      include: {
        issues: true,
        initiatives: true,
      },
    });

    if (!cluster) {
      return NextResponse.json({ error: 'Cluster not found' }, { status: 404 });
    }

    if (cluster.issues.length > 0 || cluster.initiatives.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete cluster with associated issues or initiatives',
        },
        { status: 400 }
      );
    }

    await prisma.issueCluster.delete({
      where: { id: params.id },
    });

    // Log the cluster deletion
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CLUSTER_DELETED',
        details: {
          clusterId: params.id,
          clusterName: cluster.name,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Cluster deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete cluster:', error);
    return NextResponse.json({ error: 'Failed to delete cluster' }, { status: 500 });
  }
}

function generateClusterRecommendations(cluster: any, analytics: any) {
  const recommendations = [];

  // High-impact cluster with many issues
  if (analytics.totalIssues >= 5 && analytics.averageScore > 80) {
    recommendations.push({
      type: 'strategic',
      priority: 'high',
      title: 'Strategic Initiative Needed',
      description: `This cluster has ${analytics.totalIssues} high-impact issues (avg score: ${analytics.averageScore}). Consider creating a comprehensive strategic initiative to address the root causes.`,
      action: 'create_strategic_initiative',
      estimatedImpact: 'High - addresses multiple high-priority issues simultaneously',
    });
  }

  // Cross-departmental coordination needed
  const deptCount = Object.keys(analytics.departmentBreakdown).length;
  if (deptCount >= 3) {
    recommendations.push({
      type: 'coordination',
      priority: 'medium',
      title: 'Cross-Departmental Coordination',
      description: `Issues span ${deptCount} departments. Cross-functional team coordination will be essential for successful resolution.`,
      action: 'assign_cross_functional_team',
      estimatedImpact: 'Medium - improves collaboration and reduces silos',
    });
  }

  // Low initiative coverage
  if (analytics.totalIssues > 3 && analytics.initiativeProgress.total < 2) {
    recommendations.push({
      type: 'coverage',
      priority: 'medium',
      title: 'Insufficient Initiative Coverage',
      description: `${analytics.totalIssues} issues but only ${analytics.initiativeProgress.total} initiatives. More initiatives may be needed to address all cluster issues.`,
      action: 'create_additional_initiatives',
      estimatedImpact: 'Medium - ensures comprehensive issue resolution',
    });
  }

  // High-severity cluster needs urgent attention
  if (cluster.severity === 'high' && analytics.initiativeProgress.active === 0) {
    recommendations.push({
      type: 'urgency',
      priority: 'high',
      title: 'Urgent Action Required',
      description:
        'High-severity cluster with no active initiatives. Immediate action needed to prevent business impact.',
      action: 'create_urgent_initiative',
      estimatedImpact: 'High - prevents potential business disruption',
    });
  }

  // Successful cluster pattern recognition
  if (analytics.initiativeProgress.averageProgress > 75) {
    recommendations.push({
      type: 'success',
      priority: 'low',
      title: 'Successful Cluster Pattern',
      description:
        'This cluster shows excellent progress. Consider replicating successful approaches in other clusters.',
      action: 'document_best_practices',
      estimatedImpact: 'Medium - enables knowledge transfer to other clusters',
    });
  }

  return recommendations;
}
