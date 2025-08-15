import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  calculateStrategicHealth,
  calculateBusinessImpact,
  getCriticalAlerts,
  getInitiativeProgress,
} from '@/lib/strategic-health';

// Force dynamic server-side rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parallel execution for optimal performance
    const [strategicHealth, businessImpact, criticalAlerts, initiativeProgress] = await Promise.all(
      [
        calculateStrategicHealth(),
        calculateBusinessImpact(),
        getCriticalAlerts(),
        getInitiativeProgress(),
      ]
    );

    // Executive summary calculation
    const executiveSummary = {
      status:
        strategicHealth.overallScore >= 85
          ? 'excellent'
          : strategicHealth.overallScore >= 70
            ? 'good'
            : strategicHealth.overallScore >= 55
              ? 'attention'
              : 'critical',
      keyMetric: businessImpact.monthlyValue,
      trendDirection: strategicHealth.trends.direction,
      urgentActions: criticalAlerts.filter((alert) => alert.severity === 'critical').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        strategicHealth,
        businessImpact,
        criticalAlerts,
        initiativeProgress,
        executiveSummary,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Strategic dashboard API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate strategic dashboard',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
