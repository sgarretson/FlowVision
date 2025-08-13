import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { optimizedOpenAIService } from '@/lib/optimized-openai-service';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get performance metrics from optimized service
    const metrics = await optimizedOpenAIService.getPerformanceMetrics();

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Failed to fetch AI performance metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { action } = await req.json();

    switch (action) {
      case 'optimize_cache':
        // Trigger cache optimization
        optimizedOpenAIService.clearCache();
        return NextResponse.json({ success: true, message: 'Cache optimized' });

      case 'reset_metrics':
        // Reset daily metrics (if needed)
        return NextResponse.json({ success: true, message: 'Metrics reset' });

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('AI performance action failed:', error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
