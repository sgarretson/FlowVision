import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    // Verify the requirement card exists
    const card = await prisma.requirementCard.findUnique({
      where: { id: params.id },
      include: {
        initiative: { select: { ownerId: true } },
      },
    });

    if (!card) {
      return NextResponse.json({ error: 'Requirement card not found' }, { status: 404 });
    }

    // Check permissions (allow team members to comment)
    if (
      user.role !== 'ADMIN' &&
      card.initiative.ownerId !== user.id &&
      card.assignedToId !== user.id
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        authorId: user.id,
        requirementCardId: params.id,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Failed to create comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
