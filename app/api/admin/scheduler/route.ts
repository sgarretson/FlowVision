import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ExecutiveBriefScheduler } from '@/lib/scheduler';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const action = body.action;

    const scheduler = ExecutiveBriefScheduler.getInstance();

    switch (action) {
      case 'start':
        scheduler.start();
        return NextResponse.json({ success: true, message: 'Scheduler started' });

      case 'stop':
        scheduler.stop();
        return NextResponse.json({ success: true, message: 'Scheduler stopped' });

      case 'status':
        return NextResponse.json({
          success: true,
          status: 'running', // In production, track actual status
          message: 'Scheduler status retrieved',
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Scheduler control failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
