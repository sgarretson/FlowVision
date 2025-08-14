import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiServiceMonitor } from '@/lib/ai-service-monitor';

// GET /api/admin/ai-health - Get AI service health status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin users can access health monitoring
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get comprehensive health data
    const health = await aiServiceMonitor.performHealthCheck();
    const metrics = aiServiceMonitor.getMetrics();
    const summary = aiServiceMonitor.getHealthSummary();

    return NextResponse.json({
      health,
      metrics,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to get AI health status:', error);
    return NextResponse.json({ error: 'Failed to retrieve AI health status' }, { status: 500 });
  }
}

// POST /api/admin/ai-health - Trigger manual health check
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin users can trigger health checks
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('🔍 Manual AI health check triggered by admin:', user.email);

    // Perform health check
    const health = await aiServiceMonitor.performHealthCheck();
    const metrics = aiServiceMonitor.getMetrics();

    // Log the health check
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'AI_HEALTH_CHECK',
        details: {
          status: health.status,
          responseTime: health.responseTime,
          errorRate: health.errorRate,
          triggeredBy: 'manual',
        },
      },
    });

    return NextResponse.json({
      success: true,
      health,
      metrics,
      message: 'Health check completed successfully',
    });
  } catch (error) {
    console.error('Failed to perform AI health check:', error);
    return NextResponse.json({ error: 'Failed to perform health check' }, { status: 500 });
  }
}
