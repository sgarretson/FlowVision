import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [initiativeCount, issueCount, latestInitiatives] = await Promise.all([
      prisma.initiative.count(),
      prisma.issue.count(),
      prisma.initiative.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, status: true, progress: true, updatedAt: true },
      }),
    ]);

    const statusGroups = await prisma.initiative.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const brief = {
      headline: 'Executive Weekly Brief',
      metrics: {
        initiatives: initiativeCount,
        issues: issueCount,
        byStatus: statusGroups.reduce<Record<string, number>>((acc, s) => {
          acc[s.status] = s._count._all;
          return acc;
        }, {}),
      },
      recentInitiatives: latestInitiatives,
      notes: [
        'This is an auto-generated brief intended for executive review.',
        'For full insights, see the Executive dashboard.',
      ],
    };

    return NextResponse.json({ brief, generatedAt: new Date().toISOString() });
  } catch (e) {
    console.error('Brief generation failed:', (e as Error)?.message ?? String(e));
    return NextResponse.json({ error: 'Failed to generate brief' }, { status: 500 });
  }
}
