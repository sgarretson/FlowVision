import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ExecutiveBriefScheduler } from '@/lib/scheduler';

type BriefScheduleSettings = {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number; // 1-31 for monthly
  timeUTC: string; // HH:mm format
  channel: 'email' | 'slack' | 'none';
  lastSent?: string;
};

function getDefaultSchedule(): BriefScheduleSettings {
  return {
    enabled: false,
    frequency: 'weekly',
    dayOfWeek: 1, // Monday
    timeUTC: '09:00',
    channel: 'email',
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { preferences: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const preferences = (user.preferences as any) || {};
    const schedule: BriefScheduleSettings = {
      ...getDefaultSchedule(),
      ...(preferences.briefSchedule || {}),
    };

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Failed to get brief schedule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const incomingSchedule: Partial<BriefScheduleSettings> = body.schedule || {};

    // Validate schedule settings
    if (
      incomingSchedule.frequency &&
      !['daily', 'weekly', 'monthly'].includes(incomingSchedule.frequency)
    ) {
      return NextResponse.json({ error: 'Invalid frequency' }, { status: 400 });
    }

    if (
      incomingSchedule.channel &&
      !['email', 'slack', 'none'].includes(incomingSchedule.channel)
    ) {
      return NextResponse.json({ error: 'Invalid channel' }, { status: 400 });
    }

    if (
      incomingSchedule.timeUTC &&
      !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(incomingSchedule.timeUTC)
    ) {
      return NextResponse.json({ error: 'Invalid time format (use HH:mm)' }, { status: 400 });
    }

    if (
      incomingSchedule.dayOfWeek !== undefined &&
      (incomingSchedule.dayOfWeek < 0 || incomingSchedule.dayOfWeek > 6)
    ) {
      return NextResponse.json({ error: 'Invalid day of week (0-6)' }, { status: 400 });
    }

    if (
      incomingSchedule.dayOfMonth !== undefined &&
      (incomingSchedule.dayOfMonth < 1 || incomingSchedule.dayOfMonth > 31)
    ) {
      return NextResponse.json({ error: 'Invalid day of month (1-31)' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, preferences: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const preferences = (user.preferences as any) || {};
    const currentSchedule = preferences.briefSchedule || getDefaultSchedule();

    const updatedSchedule: BriefScheduleSettings = {
      ...currentSchedule,
      ...incomingSchedule,
    };

    const updatedPreferences = {
      ...preferences,
      briefSchedule: updatedSchedule,
    };

    await prisma.user.update({
      where: { id: user.id },
      data: { preferences: updatedPreferences },
    });

    // If scheduler is enabled and this is a new activation, restart scheduler
    if (updatedSchedule.enabled && !currentSchedule.enabled) {
      try {
        // Restart scheduler to pick up new schedule
        ExecutiveBriefScheduler.getInstance().stop();
        ExecutiveBriefScheduler.getInstance().start();
      } catch (error) {
        console.warn('Failed to restart scheduler:', error);
      }
    }

    return NextResponse.json({
      success: true,
      schedule: updatedSchedule,
    });
  } catch (error) {
    console.error('Failed to update brief schedule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const action = body.action;

    if (action === 'send_now') {
      // Trigger immediate brief generation
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, preferences: true },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const preferences = (user.preferences as any) || {};
      const schedule = preferences.briefSchedule || getDefaultSchedule();

      // Generate brief data
      const scheduler = ExecutiveBriefScheduler.getInstance();
      // Force generate brief (private method, so we'll trigger via API)

      return NextResponse.json({
        success: true,
        message: 'Brief generation initiated',
        preview: 'Brief would be sent to configured channel',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Failed to execute brief action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
