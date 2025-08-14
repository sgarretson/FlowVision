import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import RealTimeMonitor from '@/lib/real-time-monitor';

export const dynamic = 'force-dynamic';

/**
 * GET /api/intelligence/monitoring
 * Retrieve real-time monitoring data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeMetrics = searchParams.get('includeMetrics') !== 'false';
    const includeAlerts = searchParams.get('includeAlerts') !== 'false';
    const alertLimit = parseInt(searchParams.get('alertLimit') || '50');

    const monitor = RealTimeMonitor.getInstance();
    const status = monitor.getMonitoringStatus();

    const response: any = {
      success: true,
      monitoring: {
        status,
        realTime: {
          enabled: status.isMonitoring,
          updateInterval: 5000, // milliseconds
          lastUpdate: status.lastUpdate,
        },
      },
    };

    if (includeMetrics) {
      response.metrics = monitor.getMetrics().map((metric) => ({
        ...metric,
        history: metric.history.slice(-20), // Last 20 data points
      }));
    }

    if (includeAlerts) {
      const alerts = monitor.getAlerts();
      response.alerts = {
        active: alerts.filter((a) => !a.resolution.resolved).slice(0, alertLimit),
        resolved: alerts.filter((a) => a.resolution.resolved).slice(0, 10),
        summary: {
          total: alerts.length,
          active: alerts.filter((a) => !a.resolution.resolved).length,
          critical: alerts.filter((a) => a.severity === 'critical' && !a.resolution.resolved)
            .length,
          acknowledged: alerts.filter(
            (a) => a.acknowledgement.acknowledged && !a.resolution.resolved
          ).length,
        },
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Monitoring API error:', error);
    return NextResponse.json({ error: 'Failed to retrieve monitoring data' }, { status: 500 });
  }
}

/**
 * POST /api/intelligence/monitoring/alerts
 * Manage alerts (acknowledge, resolve, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, alertId, reason, resolution } = body;

    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    const monitor = RealTimeMonitor.getInstance();
    let result = false;

    switch (action) {
      case 'acknowledge':
        result = monitor.acknowledgeAlert(alertId, session.user.email, reason);
        break;

      case 'resolve':
        if (!resolution) {
          return NextResponse.json(
            { error: 'Resolution description is required' },
            { status: 400 }
          );
        }
        result = monitor.resolveAlert(alertId, session.user.email, resolution);
        break;

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to perform action - alert not found or already processed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      action,
      alertId,
      performedBy: session.user.email,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Alert management error:', error);
    return NextResponse.json({ error: 'Failed to manage alert' }, { status: 500 });
  }
}
