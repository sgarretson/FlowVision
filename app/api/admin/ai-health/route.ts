import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiServiceMonitor } from '@/lib/ai-service-monitor';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get AI service health metrics
    const healthMetrics = aiServiceMonitor.getHealthSummary();

    return NextResponse.json({
      health: healthMetrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI health check failed:', error);
    return NextResponse.json({ error: 'Failed to get AI health status' }, { status: 500 });
  }
}
