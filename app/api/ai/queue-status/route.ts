import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { asyncAIService } from '@/lib/async-ai-service';
import { advancedLogger, LogContext } from '@/lib/advanced-logger';
import { withErrorHandling } from '@/lib/error-handler';

export const GET = withErrorHandling(async function handleQueueStatus(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const correlationId = advancedLogger.generateCorrelationId();

  try {
    advancedLogger.debug(
      LogContext.AI_SERVICE,
      'Fetching queue status',
      { userId: session.user.id },
      correlationId
    );

    // Get queue status from async AI service
    const queueStatus = asyncAIService.getQueueStatus();

    return NextResponse.json({
      ...queueStatus,
      timestamp: Date.now(),
      healthy: queueStatus.queueLength < 10, // Consider unhealthy if queue is too long
    });
  } catch (error) {
    advancedLogger.error(
      LogContext.AI_SERVICE,
      'Queue status fetch failed',
      error as Error,
      { userId: session.user?.id },
      correlationId
    );
    throw error;
  }
});
