import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { SolutionType, SolutionStatus } from '@prisma/client';
import { z } from 'zod';

// Validation schemas
const CreateSolutionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  type: z.enum(['TECHNOLOGY', 'PROCESS', 'TRAINING', 'POLICY']),
  priority: z.number().int().min(0).optional(),
  estimatedCost: z.number().positive().optional(),
  estimatedHours: z.number().int().positive().optional(),
  plannedStartDate: z.string().datetime().optional(),
  plannedEndDate: z.string().datetime().optional(),
  assignedToId: z.string().cuid().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  isAIGenerated: z.boolean().optional(),
  aiConfidence: z.number().int().min(0).max(100).optional(),
  aiReasoning: z.string().optional(),
  sourceType: z.string().optional(),
  sourceId: z.string().optional(),
});

/**
 * GET /api/initiatives/[id]/solutions
 * Get all solutions for an initiative
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as SolutionStatus | null;
    const type = searchParams.get('type') as SolutionType | null;
    const assignedToId = searchParams.get('assignedToId');
    const includeCompleted = searchParams.get('includeCompleted') === 'true';
    const includeTasks = searchParams.get('includeTasks') === 'true';

    // Verify user has access to the initiative
    const initiative = await prisma.initiative.findUnique({
      where: { id: params.id },
      select: { id: true, ownerId: true, title: true },
    });

    if (!initiative) {
      return NextResponse.json({ error: 'Initiative not found' }, { status: 404 });
    }

    // Check access rights
    if (user.role !== 'ADMIN' && initiative.ownerId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build where clause
    const where: any = {
      initiativeId: params.id,
    };

    if (status) {
      where.status = status;
    } else if (!includeCompleted) {
      where.status = { not: 'COMPLETED' };
    }

    if (type) {
      where.type = type;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    // Build include clause
    const include: any = {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          tasks: true,
        },
      },
    };

    if (includeTasks) {
      include.tasks = {
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
      };
    }

    const solutions = await prisma.initiativeSolution.findMany({
      where,
      include,
      orderBy: [{ priority: 'desc' }, { status: 'asc' }, { createdAt: 'asc' }],
    });

    // Calculate progress statistics
    const stats = {
      total: solutions.length,
      byStatus: solutions.reduce(
        (acc, solution) => {
          acc[solution.status] = (acc[solution.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      byType: solutions.reduce(
        (acc, solution) => {
          acc[solution.type] = (acc[solution.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      totalEstimatedCost: solutions.reduce((sum, s) => sum + (s.estimatedCost || 0), 0),
      totalEstimatedHours: solutions.reduce((sum, s) => sum + (s.estimatedHours || 0), 0),
      averageProgress:
        solutions.length > 0
          ? Math.round(solutions.reduce((sum, s) => sum + s.progress, 0) / solutions.length)
          : 0,
    };

    return NextResponse.json({
      success: true,
      solutions,
      stats,
      initiative: {
        id: initiative.id,
        title: initiative.title,
      },
    });
  } catch (error) {
    console.error('Error fetching solutions:', error);
    return NextResponse.json({ error: 'Failed to fetch solutions' }, { status: 500 });
  }
}

/**
 * POST /api/initiatives/[id]/solutions
 * Create a new solution for an initiative
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CreateSolutionSchema.parse(body);

    // Verify user has access to the initiative
    const initiative = await prisma.initiative.findUnique({
      where: { id: params.id },
      select: { id: true, ownerId: true, title: true },
    });

    if (!initiative) {
      return NextResponse.json({ error: 'Initiative not found' }, { status: 404 });
    }

    // Check access rights
    if (user.role !== 'ADMIN' && initiative.ownerId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Validate assigned user if provided
    if (validatedData.assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: validatedData.assignedToId },
        select: { id: true, name: true },
      });

      if (!assignedUser) {
        return NextResponse.json({ error: 'Assigned user not found' }, { status: 400 });
      }
    }

    // Validate dates
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

    // Create the solution
    const solution = await prisma.initiativeSolution.create({
      data: {
        ...validatedData,
        initiativeId: params.id,
        plannedStartDate: validatedData.plannedStartDate
          ? new Date(validatedData.plannedStartDate)
          : null,
        plannedEndDate: validatedData.plannedEndDate
          ? new Date(validatedData.plannedEndDate)
          : null,
        tags: validatedData.tags || [],
      },
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
      solution,
      message: 'Solution created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating solution:', error);
    return NextResponse.json({ error: 'Failed to create solution' }, { status: 500 });
  }
}
