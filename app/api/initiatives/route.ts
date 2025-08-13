import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { scoreDifficulty, scoreROI, scorePriority } from '@/utils/ai';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json([], { status: 200 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json([], { status: 200 });

  // Admin users can see all initiatives, others see only their own
  const whereClause = user.role === 'ADMIN' ? {} : { ownerId: user.id };

  const initiatives = await prisma.initiative.findMany({
    where: whereClause,
    orderBy: { orderIndex: 'asc' },
    include: {
      owner: {
        select: {
          name: true,
          email: true,
        },
      },
    },
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
