import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const initiative = await prisma.initiative.findFirst({ where: { id: params.id, ownerId: user.id } });
  if (!initiative) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  return NextResponse.json(initiative);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { title, problem, goal, kpis, timelineStart, timelineEnd, status, progress } = body ?? {};
  const updated = await prisma.initiative.update({
    where: { id: params.id },
    data: {
      title,
      problem,
      goal,
      kpis,
      timelineStart: timelineStart ? new Date(timelineStart) : null,
      timelineEnd: timelineEnd ? new Date(timelineEnd) : null,
      status,
      progress,
    },
  });
  await prisma.auditLog.create({ data: { userId: user.id, action: 'INITIATIVE_UPDATE', details: { id: params.id } } });
  return NextResponse.json(updated);
}
