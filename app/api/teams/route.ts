import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teams = await prisma.team.findMany({
      include: {
        assignments: {
          include: {
            initiative: {
              select: { id: true, title: true, status: true },
            },
          },
        },
        _count: {
          select: { assignments: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(teams);

  } catch (error) {
    console.error('Teams fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
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
    const { name, department, capacity, skills } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    const team = await prisma.team.create({
      data: {
        name,
        department,
        capacity: capacity || 40,
        skills: skills || [],
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TEAM_CREATE',
        details: { teamId: team.id, name },
      },
    });

    return NextResponse.json(team, { status: 201 });

  } catch (error) {
    console.error('Team creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}