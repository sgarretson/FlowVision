import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const issue = await prisma.issue.findUnique({
      where: { id: params.id }
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    return NextResponse.json(issue);
  } catch (error) {
    console.error('Failed to fetch issue:', error);
    return NextResponse.json({ error: 'Failed to fetch issue' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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

    const existingIssue = await prisma.issue.findUnique({
      where: { id: params.id }
    });

    if (!existingIssue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const issue = await prisma.issue.update({
      where: { id: params.id },
      data: {
        description: description.trim(),
        heatmapScore: calculateHeatmapScore(description)
      }
    });

    // Log the action
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (user) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE_ISSUE',
          details: {
            issueId: issue.id,
            oldDescription: existingIssue.description,
            newDescription: issue.description
          }
        }
      });
    }

    return NextResponse.json(issue);
  } catch (error) {
    console.error('Failed to update issue:', error);
    return NextResponse.json({ error: 'Failed to update issue' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingIssue = await prisma.issue.findUnique({
      where: { id: params.id }
    });

    if (!existingIssue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    await prisma.issue.delete({
      where: { id: params.id }
    });

    // Log the action
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (user) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'DELETE_ISSUE',
          details: {
            issueId: params.id,
            description: existingIssue.description
          }
        }
      });
    }

    return NextResponse.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    console.error('Failed to delete issue:', error);
    return NextResponse.json({ error: 'Failed to delete issue' }, { status: 500 });
  }
}

// Simple heuristic for calculating heatmap score based on urgency/impact keywords
function calculateHeatmapScore(description: string): number {
  const text = description.toLowerCase();
  let score = 50; // Base score

  // High impact keywords
  const highImpactKeywords = [
    'critical', 'urgent', 'blocking', 'revenue', 'customer', 'security', 
    'downtime', 'compliance', 'risk', 'deadline', 'escalated'
  ];
  
  // Medium impact keywords
  const mediumImpactKeywords = [
    'important', 'improvement', 'efficiency', 'process', 'workflow',
    'performance', 'quality', 'user experience', 'training'
  ];

  // Low impact keywords
  const lowImpactKeywords = [
    'nice to have', 'future', 'enhancement', 'cosmetic', 'minor',
    'suggestion', 'optional', 'documentation'
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