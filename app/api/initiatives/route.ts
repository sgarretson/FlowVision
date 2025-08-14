import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { scoreDifficulty, scoreROI, scorePriority } from '@/utils/ai';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json([], { status: 200 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json([], { status: 200 });

  // Admin users can see all initiatives, others see only their own
  const whereClause = user.role === 'ADMIN' ? {} : { ownerId: user.id };

  // Parse include parameter from query string
  const { searchParams } = new URL(request.url);
  const includeParam = searchParams.get('include');
  const includes = includeParam ? includeParam.split(',') : [];

  // Build include object based on requested includes
  const includeClause: any = {
    owner: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  };

  if (includes.includes('solutions') || includes.includes('tasks')) {
    includeClause.solutions = {
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tasks: includes.includes('tasks')
          ? {
              include: {
                assignedTo: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: { priority: 'desc' },
            }
          : false,
      },
      orderBy: { priority: 'desc' },
    };
  }

  if (includes.includes('assignments')) {
    includeClause.assignments = {
      include: {
        team: {
          select: {
            id: true,
            name: true,
            department: true,
          },
        },
      },
    };
  }

  if (includes.includes('milestones')) {
    includeClause.milestones = {
      orderBy: { dueDate: 'asc' },
    };
  }

  const initiatives = await prisma.initiative.findMany({
    where: whereClause,
    orderBy: { orderIndex: 'asc' },
    include: includeClause,
  });

  return NextResponse.json(initiatives);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { title, problem, goal, kpis = [], cost = 0, gain = 0 } = body ?? {};
  const profile = await prisma.businessProfile.findUnique({ where: { userId: user.id } });
  const difficulty = scoreDifficulty(`${title} ${problem}`, {
    industry: profile?.industry || 'Unknown',
    size: profile?.size || 0,
    metrics: (profile?.metrics as any) || {},
  });
  const roi = scoreROI(cost, gain);
  const priorityScore = scorePriority(difficulty, roi);

  const count = await prisma.initiative.count({ where: { ownerId: user.id } });
  const created = await prisma.initiative.create({
    data: {
      title,
      problem,
      goal,
      kpis,
      ownerId: user.id,
      status: 'Define',
      progress: 0,
      difficulty,
      roi,
      priorityScore,
      orderIndex: count,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'INITIATIVE_CREATE',
      details: { id: created.id, title },
    },
  });

  return NextResponse.json(created, { status: 201 });
}
