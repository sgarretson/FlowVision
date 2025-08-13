import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updates
const UpdateSystemImpactSchema = z.object({
  impactLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  description: z.string().optional(),
  isValidated: z.boolean().optional(),
  validatedBy: z.string().optional(),
  priority: z.number().optional(),
});

/**
 * GET /api/systems/impacts/[id]
 * Get a specific system impact with full details
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const impact = await prisma.issueSystemImpact.findUnique({
      where: { id: params.id },
      include: {
        issue: {
          select: {
            id: true,
            description: true,
            heatmapScore: true,
            votes: true,
            department: true,
            category: true,
            createdAt: true,
          },
        },
        systemCategory: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            color: true,
            tags: true,
            parent: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!impact) {
      return NextResponse.json({ error: 'System impact not found' }, { status: 404 });
    }

    // Get related impacts for the same system category
    const relatedImpacts = await prisma.issueSystemImpact.findMany({
      where: {
        systemCategoryId: impact.systemCategoryId,
        id: { not: params.id },
      },
      include: {
        issue: {
          select: {
            id: true,
            description: true,
            heatmapScore: true,
            votes: true,
          },
        },
      },
      take: 5,
      orderBy: [{ impactLevel: 'desc' }, { createdAt: 'desc' }],
    });

    // Get system category analytics
    const systemAnalytics = await prisma.issueSystemImpact.groupBy({
      by: ['impactLevel'],
      where: {
        systemCategoryId: impact.systemCategoryId,
      },
      _count: true,
      _avg: {
        priority: true,
      },
    });

    const impactWithAnalytics = {
      ...impact,
      relatedImpacts,
      systemAnalytics: {
        totalImpacts: systemAnalytics.reduce((sum, group) => sum + group._count, 0),
        averagePriority:
          systemAnalytics.reduce((sum, group) => sum + (group._avg.priority || 0), 0) /
          systemAnalytics.length,
        impactBreakdown: systemAnalytics.reduce(
          (acc, group) => {
            acc[group.impactLevel.toLowerCase()] = group._count;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
    };

    return NextResponse.json({
      success: true,
      impact: impactWithAnalytics,
    });
  } catch (error) {
    console.error('Error fetching system impact:', error);
    return NextResponse.json({ error: 'Failed to fetch system impact' }, { status: 500 });
  }
}

/**
 * PUT /api/systems/impacts/[id]
 * Update a system impact
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = UpdateSystemImpactSchema.parse(body);

    // Check if impact exists
    const existingImpact = await prisma.issueSystemImpact.findUnique({
      where: { id: params.id },
    });

    if (!existingImpact) {
      return NextResponse.json({ error: 'System impact not found' }, { status: 404 });
    }

    // If validating, set validation fields
    const updateData: any = { ...validatedData };
    if (validatedData.isValidated) {
      updateData.validatedBy = user.id;
      updateData.validatedAt = new Date();
    }

    const updatedImpact = await prisma.issueSystemImpact.update({
      where: { id: params.id },
      data: updateData,
      include: {
        issue: {
          select: {
            id: true,
            description: true,
            heatmapScore: true,
          },
        },
        systemCategory: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      impact: updatedImpact,
      message: 'System impact updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating system impact:', error);
    return NextResponse.json({ error: 'Failed to update system impact' }, { status: 500 });
  }
}

/**
 * DELETE /api/systems/impacts/[id]
 * Delete a system impact
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if impact exists
    const impact = await prisma.issueSystemImpact.findUnique({
      where: { id: params.id },
    });

    if (!impact) {
      return NextResponse.json({ error: 'System impact not found' }, { status: 404 });
    }

    // Delete the impact
    await prisma.issueSystemImpact.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'System impact deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting system impact:', error);
    return NextResponse.json({ error: 'Failed to delete system impact' }, { status: 500 });
  }
}
