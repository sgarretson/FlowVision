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
    const { content, parentId } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    // Check if idea exists
    const idea = await prisma.idea.findUnique({
      where: { id: params.id },
    });

    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    // If replying to a comment, check if parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment || parentComment.ideaId !== params.id) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
      }
    }

    // Extract mentions from content (simple @username pattern)
    const mentions = [];
    const mentionMatches = content.match(/@(\w+)/g);
    if (mentionMatches) {
      const mentionUsers = await prisma.user.findMany({
        where: {
          OR: mentionMatches.map((mention: string) => ({
            name: { contains: mention.substring(1), mode: 'insensitive' },
          })),
        },
        select: { id: true },
      });
      mentions.push(...mentionUsers.map((user) => user.id));
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: session.user.id,
        ideaId: params.id,
        parentId: parentId || null,
        mentions,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'IDEA_COMMENT',
        details: {
          ideaId: params.id,
          commentId: comment.id,
          parentId: parentId || null,
        },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Comment creation error:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
