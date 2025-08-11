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

    const statusGroups = await prisma.initiative.groupBy({ by: ['status'], _count: { _all: true } });

    const brief = {
      headline: 'Executive Weekly Brief',
      metrics: {
        initiatives: initiativeCount,
        issues: issueCount,
        byStatus: Object.fromEntries(statusGroups.map((g) => [g.status, g._count._all])),
      },
      latestInitiatives,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(brief);
  } catch (e) {
    console.warn('Brief generation failed:', e);
    return NextResponse.json({ error: 'Failed to generate brief' }, { status: 500 });
  }
}
