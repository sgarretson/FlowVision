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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get system statistics
    const [
      totalUsers,
      totalInitiatives,
      activeInitiatives,
      totalIssues,
      criticalIssues
    ] = await Promise.all([
      prisma.user.count(),
      prisma.initiative.count(),
      prisma.initiative.count({
        where: { status: 'In Progress' }
      }),
      prisma.issue.count(),
      prisma.issue.count({
        where: { heatmapScore: { gte: 80 } }
      })
    ]);

    const stats = {
      totalUsers,
      totalInitiatives,
      activeInitiatives,
      totalIssues,
      criticalIssues
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system statistics' },
      { status: 500 }
    );
  }
}