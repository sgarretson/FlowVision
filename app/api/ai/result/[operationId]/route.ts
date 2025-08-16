import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { asyncAIService } from '@/lib/async-ai-service';
import { advancedLogger, LogContext } from '@/lib/advanced-logger';
import { withErrorHandling } from '@/lib/error-handler';

export const GET = withErrorHandling(async function handleResultFetch(
  req: NextRequest,
  { params }: { params: { operationId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { operationId } = params;
  const correlationId = advancedLogger.generateCorrelationId();

  if (!operationId) {
    return NextResponse.json({ error: 'Operation ID is required' }, { status: 400 });
  }

  try {
    advancedLogger.debug(
      LogContext.AI_SERVICE,
      `Fetching result for operation: ${operationId}`,
      { operationId, userId: session.user.id },
      correlationId
    );

    // Get result from async AI service
    const result = asyncAIService.getOperationResult(operationId);

    if (!result) {
      // Check if operation is still in progress
      const progress = asyncAIService.getOperationProgress(operationId);

      if (progress) {
        return NextResponse.json(
          {
            error: 'Operation still in progress',
            status: progress.status,
            progress: progress.progress,
          },
          { status: 202 } // Accepted, but not ready
        );
      }

      return NextResponse.json({ error: 'Operation not found' }, { status: 404 });
    }

    advancedLogger.info(
      LogContext.AI_SERVICE,
      `Result fetched for operation: ${operationId}`,
      {
        operationId,
        processingTime: result.processingTime,
        model: result.model,
        tokensUsed: result.tokensUsed,
        cached: result.cached,
        userId: session.user.id,
      },
      correlationId
    );

    return NextResponse.json({
      operationId: result.operationId,
      result: result.result,
      confidence: result.confidence,
      processingTime: result.processingTime,
      model: result.model,
      tokensUsed: result.tokensUsed,
      cached: result.cached,
      completedAt: Date.now(),
    });
  } catch (error) {
    advancedLogger.error(
      LogContext.AI_SERVICE,
      'Result fetch failed',
      error as Error,
      { operationId, userId: session.user?.id },
      correlationId
    );
    throw error;
  }
});
