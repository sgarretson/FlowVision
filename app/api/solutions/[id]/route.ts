import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updates
const UpdateSolutionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  type: z.enum(['TECHNOLOGY', 'PROCESS', 'TRAINING', 'POLICY']).optional(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.number().int().min(0).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  estimatedCost: z.number().positive().optional(),
  estimatedHours: z.number().int().positive().optional(),
  actualCost: z.number().positive().optional(),
  actualHours: z.number().int().positive().optional(),
  plannedStartDate: z.string().datetime().optional(),
  plannedEndDate: z.string().datetime().optional(),
  actualStartDate: z.string().datetime().optional(),
  assignedToId: z.string().cuid().optional(),
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
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: [{ priority: 'desc' }, { status: 'asc' }, { createdAt: 'asc' }],
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

    // Check access rights
    if (user.role !== 'ADMIN' && solution.initiative.ownerId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Calculate solution statistics
    const stats = {
      totalTasks: solution.tasks.length,
      tasksByStatus: solution.tasks.reduce(
        (acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      totalEstimatedHours: solution.tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
      totalActualHours: solution.tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0),
      averageTaskProgress:
        solution.tasks.length > 0
          ? Math.round(
              solution.tasks.reduce((sum, t) => sum + t.progress, 0) / solution.tasks.length
            )
          : 0,
      overdueTasks: solution.tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED'
      ).length,
    };

    // Calculate time tracking
    const timeTracking = {
      isOverdue:
        solution.plannedEndDate &&
        new Date(solution.plannedEndDate) < new Date() &&
        solution.status !== 'COMPLETED',
      daysRemaining: solution.plannedEndDate
        ? Math.ceil(
            (new Date(solution.plannedEndDate).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null,
      hoursVariance:
        solution.estimatedHours && solution.actualHours
          ? solution.actualHours - solution.estimatedHours
          : null,
      efficiency:
        solution.estimatedHours && solution.actualHours && solution.estimatedHours > 0
          ? Math.round((solution.estimatedHours / solution.actualHours) * 100)
          : null,
    };

    const solutionWithDetails = {
      ...solution,
      stats,
      timeTracking,
    };

    return NextResponse.json({
      success: true,
      solution: solutionWithDetails,
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
    if (validatedData.plannedStartDate && validatedData.plannedEndDate) {
      const startDate = new Date(validatedData.plannedStartDate);
      const endDate = new Date(validatedData.plannedEndDate);

      if (startDate >= endDate) {
        return NextResponse.json(
          { error: 'Planned end date must be after start date' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = { ...validatedData };
    if (validatedData.plannedStartDate) {
      updateData.plannedStartDate = new Date(validatedData.plannedStartDate);
    }
    if (validatedData.plannedEndDate) {
      updateData.plannedEndDate = new Date(validatedData.plannedEndDate);
    }
    if (validatedData.actualStartDate) {
      updateData.actualStartDate = new Date(validatedData.actualStartDate);
    }

    // Auto-set completion date when moving to COMPLETED
    if (validatedData.status === 'COMPLETED' && existingSolution.status !== 'COMPLETED') {
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

    // Delete all tasks first (cascade should handle this, but being explicit)
    await prisma.solutionTask.deleteMany({
      where: { solutionId: params.id },
    });

    // Delete the solution
    await prisma.initiativeSolution.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: `Solution deleted successfully${solution._count.tasks > 0 ? ` along with ${solution._count.tasks} tasks` : ''}`,
      deletedTasksCount: solution._count.tasks,
    });
  } catch (error) {
    console.error('Error deleting solution:', error);
    return NextResponse.json({ error: 'Failed to delete solution' }, { status: 500 });
  }
}
