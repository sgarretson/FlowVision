/**
 * Error reporting endpoint for client-side error handling
 * Demonstrates the new centralized error handling system
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling, ErrorFactory } from '@/lib/error-handler';
import { advancedLogger, LogContext } from '@/lib/advanced-logger';
import { prisma } from '@/lib/prisma';

interface ErrorReportRequest {
  error: {
    message: string;
    stack?: string;
    name: string;
  };
  errorInfo?: any;
  correlationId: string;
  retryCount: number;
  url: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

async function handleErrorReport(req: NextRequest, context: { correlationId: string }) {
  try {
    const body: ErrorReportRequest = await req.json();
    const { correlationId } = context;

    // Validate required fields
    if (!body.error?.message || !body.correlationId || !body.url) {
      throw ErrorFactory.validation(
        'Missing required fields: error.message, correlationId, and url are required',
        undefined,
        correlationId
      );
    }

    // Log the client-side error report
    advancedLogger.error(
      LogContext.UI,
      'Client-side error report received',
      new Error(body.error.message),
      {
        clientCorrelationId: body.correlationId,
        serverCorrelationId: correlationId,
        retryCount: body.retryCount,
        url: body.url,
        userAgent: body.userAgent,
        timestamp: body.timestamp,
        errorName: body.error.name,
        hasStack: !!body.error.stack,
        hasErrorInfo: !!body.errorInfo,
      },
      correlationId
    );

    // Store error report in database for analysis
    await prisma.auditLog.create({
      data: {
        userId: body.userId || null,
        action: 'CLIENT_ERROR_REPORT',
        details: {
          error: {
            message: body.error.message,
            name: body.error.name,
            stack: body.error.stack?.substring(0, 1000), // Limit stack trace length
          },
          errorInfo: body.errorInfo,
          clientCorrelationId: body.correlationId,
          serverCorrelationId: correlationId,
          retryCount: body.retryCount,
          url: body.url,
          userAgent: body.userAgent,
          timestamp: body.timestamp,
        },
      },
    });

    // Log successful error report storage
    advancedLogger.info(
      LogContext.SYSTEM,
      'Error report stored successfully',
      {
        clientCorrelationId: body.correlationId,
        serverCorrelationId: correlationId,
        userId: body.userId,
      },
      correlationId
    );

    return NextResponse.json({
      success: true,
      message: 'Error report received and stored',
      correlationId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Error will be handled by withErrorHandling wrapper
    throw error;
  }
}

// Export with error handling wrapper
export const POST = withErrorHandling(handleErrorReport);
