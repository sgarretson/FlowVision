import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const voteSchema = z.object({
  initiativeId: z.string(),
  difficulty: z.number().min(0).max(100).optional(),
  roi: z.number().min(0).max(100).optional(),
  priority: z.number().min(1).max(5).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { initiativeId, difficulty, roi, priority } = voteSchema.parse(body);

    // Check if initiative exists
    const initiative = await prisma.initiative.findUnique({
      where: { id: initiativeId },
    });

    if (!initiative) {
      return NextResponse.json({ error: 'Initiative not found' }, { status: 404 });
    }

    // Update or create vote
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_initiativeId: {
          userId: user.id,
          initiativeId: initiativeId,
        },
      },
    });

    let vote;
    if (existingVote) {
      vote = await prisma.vote.update({
        where: { id: existingVote.id },
        data: {
          type: 'priority',
          value: priority || difficulty || roi || 1,
        },
      });
    } else {
      vote = await prisma.vote.create({
        data: {
          userId: user.id,
          initiativeId: initiativeId,
          type: 'priority',
          value: priority || difficulty || roi || 1,
        },
      });
    }

    // If difficulty or ROI provided, update initiative with averaged values
    if (difficulty !== undefined || roi !== undefined) {
      const allVotes = await prisma.vote.findMany({
        where: { initiativeId: initiativeId },
      });

      // Calculate averages (simplified - in real app you'd want separate vote types)
      const updateData: any = {};

      if (difficulty !== undefined) {
        updateData.difficulty = difficulty;
      }

      if (roi !== undefined) {
        updateData.roi = roi;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.initiative.update({
          where: { id: initiativeId },
          data: updateData,
        });
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PRIORITIZATION_VOTE',
        details: {
          initiativeId,
          difficulty,
          roi,
          priority,
          voteType: existingVote ? 'update' : 'create',
        },
      },
    });

    return NextResponse.json({
      message: 'Vote recorded successfully',
      vote: {
        id: vote.id,
        value: vote.value,
        type: vote.type,
      },
    });
  } catch (error) {
    console.error('Prioritization vote error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const initiativeId = searchParams.get('initiativeId');

    if (!initiativeId) {
      return NextResponse.json({ error: 'Initiative ID required' }, { status: 400 });
    }

    // Get all votes for the initiative
    const votes = await prisma.vote.findMany({
      where: { initiativeId },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    // Calculate summary statistics
    const totalVotes = votes.length;
    const averageValue =
      totalVotes > 0 ? votes.reduce((sum, vote) => sum + vote.value, 0) / totalVotes : 0;

    return NextResponse.json({
      votes,
      summary: {
        totalVotes,
        averageValue: Math.round(averageValue * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Get prioritization votes error:', error);
    return NextResponse.json({ error: 'Failed to fetch votes' }, { status: 500 });
  }
}
