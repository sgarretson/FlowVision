import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Cluster = {
  label: string;
  issueIds: string[];
  rationale: string;
};

// POST/GET /api/issues/clusterize
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const issues = await prisma.issue.findMany({
      select: {
        id: true,
        description: true,
        department: true,
        category: true,
        keywords: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 500,
    });

    // Heuristic clustering: prefer explicit category, fallback to department, then keyword stem
    const clustersMap = new Map<string, { ids: string[]; rationale: string }>();

    for (const i of issues) {
      const key = (i.category || i.department || topKeyword(i) || 'General').trim();
      const current = clustersMap.get(key) || { ids: [], rationale: '' };
      current.ids.push(i.id);
      clustersMap.set(key, current);
    }

    const clusters: Cluster[] = Array.from(clustersMap.entries())
      .filter(([, v]) => v.ids.length >= 2) // only surface groups with at least 2 items
      .map(([label, v]) => ({
        label,
        issueIds: v.ids,
        rationale: rationaleForLabel(label),
      }))
      .slice(0, 12);

    return NextResponse.json({ clusters });
  } catch (err) {
    return NextResponse.json({ clusters: [] });
  }
}

function topKeyword(i: { keywords?: string[]; description: string }): string | null {
  if (i.keywords && i.keywords.length) return i.keywords[0];
  // naive fallback: first noun-ish token > 4 chars
  const m = (i.description || '').toLowerCase().match(/[a-z]{5,}/g);
  return m?.[0] || null;
}

function rationaleForLabel(label: string): string {
  return `Grouped by shared theme: “${label}”. Based on category/department/keywords.`;
}
