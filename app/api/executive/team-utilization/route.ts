import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const active = await prisma.initiative.findMany({
      where: { status: { in: ['APPROVED', 'ACTIVE'] } },
      select: { id: true, ownerId: true, estimatedHours: true, actualHours: true },
    });

    // Simple utilization proxy: number of active initiatives per owner
    const ownerMap = new Map<string, number>();
    active.forEach((i) => ownerMap.set(i.ownerId, (ownerMap.get(i.ownerId) || 0) + 1));

    const owners = await prisma.user.findMany({
      where: { id: { in: Array.from(ownerMap.keys()) } },
      select: { id: true, name: true },
    });

    const data = owners.map((o) => ({
      ownerId: o.id,
      name: o.name || 'Unassigned',
      activeInitiatives: ownerMap.get(o.id) || 0,
    }));

    return NextResponse.json({ utilization: data, lastUpdated: new Date().toISOString() });
  } catch (e) {
    console.error('Team utilization error:', (e as Error)?.message ?? String(e));
    return NextResponse.json({ error: 'Failed to compute team utilization' }, { status: 500 });
  }
}
