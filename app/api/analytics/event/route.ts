import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { event, metadata } = body || {};

    if (!event || typeof event !== 'string' || event.length > 64) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });

    await prisma.auditLog.create({
      data: {
        userId: user?.id || undefined,
        action: `ANALYTICS_${event.toUpperCase()}`.slice(0, 64),
        details: typeof metadata === 'object' && metadata !== null ? (metadata as any) : {},
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
