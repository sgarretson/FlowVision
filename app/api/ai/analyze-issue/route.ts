import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AIMigration from '@/lib/ai-migration';
import { asyncAIService } from '@/lib/async-ai-service';
import { advancedLogger, LogContext } from '@/lib/advanced-logger';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { description, async = false } = body;
    const correlationId = advancedLogger.generateCorrelationId();

    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: 'Issue description is required' }, { status: 400 });
    }

    advancedLogger.info(
      LogContext.AI_SERVICE,
      'Issue analysis requested',
      {
        async,
        descriptionLength: description.length,
        userId: user.id,
      },
      correlationId
    );

    // Get user's business profile for context
    const businessProfile = await prisma.businessProfile.findUnique({
      where: { userId: user.id },
    });

    const businessContext = businessProfile
      ? {
          industry: businessProfile.industry,
          size: businessProfile.size,
          metrics: businessProfile.metrics,
        }
      : undefined;

    // If async processing is requested, use the new async service
    if (async) {
      try {
        const operation = {
          id: `issue-analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'issue_analysis' as const,
          input: { description },
          context: businessContext,
          priority: 'normal' as const,
          estimatedDuration: 4000,
        };

        const operationId = await asyncAIService.queueOperation(operation);

        advancedLogger.info(
          LogContext.AI_SERVICE,
          'Issue analysis queued for async processing',
          { operationId, userId: user.id },
          correlationId
        );

        return NextResponse.json({
          operationId,
          status: 'queued',
          message: 'Analysis queued for processing',
          async: true,
          estimatedDuration: 4000,
        });
      } catch (error) {
        advancedLogger.error(
          LogContext.AI_SERVICE,
          'Async issue analysis failed',
          error as Error,
          { userId: user.id },
          correlationId
        );

        // Fallback to synchronous processing
        advancedLogger.info(
          LogContext.AI_SERVICE,
          'Falling back to synchronous processing',
          { userId: user.id },
          correlationId
        );
      }
    }

    // Synchronous processing (original behavior)
    try {
      // Generate AI insights using migration service
      const result = await AIMigration.generateIssueInsights(description, businessContext, user.id);

      if (!result) {
        return NextResponse.json(
          {
            error: 'Failed to generate AI insights',
            fallback: 'AI analysis temporarily unavailable. Please try again later.',
          },
          { status: 500 }
        );
      }

      // Log the AI usage
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'AI_ISSUE_ANALYSIS',
          details: {
            description: description.substring(0, 100) + '...',
            hasInsights: !!result.insights,
            model: result.model,
            async: false,
          },
        },
      });

      advancedLogger.info(
        LogContext.AI_SERVICE,
        'Issue analysis completed synchronously',
        {
          userId: user.id,
          model: result.model,
          hasInsights: !!result.insights,
        },
        correlationId
      );

      return NextResponse.json({
        insights: result.insights,
        model: result.model,
        source: 'openai',
        async: false,
        processingTime: Date.now() - Date.now(), // Will be very small for sync
      });
    } catch (syncError) {
      advancedLogger.error(
        LogContext.AI_SERVICE,
        'Synchronous issue analysis failed',
        syncError as Error,
        { userId: user.id },
        correlationId
      );

      return NextResponse.json(
        {
          error: 'AI analysis not available - service unavailable',
          fallback: 'Use the admin panel to configure OpenAI integration for AI-powered insights.',
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('AI issue analysis error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze issue',
        fallback: 'AI analysis temporarily unavailable. Please try again later.',
      },
      { status: 500 }
    );
  }
}
