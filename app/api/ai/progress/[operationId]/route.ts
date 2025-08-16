import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { asyncAIService } from '@/lib/async-ai-service';
import { advancedLogger, LogContext } from '@/lib/advanced-logger';
import { withErrorHandling } from '@/lib/error-handler';

export const GET = withErrorHandling(async function handleProgressCheck(
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
      `Checking progress for operation: ${operationId}`,
      { operationId, userId: session.user.id },
      correlationId
    );

    // Get progress from async AI service
    const progress = asyncAIService.getOperationProgress(operationId);

    if (!progress) {
      // Check if operation completed and result is available
      const result = asyncAIService.getOperationResult(operationId);

      if (result) {
        return NextResponse.json({
          operationId,
          progress: 100,
          status: 'completed',
          message: 'Operation completed successfully',
          startTime: Date.now() - result.processingTime,
          completedAt: Date.now(),
        });
      }

      return NextResponse.json({ error: 'Operation not found' }, { status: 404 });
    }

    return NextResponse.json(progress);
  } catch (error) {
    advancedLogger.error(
      LogContext.AI_SERVICE,
      'Progress check failed',
      error as Error,
      { operationId, userId: session.user?.id },
      correlationId
    );
    throw error;
  }
});
