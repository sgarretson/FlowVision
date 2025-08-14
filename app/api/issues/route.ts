import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    // Build where clause based on query parameters
    const whereClause: any = {};

    if (category) {
      whereClause.category = category;
    }

    if (status) {
      whereClause.status = status;
    }

    const issues = await prisma.issue.findMany({
      where: whereClause,
      orderBy: [{ votes: 'desc' }, { heatmapScore: 'desc' }, { createdAt: 'desc' }],
      include: {
        initiatives: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });
    return NextResponse.json(issues);
  } catch (error) {
    console.error('Failed to fetch issues:', error);
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { description } = body;

    if (!description || description.trim().length === 0) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    // Calculate initial heatmap score based on description keywords
    const heatmapScore = calculateHeatmapScore(description);

    const issue = await prisma.issue.create({
      data: {
        description: description.trim(),
        votes: 1, // Creator automatically votes
        heatmapScore,
      },
    });

    // Log the action
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (user) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE_ISSUE',
          details: {
            issueId: issue.id,
            description: issue.description,
          },
        },
      });
    }

    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    console.error('Failed to create issue:', error);
    return NextResponse.json({ error: 'Failed to create issue' }, { status: 500 });
  }
}

// Simple heuristic for calculating heatmap score based on urgency/impact keywords
function calculateHeatmapScore(description: string): number {
  const text = description.toLowerCase();
  let score = 50; // Base score

  // High impact keywords
  const highImpactKeywords = [
    'critical',
    'urgent',
    'blocking',
    'revenue',
    'customer',
    'security',
    'downtime',
    'compliance',
    'risk',
    'deadline',
    'escalated',
  ];

  // Medium impact keywords
  const mediumImpactKeywords = [
    'important',
    'improvement',
    'efficiency',
    'process',
    'workflow',
    'performance',
    'quality',
    'user experience',
    'training',
  ];

  // Low impact keywords
  const lowImpactKeywords = [
    'nice to have',
    'future',
    'enhancement',
    'cosmetic',
    'minor',
    'suggestion',
    'optional',
    'documentation',
  ];

  for (const keyword of highImpactKeywords) {
    if (text.includes(keyword)) score += 15;
  }

  for (const keyword of mediumImpactKeywords) {
    if (text.includes(keyword)) score += 8;
  }

  for (const keyword of lowImpactKeywords) {
    if (text.includes(keyword)) score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}
