import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { asyncAIService, AIOperation } from '@/lib/async-ai-service';
import { advancedLogger, LogContext } from '@/lib/advanced-logger';
import { withErrorHandling } from '@/lib/error-handler';

export const POST = withErrorHandling(async function handleAsyncAI(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const correlationId = advancedLogger.generateCorrelationId();

  try {
    const body = await req.json();
    const { type, input, context, priority = 'normal' } = body;

    if (!type || !input) {
      return NextResponse.json(
        { error: 'Missing required fields: type and input' },
        { status: 400 }
      );
    }

    // Validate operation type
    const validTypes = ['issue_analysis', 'initiative_generation', 'clustering', 'insights'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid operation type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Create operation
    const operation: AIOperation = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      input,
      context: {
        ...context,
        userId: session.user.id,
        userEmail: session.user.email,
      },
      priority,
      estimatedDuration: getEstimatedDuration(type),
    };

    advancedLogger.info(
      LogContext.AI_SERVICE,
      `Async AI operation requested: ${type}`,
      {
        operationId: operation.id,
        type,
        priority,
        userId: session.user.id,
      },
      correlationId
    );

    // Queue the operation
    const operationId = await asyncAIService.queueOperation(operation);

    // Return operation ID for tracking
    return NextResponse.json({
      operationId,
      status: 'queued',
      message: 'Operation queued for processing',
      estimatedDuration: operation.estimatedDuration,
      type,
    });
  } catch (error) {
    advancedLogger.error(
      LogContext.AI_SERVICE,
      'Async AI operation failed',
      error as Error,
      { userId: session.user?.id },
      correlationId
    );
    throw error;
  }
});

// Helper function to estimate duration based on operation type
function getEstimatedDuration(type: string): number {
  switch (type) {
    case 'issue_analysis':
      return 4000; // 4 seconds
    case 'initiative_generation':
      return 6000; // 6 seconds
    case 'clustering':
      return 8000; // 8 seconds
    case 'insights':
      return 5000; // 5 seconds
    default:
      return 5000; // 5 seconds default
  }
}
