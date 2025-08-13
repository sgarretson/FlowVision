import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updates
const UpdateSolutionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  type: z.enum(['TECHNOLOGY', 'PROCESS', 'TRAINING', 'POLICY']).optional(),
  status: z.enum(['DRAFT', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.number().int().min(0).optional(),
  estimatedCost: z.number().positive().optional(),
  estimatedHours: z.number().int().positive().optional(),
  actualCost: z.number().positive().optional(),
  actualHours: z.number().int().positive().optional(),
  plannedStartDate: z.string().datetime().optional(),
  plannedEndDate: z.string().datetime().optional(),
  actualStartDate: z.string().datetime().optional(),
  actualEndDate: z.string().datetime().optional(),
  assignedToId: z.string().cuid().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  isValidated: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/solutions/[id]
 * Get a specific solution with full details
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const solution = await prisma.initiativeSolution.findUnique({
      where: { id: params.id },
      include: {
        initiative: {
          select: {
            id: true,
            title: true,
            ownerId: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tasks: {
          orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        dependencies: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        dependents: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    if (!solution) {
      return NextResponse.json({ error: 'Solution not found' }, { status: 404 });
    }

    // Check access rights
    if (user.role !== 'ADMIN' && solution.initiative.ownerId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Calculate task statistics
    const taskStats = {
      total: solution.tasks.length,
      completed: solution.tasks.filter((t) => t.status === 'COMPLETED').length,
      inProgress: solution.tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      todo: solution.tasks.filter((t) => t.status === 'TODO').length,
      totalEstimatedHours: solution.tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
      totalActualHours: solution.tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0),
      averageProgress:
        solution.tasks.length > 0
          ? Math.round(
              solution.tasks.reduce((sum, t) => sum + t.progress, 0) / solution.tasks.length
            )
          : 0,
    };

    // Calculate time tracking
    const timeTracking = {
      estimatedDuration:
        solution.plannedStartDate && solution.plannedEndDate
          ? Math.ceil(
              (new Date(solution.plannedEndDate).getTime() -
                new Date(solution.plannedStartDate).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : null,
      actualDuration:
        solution.actualStartDate && solution.actualEndDate
          ? Math.ceil(
              (new Date(solution.actualEndDate).getTime() -
                new Date(solution.actualStartDate).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : null,
      daysRemaining: solution.plannedEndDate
        ? Math.ceil(
            (new Date(solution.plannedEndDate).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null,
    };

    const solutionWithStats = {
      ...solution,
      taskStats,
      timeTracking,
    };

    return NextResponse.json({
      success: true,
      solution: solutionWithStats,
    });
  } catch (error) {
    console.error('Error fetching solution:', error);
    return NextResponse.json({ error: 'Failed to fetch solution' }, { status: 500 });
  }
}

/**
 * PUT /api/solutions/[id]
 * Update a solution
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = UpdateSolutionSchema.parse(body);

    // Check if solution exists and user has access
    const existingSolution = await prisma.initiativeSolution.findUnique({
      where: { id: params.id },
      include: {
        initiative: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!existingSolution) {
      return NextResponse.json({ error: 'Solution not found' }, { status: 404 });
    }

    // Check access rights
    if (user.role !== 'ADMIN' && existingSolution.initiative.ownerId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Validate assigned user if provided
    if (validatedData.assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: validatedData.assignedToId },
        select: { id: true },
      });

      if (!assignedUser) {
        return NextResponse.json({ error: 'Assigned user not found' }, { status: 400 });
      }
    }

    // Validate dates if provided
    const plannedStartDate = validatedData.plannedStartDate
      ? new Date(validatedData.plannedStartDate)
      : undefined;
    const plannedEndDate = validatedData.plannedEndDate
      ? new Date(validatedData.plannedEndDate)
      : undefined;
    const actualStartDate = validatedData.actualStartDate
      ? new Date(validatedData.actualStartDate)
      : undefined;
    const actualEndDate = validatedData.actualEndDate
      ? new Date(validatedData.actualEndDate)
      : undefined;

    if (plannedStartDate && plannedEndDate && plannedStartDate >= plannedEndDate) {
      return NextResponse.json(
        { error: 'Planned end date must be after start date' },
        { status: 400 }
      );
    }

    if (actualStartDate && actualEndDate && actualStartDate >= actualEndDate) {
      return NextResponse.json(
        { error: 'Actual end date must be after start date' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = { ...validatedData };
    if (validatedData.plannedStartDate) updateData.plannedStartDate = plannedStartDate;
    if (validatedData.plannedEndDate) updateData.plannedEndDate = plannedEndDate;
    if (validatedData.actualStartDate) updateData.actualStartDate = actualStartDate;
    if (validatedData.actualEndDate) updateData.actualEndDate = actualEndDate;

    // Handle validation fields
    if (validatedData.isValidated !== undefined) {
      updateData.validatedBy = validatedData.isValidated ? user.id : null;
      updateData.validatedAt = validatedData.isValidated ? new Date() : null;
    }

    // Auto-set actual start date when moving to IN_PROGRESS
    if (
      validatedData.status === 'IN_PROGRESS' &&
      !existingSolution.actualStartDate &&
      !actualStartDate
    ) {
      updateData.actualStartDate = new Date();
    }

    // Auto-set actual end date when moving to COMPLETED
    if (validatedData.status === 'COMPLETED' && !existingSolution.actualEndDate && !actualEndDate) {
      updateData.actualEndDate = new Date();
      updateData.progress = 100;
    }

    const updatedSolution = await prisma.initiativeSolution.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        initiative: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      solution: updatedSolution,
      message: 'Solution updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating solution:', error);
    return NextResponse.json({ error: 'Failed to update solution' }, { status: 500 });
  }
}

/**
 * DELETE /api/solutions/[id]
 * Delete a solution and all its tasks
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if solution exists and user has access
    const solution = await prisma.initiativeSolution.findUnique({
      where: { id: params.id },
      include: {
        initiative: {
          select: {
            ownerId: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!solution) {
      return NextResponse.json({ error: 'Solution not found' }, { status: 404 });
    }

    // Check access rights (stricter for deletion)
    if (user.role !== 'ADMIN' && solution.initiative.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Admin or owner access required for deletion' },
        { status: 403 }
      );
    }

    // Check if solution has tasks
    if (solution._count.tasks > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete solution with existing tasks',
          taskCount: solution._count.tasks,
          message: 'Please delete all tasks first or use cascade deletion if intended',
        },
        { status: 409 }
      );
    }

    // Delete the solution (tasks will be deleted via cascade)
    await prisma.initiativeSolution.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Solution deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting solution:', error);
    return NextResponse.json({ error: 'Failed to delete solution' }, { status: 500 });
  }
}
