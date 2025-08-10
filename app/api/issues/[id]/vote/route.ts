import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { increment } = body; // true to upvote, false to downvote

    const existingIssue = await prisma.issue.findUnique({
      where: { id: params.id }
    });

    if (!existingIssue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const voteChange = increment ? 1 : -1;
    const newVoteCount = Math.max(0, existingIssue.votes + voteChange);

    const issue = await prisma.issue.update({
      where: { id: params.id },
      data: {
        votes: newVoteCount
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
          action: increment ? 'UPVOTE_ISSUE' : 'DOWNVOTE_ISSUE',
          details: {
            issueId: issue.id,
            description: issue.description,
            newVoteCount: issue.votes
          }
        }
      });
    }

    return NextResponse.json(issue);
  } catch (error) {
    console.error('Failed to vote on issue:', error);
    return NextResponse.json({ error: 'Failed to vote on issue' }, { status: 500 });
  }
}