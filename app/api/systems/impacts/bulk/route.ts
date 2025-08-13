import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas for bulk operations
const BulkUpdateImpactsSchema = z.object({
  impactIds: z.array(z.string().cuid()),
  updates: z.object({
    impactLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    isValidated: z.boolean().optional(),
    priority: z.number().optional(),
  }),
});

const BulkDeleteImpactsSchema = z.object({
  impactIds: z.array(z.string().cuid()),
  confirm: z.boolean(),
});

const BulkValidateImpactsSchema = z.object({
  impactIds: z.array(z.string().cuid()),
  isValidated: z.boolean(),
});

/**
 * PUT /api/systems/impacts/bulk
 * Bulk update system impacts
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = BulkUpdateImpactsSchema.parse(body);

    if (validatedData.impactIds.length === 0) {
      return NextResponse.json({ error: 'No impact IDs provided' }, { status: 400 });
    }

    if (validatedData.impactIds.length > 100) {
      return NextResponse.json(
        { error: 'Cannot update more than 100 impacts at once' },
        { status: 400 }
      );
    }

    // Verify all impacts exist and user has access
    const existingImpacts = await prisma.issueSystemImpact.findMany({
      where: {
        id: {
          in: validatedData.impactIds,
        },
      },
      select: {
        id: true,
        issueId: true,
      },
    });

    if (existingImpacts.length !== validatedData.impactIds.length) {
      return NextResponse.json(
        { error: 'Some impacts not found or access denied' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = { ...validatedData.updates };
    if (validatedData.updates.isValidated) {
      updateData.validatedBy = user.id;
      updateData.validatedAt = new Date();
    }

    // Perform bulk update
    const result = await prisma.issueSystemImpact.updateMany({
      where: {
        id: {
          in: validatedData.impactIds,
        },
      },
      data: updateData,
    });

    // Get updated impacts for response
    const updatedImpacts = await prisma.issueSystemImpact.findMany({
      where: {
        id: {
          in: validatedData.impactIds,
        },
      },
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
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      impacts: updatedImpacts,
      message: `Successfully updated ${result.count} system impacts`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error bulk updating system impacts:', error);
    return NextResponse.json({ error: 'Failed to bulk update system impacts' }, { status: 500 });
  }
}

/**
 * DELETE /api/systems/impacts/bulk
 * Bulk delete system impacts
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can bulk delete
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required for bulk deletion' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = BulkDeleteImpactsSchema.parse(body);

    if (!validatedData.confirm) {
      return NextResponse.json(
        { error: 'Confirmation required for bulk deletion' },
        { status: 400 }
      );
    }

    if (validatedData.impactIds.length === 0) {
      return NextResponse.json({ error: 'No impact IDs provided' }, { status: 400 });
    }

    if (validatedData.impactIds.length > 50) {
      return NextResponse.json(
        { error: 'Cannot delete more than 50 impacts at once' },
        { status: 400 }
      );
    }

    // Verify all impacts exist
    const existingImpacts = await prisma.issueSystemImpact.findMany({
      where: {
        id: {
          in: validatedData.impactIds,
        },
      },
      select: {
        id: true,
        issue: {
          select: {
            id: true,
            description: true,
          },
        },
        systemCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (existingImpacts.length !== validatedData.impactIds.length) {
      return NextResponse.json({ error: 'Some impacts not found' }, { status: 404 });
    }

    // Perform bulk deletion
    const result = await prisma.issueSystemImpact.deleteMany({
      where: {
        id: {
          in: validatedData.impactIds,
        },
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      deletedImpacts: existingImpacts,
      message: `Successfully deleted ${result.count} system impacts`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error bulk deleting system impacts:', error);
    return NextResponse.json({ error: 'Failed to bulk delete system impacts' }, { status: 500 });
  }
}

/**
 * POST /api/systems/impacts/bulk
 * Bulk validate system impacts
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = BulkValidateImpactsSchema.parse(body);

    if (validatedData.impactIds.length === 0) {
      return NextResponse.json({ error: 'No impact IDs provided' }, { status: 400 });
    }

    if (validatedData.impactIds.length > 100) {
      return NextResponse.json(
        { error: 'Cannot validate more than 100 impacts at once' },
        { status: 400 }
      );
    }

    // Verify all impacts exist
    const existingImpacts = await prisma.issueSystemImpact.findMany({
      where: {
        id: {
          in: validatedData.impactIds,
        },
      },
      select: {
        id: true,
        isValidated: true,
      },
    });

    if (existingImpacts.length !== validatedData.impactIds.length) {
      return NextResponse.json({ error: 'Some impacts not found' }, { status: 404 });
    }

    // Prepare validation data
    const validationData: any = {
      isValidated: validatedData.isValidated,
    };

    if (validatedData.isValidated) {
      validationData.validatedBy = user.id;
      validationData.validatedAt = new Date();
    } else {
      validationData.validatedBy = null;
      validationData.validatedAt = null;
    }

    // Perform bulk validation update
    const result = await prisma.issueSystemImpact.updateMany({
      where: {
        id: {
          in: validatedData.impactIds,
        },
      },
      data: validationData,
    });

    // Get updated impacts for response
    const updatedImpacts = await prisma.issueSystemImpact.findMany({
      where: {
        id: {
          in: validatedData.impactIds,
        },
      },
      include: {
        issue: {
          select: {
            id: true,
            description: true,
          },
        },
        systemCategory: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    const action = validatedData.isValidated ? 'validated' : 'unvalidated';

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      impacts: updatedImpacts,
      message: `Successfully ${action} ${result.count} system impacts`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error bulk validating system impacts:', error);
    return NextResponse.json({ error: 'Failed to bulk validate system impacts' }, { status: 500 });
  }
}
