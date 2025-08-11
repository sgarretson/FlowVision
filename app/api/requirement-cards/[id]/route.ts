import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { title, description, type, priority, status, category, assignedToId, orderIndex } = body;

    // Get the current card to verify permissions
    const currentCard = await prisma.requirementCard.findUnique({
      where: { id: params.id },
      include: {
        initiative: { select: { ownerId: true } },
      },
    });

    if (!currentCard) {
      return NextResponse.json({ error: 'Requirement card not found' }, { status: 404 });
    }

    // Check permissions
    if (user.role !== 'ADMIN' && currentCard.initiative.ownerId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (category !== undefined) updateData.category = category;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
    if (orderIndex !== undefined) updateData.orderIndex = orderIndex;

    // Handle approval
    if (status === 'APPROVED' && currentCard.status !== 'APPROVED') {
      updateData.approvedById = user.id;
      updateData.approvedAt = new Date();
    } else if (status !== 'APPROVED' && currentCard.status === 'APPROVED') {
      updateData.approvedById = null;
      updateData.approvedAt = null;
    }

    const updatedCard = await prisma.requirementCard.update({
      where: { id: params.id },
      data: updateData,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
        comments: {
          include: {
            author: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'REQUIREMENT_CARD_UPDATED',
        details: {
          cardId: params.id,
          initiativeId: currentCard.initiativeId,
          changes: updateData,
        },
      },
    });

    return NextResponse.json(updatedCard);
  } catch (error) {
    console.error('Failed to update requirement card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Get the current card to verify permissions
    const currentCard = await prisma.requirementCard.findUnique({
      where: { id: params.id },
      include: {
        initiative: { select: { ownerId: true } },
      },
    });

    if (!currentCard) {
      return NextResponse.json({ error: 'Requirement card not found' }, { status: 404 });
    }

    // Check permissions
    if (user.role !== 'ADMIN' && currentCard.initiative.ownerId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await prisma.requirementCard.delete({
      where: { id: params.id },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'REQUIREMENT_CARD_DELETED',
        details: {
          cardId: params.id,
          initiativeId: currentCard.initiativeId,
          title: currentCard.title,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete requirement card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
