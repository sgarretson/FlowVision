import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { scoreDifficulty, scoreROI, scorePriority } from '@/utils/ai';
import { secureApiRoute, logSecurityEvent } from '@/lib/rbac-middleware';

export const GET = secureApiRoute(
  async (req: NextRequest, { user }) => {
    try {
      // Log access for audit trail
      await logSecurityEvent('INITIATIVES_ACCESS', user.id, {
        userAgent: req.headers.get('user-agent'),
        ip: req.headers.get('x-forwarded-for') || 'unknown',
      });

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
    } catch (error) {
      console.error('Initiatives fetch error:', error);
      await logSecurityEvent(
        'INITIATIVES_ERROR',
        user.id,
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        'error'
      );
      return NextResponse.json({ error: 'Failed to fetch initiatives' }, { status: 500 });
    }
  },
  {
    allowedRoles: ['ADMIN', 'LEADER'],
  }
);

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
