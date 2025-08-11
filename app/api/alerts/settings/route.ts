import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type AlertSettings = {
  timelineBehindPct: number;
  deadlineDaysCritical: number;
  ownerMaxActive: number;
  budgetOverrunWarnPct: number;
  budgetOverrunCritPct: number;
  lowRoiPct: number;
  digest: { enabled: boolean; channel: 'email' | 'slack' | 'none'; timeUTC: string };
};

function defaults(): AlertSettings {
  return {
    timelineBehindPct: 20,
    deadlineDaysCritical: 14,
    ownerMaxActive: 3,
    budgetOverrunWarnPct: 25,
    budgetOverrunCritPct: 50,
    lowRoiPct: 10,
    digest: { enabled: false, channel: 'none', timeUTC: '09:00' },
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const prefs = (user.preferences as any) || {};
  const settings: AlertSettings = { ...defaults(), ...(prefs.alerts || {}) };
  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const incoming: Partial<AlertSettings> = body?.settings || {};

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const prefs = (user.preferences as any) || {};
  const nextPrefs = { ...prefs, alerts: { ...defaults(), ...(prefs.alerts || {}), ...incoming } };

  await prisma.user.update({ where: { id: user.id }, data: { preferences: nextPrefs } });
  return NextResponse.json({ success: true, settings: nextPrefs.alerts });
}
