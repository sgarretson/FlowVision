import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const initiativeId = searchParams.get('initiativeId');
    const status = searchParams.get('status');

    const where: any = {};
    if (initiativeId) {
      where.initiativeId = initiativeId;
    }
    if (status) {
      where.status = status;
    }

    const milestones = await prisma.milestone.findMany({
      where,
      include: {
        initiative: {
          select: { id: true, title: true, status: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json(milestones);

  } catch (error) {
    console.error('Milestones fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch milestones' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, dueDate, initiativeId, status = 'pending' } = body;

    if (!title || !dueDate || !initiativeId) {
      return NextResponse.json(
        { error: 'Title, due date, and initiative ID are required' },
        { status: 400 }
      );
    }

    // Verify initiative exists
    const initiative = await prisma.initiative.findUnique({
      where: { id: initiativeId },
    });

    if (!initiative) {
      return NextResponse.json(
        { error: 'Initiative not found' },
        { status: 404 }
      );
    }

    const milestone = await prisma.milestone.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        initiativeId,
        status,
      },
      include: {
        initiative: {
          select: { id: true, title: true },
        },
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'MILESTONE_CREATE',
        details: { milestoneId: milestone.id, title, initiativeId },
      },
    });

    return NextResponse.json(milestone, { status: 201 });

  } catch (error) {
    console.error('Milestone creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create milestone' },
      { status: 500 }
    );
  }
}