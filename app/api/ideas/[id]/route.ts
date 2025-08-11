import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idea = await prisma.idea.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        initiative: {
          select: { id: true, title: true },
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, email: true },
            },
            replies: {
              include: {
                author: {
                  select: { id: true, name: true, email: true },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          where: { parentId: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    return NextResponse.json(idea);
  } catch (error) {
    console.error('Idea fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch idea' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, category, priority, status, tags, assignedTo, dueDate } = body;

    // Check if idea exists and user has permission to edit
    const existingIdea = await prisma.idea.findUnique({
      where: { id: params.id },
    });

    if (!existingIdea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    // Only author or admin can edit
    if (existingIdea.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (tags !== undefined) updateData.tags = tags;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    const updatedIdea = await prisma.idea.update({
      where: { id: params.id },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        initiative: {
          select: { id: true, title: true },
        },
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'IDEA_UPDATE',
        details: {
          ideaId: params.id,
          changes: Object.keys(updateData),
          title: updatedIdea.title,
        },
      },
    });

    return NextResponse.json(updatedIdea);
  } catch (error) {
    console.error('Idea update error:', error);
    return NextResponse.json({ error: 'Failed to update idea' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if idea exists and user has permission to delete
    const existingIdea = await prisma.idea.findUnique({
      where: { id: params.id },
    });

    if (!existingIdea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    // Only author or admin can delete
    if (existingIdea.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    await prisma.idea.delete({
      where: { id: params.id },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'IDEA_DELETE',
        details: { ideaId: params.id, title: existingIdea.title },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Idea deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete idea' }, { status: 500 });
  }
}
