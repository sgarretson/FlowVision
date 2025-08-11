import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { ids } = await req.json();
  if (!Array.isArray(ids)) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  await prisma.$transaction(
    ids.map((id: string, index: number) =>
      prisma.initiative.update({ where: { id }, data: { orderIndex: index } })
    )
  );
  await prisma.auditLog.create({
    data: { userId: user.id, action: 'INITIATIVE_REORDER', details: { ids } },
  });
  return NextResponse.json({ ok: true });
}
