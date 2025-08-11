import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/openai/usage - Get detailed usage statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get AI-related audit logs for usage tracking
    const aiLogs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: ['AI_ISSUE_ANALYSIS', 'AI_INITIATIVE_RECOMMENDATIONS', 'AI_INITIATIVE_REQUIREMENTS', 'OPENAI_CONNECTION_TEST']
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Calculate usage statistics
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthUsage = aiLogs.filter(log => log.timestamp >= thisMonth);
    const lastMonthUsage = aiLogs.filter(log => 
      log.timestamp >= lastMonth && log.timestamp < thisMonth
    );

    // Group by action type
    const usageByType = aiLogs.reduce((acc, log) => {
      const type = log.action;
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type]++;
      return acc;
    }, {} as Record<string, number>);

    // Group by user
    const usageByUser = aiLogs.reduce((acc, log) => {
      if (!log.user) return acc;
      const userEmail = log.user.email;
      if (!acc[userEmail]) {
        acc[userEmail] = {
          name: log.user.name || 'Unknown',
          email: userEmail,
          count: 0
        };
      }
      acc[userEmail].count++;
      return acc;
    }, {} as Record<string, { name: string; email: string; count: number }>);

    // Daily usage for the last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const recentLogs = aiLogs.filter(log => log.timestamp >= thirtyDaysAgo);
    
    const dailyUsage = recentLogs.reduce((acc, log) => {
      const date = log.timestamp.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date]++;
      return acc;
    }, {} as Record<string, number>);

    // Estimated costs (rough calculation based on typical OpenAI pricing)
    const estimatedCostPerRequest = 0.002; // $0.002 per request (rough estimate)
    const totalEstimatedCost = aiLogs.length * estimatedCostPerRequest;
    const monthlyEstimatedCost = thisMonthUsage.length * estimatedCostPerRequest;

    const stats = {
      totalRequests: aiLogs.length,
      thisMonthRequests: thisMonthUsage.length,
      lastMonthRequests: lastMonthUsage.length,
      monthlyGrowth: lastMonthUsage.length > 0 
        ? ((thisMonthUsage.length - lastMonthUsage.length) / lastMonthUsage.length * 100).toFixed(1)
        : thisMonthUsage.length > 0 ? '100' : '0',
      lastUsed: aiLogs.length > 0 ? aiLogs[0].timestamp.toISOString() : null,
      usageByType,
      usageByUser: Object.values(usageByUser).sort((a, b) => b.count - a.count),
      dailyUsage,
      estimatedCosts: {
        total: totalEstimatedCost.toFixed(2),
        thisMonth: monthlyEstimatedCost.toFixed(2),
        perRequest: estimatedCostPerRequest.toFixed(3)
      },
      recentActivity: aiLogs.slice(0, 10).map(log => ({
        id: log.id,
        action: log.action,
        user: log.user?.name || log.user?.email || 'Unknown',
        timestamp: log.timestamp.toISOString(),
        details: log.details
      }))
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Failed to get OpenAI usage stats:', error);
    return NextResponse.json({ error: 'Failed to get usage statistics' }, { status: 500 });
  }
}