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

    const { type } = await req.json();
    const ideaId = params.id;

    if (!type || !['up', 'down'].includes(type)) {
      return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
    }

    // Check if idea exists
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
    });

    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    // Check if user has already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_ideaId: {
          userId: session.user.id,
          ideaId: ideaId,
        },
      },
    });

    const voteValue = type === 'up' ? 1 : -1;

    if (existingVote) {
      // Update existing vote
      await prisma.vote.update({
        where: { id: existingVote.id },
        data: {
          type,
          value: voteValue,
        },
      });
    } else {
      // Create new vote
      await prisma.vote.create({
        data: {
          userId: session.user.id,
          ideaId: ideaId,
          type,
          value: voteValue,
        },
      });
    }

    // Recalculate total votes for the idea
    const allVotes = await prisma.vote.findMany({
      where: { ideaId: ideaId },
    });

    const totalVotes = allVotes.reduce((sum, vote) => sum + vote.value, 0);

    // Update idea vote count
    const updatedIdea = await prisma.idea.update({
      where: { id: ideaId },
      data: { votes: totalVotes },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'IDEA_VOTE',
        details: { ideaId, type, newTotal: totalVotes },
      },
    });

    return NextResponse.json({
      success: true,
      votes: updatedIdea.votes,
    });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Failed to process vote' }, { status: 500 });
  }
}
