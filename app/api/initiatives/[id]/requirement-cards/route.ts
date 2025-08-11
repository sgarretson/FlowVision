import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Verify user owns the initiative or is admin
    const initiative = await prisma.initiative.findUnique({
      where: { id: params.id },
      select: { ownerId: true },
    });

    if (!initiative) {
      return NextResponse.json({ error: 'Initiative not found' }, { status: 404 });
    }

    if (user.role !== 'ADMIN' && initiative.ownerId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get requirement cards for this initiative
    const cards = await prisma.requirementCard.findMany({
      where: { initiativeId: params.id },
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
      orderBy: { orderIndex: 'asc' },
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error('Failed to fetch requirement cards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    // Verify user owns the initiative or is admin
    const initiative = await prisma.initiative.findUnique({
      where: { id: params.id },
      select: { ownerId: true },
    });

    if (!initiative) {
      return NextResponse.json({ error: 'Initiative not found' }, { status: 404 });
    }

    if (user.role !== 'ADMIN' && initiative.ownerId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, type, priority, category, assignedToId } = body;

    // Get next order index
    const lastCard = await prisma.requirementCard.findFirst({
      where: { initiativeId: params.id },
      orderBy: { orderIndex: 'desc' },
    });

    const orderIndex = (lastCard?.orderIndex || 0) + 1;

    // Create the requirement card
    const card = await prisma.requirementCard.create({
      data: {
        initiativeId: params.id,
        title,
        description,
        type: type || 'BUSINESS',
        priority: priority || 'MEDIUM',
        category,
        assignedToId,
        createdById: user.id,
        orderIndex,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
        comments: {
          include: {
            author: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'REQUIREMENT_CARD_CREATED',
        details: {
          cardId: card.id,
          initiativeId: params.id,
          title: title.substring(0, 100),
          type,
        },
      },
    });

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error('Failed to create requirement card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
