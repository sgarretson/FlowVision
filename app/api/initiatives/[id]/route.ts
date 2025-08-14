import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  console.log('GET /api/initiatives/[id] called with ID:', params.id);

  const session = await getServerSession(authOptions);
  console.log('Session:', session ? 'exists' : 'null');

  if (!session?.user?.email) {
    console.log('No session or email, returning 401');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  console.log('User found:', user ? `${user.email} (${user.role})` : 'null');

  if (!user) {
    console.log('User not found, returning 401');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse include parameter from query string
  const { searchParams } = new URL(req.url);
  const includeParam = searchParams.get('include');
  const includes = includeParam ? includeParam.split(',') : [];

  // Admin users can access all initiatives, others only their own
  const whereClause =
    user.role === 'ADMIN' ? { id: params.id } : { id: params.id, ownerId: user.id };

  // Build include object based on requested includes
  const includeClause: any = {
    owner: {
      select: {
        name: true,
        email: true,
        role: true,
      },
    },
    cluster: {
      select: {
        id: true,
        name: true,
        category: true,
        severity: true,
      },
    },
    milestones: {
      orderBy: { dueDate: 'asc' },
    },
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
  };

  // Add optional includes
  if (includes.includes('addressedIssues')) {
    includeClause.addressedIssues = {
      select: {
        id: true,
        description: true,
        category: true,
        status: true,
        votes: true,
        heatmapScore: true,
        createdAt: true,
      },
      orderBy: { heatmapScore: 'desc' },
    };
  }

  console.log('Looking for initiative with where clause:', whereClause);

  const initiative = await prisma.initiative.findFirst({
    where: whereClause,
    include: includeClause,
  });

  console.log('Initiative found:', initiative ? `${initiative.title}` : 'null');

  if (!initiative) {
    console.log('Initiative not found, returning 404');
    return NextResponse.json({ error: 'Initiative not found or access denied' }, { status: 404 });
  }

  console.log('Returning initiative data');
  return NextResponse.json(initiative);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify initiative exists and user has permission to edit
  const existingInitiative = await prisma.initiative.findFirst({
    where: user.role === 'ADMIN' ? { id: params.id } : { id: params.id, ownerId: user.id },
  });

  if (!existingInitiative) {
    return NextResponse.json({ error: 'Initiative not found or access denied' }, { status: 404 });
  }

  const body = await req.json();
  const {
    title,
    problem,
    goal,
    kpis,
    requirements,
    acceptanceCriteria,
    timelineStart,
    timelineEnd,
    status,
    progress,
  } = body ?? {};

  const updated = await prisma.initiative.update({
    where: { id: params.id },
    data: {
      title,
      problem,
      goal,
      kpis,
      requirements,
      acceptanceCriteria,
      timelineStart: timelineStart ? new Date(timelineStart) : null,
      timelineEnd: timelineEnd ? new Date(timelineEnd) : null,
      status,
      progress,
    },
  });
  await prisma.auditLog.create({
    data: { userId: user.id, action: 'INITIATIVE_UPDATE', details: { id: params.id } },
  });
  return NextResponse.json(updated);
}
