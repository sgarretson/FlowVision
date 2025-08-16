import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { asyncAIService } from '@/lib/async-ai-service';
import { advancedLogger, LogContext } from '@/lib/advanced-logger';
import { withErrorHandling } from '@/lib/error-handler';

export const POST = withErrorHandling(async function handleOperationCancel(
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
    advancedLogger.info(
      LogContext.AI_SERVICE,
      `Cancelling operation: ${operationId}`,
      { operationId, userId: session.user.id },
      correlationId
    );

    // Cancel the operation
    const cancelled = asyncAIService.cancelOperation(operationId);

    if (!cancelled) {
      return NextResponse.json(
        { error: 'Operation not found or already completed' },
        { status: 404 }
      );
    }

    advancedLogger.info(
      LogContext.AI_SERVICE,
      `Operation cancelled successfully: ${operationId}`,
      { operationId, userId: session.user.id },
      correlationId
    );

    return NextResponse.json({
      operationId,
      status: 'cancelled',
      message: 'Operation cancelled successfully',
      cancelledAt: Date.now(),
    });
  } catch (error) {
    advancedLogger.error(
      LogContext.AI_SERVICE,
      'Operation cancellation failed',
      error as Error,
      { operationId, userId: session.user?.id },
      correlationId
    );
    throw error;
  }
});
