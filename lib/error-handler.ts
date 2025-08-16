/**
 * Centralized Error Handling System for FlowVision
 * Provides consistent error handling, user-friendly messages,
 * and comprehensive error logging for debugging.
 */

import { NextRequest, NextResponse } from 'next/server';
import { advancedLogger, LogContext } from './advanced-logger';

// Error types and classifications
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  DATABASE = 'DATABASE',
  SYSTEM = 'SYSTEM',
  RATE_LIMIT = 'RATE_LIMIT',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Structured error interface
export interface AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  code: string;
  userMessage: string;
  debugMessage: string;
  statusCode: number;
  correlationId: string;
  metadata?: Record<string, any>;
  suggestions?: string[];
  retryable?: boolean;
  timestamp: string;
}

// API error response format
export interface APIErrorResponse {
  error: {
    type: ErrorType;
    code: string;
    message: string;
    correlationId: string;
    timestamp: string;
    suggestions?: string[];
    retryAfter?: number;
  };
  status: number;
  metadata?: Record<string, any>;
}

/**
 * Custom error class for application-specific errors
 */
export class FlowVisionError extends Error implements AppError {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly code: string;
  public readonly userMessage: string;
  public readonly debugMessage: string;
  public readonly statusCode: number;
  public readonly correlationId: string;
  public readonly metadata?: Record<string, any>;
  public readonly suggestions?: string[];
  public readonly retryable?: boolean;
  public readonly timestamp: string;

  constructor(
    type: ErrorType,
    code: string,
    userMessage: string,
    debugMessage: string,
    statusCode: number = 500,
    options: {
      severity?: ErrorSeverity;
      correlationId?: string;
      metadata?: Record<string, any>;
      suggestions?: string[];
      retryable?: boolean;
      cause?: Error;
    } = {}
  ) {
    super(debugMessage);

    this.name = 'FlowVisionError';
    this.type = type;
    this.severity = options.severity || ErrorSeverity.MEDIUM;
    this.code = code;
    this.userMessage = userMessage;
    this.debugMessage = debugMessage;
    this.statusCode = statusCode;
    this.correlationId = options.correlationId || advancedLogger.generateCorrelationId();
    this.metadata = options.metadata;
    this.suggestions = options.suggestions;
    this.retryable = options.retryable;
    this.timestamp = new Date().toISOString();

    // Maintain stack trace
    if (options.cause) {
      this.stack = options.cause.stack;
    } else if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FlowVisionError);
    }
  }
}

/**
 * Error factory for common error types
 */
export class ErrorFactory {
  static validation(message: string, field?: string, correlationId?: string): FlowVisionError {
    return new FlowVisionError(
      ErrorType.VALIDATION,
      'VALIDATION_ERROR',
      `Please check your input: ${message}`,
      `Validation failed: ${message}${field ? ` (field: ${field})` : ''}`,
      400,
      {
        severity: ErrorSeverity.LOW,
        correlationId,
        metadata: { field },
        suggestions: [
          'Check the required fields and format',
          'Ensure all values meet the specified criteria',
        ],
      }
    );
  }

  static authentication(
    message: string = 'Please sign in to continue',
    correlationId?: string
  ): FlowVisionError {
    return new FlowVisionError(
      ErrorType.AUTHENTICATION,
      'AUTH_REQUIRED',
      message,
      'Authentication required or token invalid',
      401,
      {
        severity: ErrorSeverity.MEDIUM,
        correlationId,
        suggestions: [
          'Sign in with your credentials',
          'Refresh the page if you were recently signed in',
        ],
      }
    );
  }

  static authorization(
    message: string = 'You do not have permission to perform this action',
    requiredPermission?: string,
    correlationId?: string
  ): FlowVisionError {
    return new FlowVisionError(
      ErrorType.AUTHORIZATION,
      'INSUFFICIENT_PERMISSIONS',
      message,
      `Access denied${requiredPermission ? ` (required: ${requiredPermission})` : ''}`,
      403,
      {
        severity: ErrorSeverity.MEDIUM,
        correlationId,
        metadata: { requiredPermission },
        suggestions: [
          'Contact your administrator for access',
          'Ensure you have the correct role assigned',
        ],
      }
    );
  }

  static notFound(resource: string, id?: string, correlationId?: string): FlowVisionError {
    return new FlowVisionError(
      ErrorType.NOT_FOUND,
      'RESOURCE_NOT_FOUND',
      `The requested ${resource} could not be found`,
      `Resource not found: ${resource}${id ? ` (id: ${id})` : ''}`,
      404,
      {
        severity: ErrorSeverity.LOW,
        correlationId,
        metadata: { resource, id },
        suggestions: ['Check if the resource exists', 'Verify the ID or URL is correct'],
      }
    );
  }

  static businessLogic(
    message: string,
    code: string,
    correlationId?: string,
    suggestions?: string[]
  ): FlowVisionError {
    return new FlowVisionError(
      ErrorType.BUSINESS_LOGIC,
      code,
      message,
      `Business rule violation: ${message}`,
      422,
      {
        severity: ErrorSeverity.MEDIUM,
        correlationId,
        suggestions: suggestions || [
          'Review the business requirements',
          'Contact support if you believe this is an error',
        ],
      }
    );
  }

  static externalService(
    service: string,
    operation: string,
    cause?: Error,
    correlationId?: string
  ): FlowVisionError {
    return new FlowVisionError(
      ErrorType.EXTERNAL_SERVICE,
      'EXTERNAL_SERVICE_ERROR',
      'A service is temporarily unavailable. Please try again.',
      `External service error: ${service} - ${operation}`,
      503,
      {
        severity: ErrorSeverity.HIGH,
        correlationId,
        metadata: { service, operation },
        suggestions: [
          'Please try again in a few moments',
          'Contact support if the problem persists',
        ],
        retryable: true,
        cause,
      }
    );
  }

  static database(operation: string, cause?: Error, correlationId?: string): FlowVisionError {
    return new FlowVisionError(
      ErrorType.DATABASE,
      'DATABASE_ERROR',
      'A database error occurred. Please try again.',
      `Database operation failed: ${operation}`,
      500,
      {
        severity: ErrorSeverity.HIGH,
        correlationId,
        metadata: { operation },
        suggestions: ['Please try again', 'Contact support if the problem continues'],
        retryable: true,
        cause,
      }
    );
  }

  static system(message: string, cause?: Error, correlationId?: string): FlowVisionError {
    return new FlowVisionError(
      ErrorType.SYSTEM,
      'SYSTEM_ERROR',
      'An unexpected error occurred. Our team has been notified.',
      message,
      500,
      {
        severity: ErrorSeverity.CRITICAL,
        correlationId,
        suggestions: [
          'Please try refreshing the page',
          'Contact support with the error ID if the problem persists',
        ],
        cause,
      }
    );
  }

  static rateLimit(retryAfterSeconds: number, correlationId?: string): FlowVisionError {
    return new FlowVisionError(
      ErrorType.RATE_LIMIT,
      'RATE_LIMIT_EXCEEDED',
      `Too many requests. Please wait ${retryAfterSeconds} seconds before trying again.`,
      'Rate limit exceeded',
      429,
      {
        severity: ErrorSeverity.LOW,
        correlationId,
        metadata: { retryAfterSeconds },
        suggestions: [
          `Wait ${retryAfterSeconds} seconds before retrying`,
          'Reduce the frequency of your requests',
        ],
        retryable: true,
      }
    );
  }
}

/**
 * API error handler middleware
 */
export function createErrorHandler() {
  return async function errorHandler(
    error: Error,
    req: NextRequest,
    context?: { correlationId?: string; userId?: string; operation?: string }
  ): Promise<NextResponse> {
    const correlationId = context?.correlationId || advancedLogger.generateCorrelationId();

    let appError: FlowVisionError;

    // Convert to FlowVisionError if not already
    if (error instanceof FlowVisionError) {
      appError = error;
    } else {
      // Map common error types
      if (error.name === 'ValidationError') {
        appError = ErrorFactory.validation(error.message, undefined, correlationId);
      } else if (error.name === 'UnauthorizedError') {
        appError = ErrorFactory.authentication(error.message, correlationId);
      } else if (error.name === 'ForbiddenError') {
        appError = ErrorFactory.authorization(error.message, undefined, correlationId);
      } else if (error.name === 'NotFoundError') {
        appError = ErrorFactory.notFound('resource', undefined, correlationId);
      } else {
        appError = ErrorFactory.system(error.message, error, correlationId);
      }
    }

    // Log the error with appropriate level
    const logLevel = appError.severity === ErrorSeverity.CRITICAL ? 'fatal' : 'error';
    advancedLogger[logLevel](
      LogContext.API,
      appError.debugMessage,
      appError,
      {
        type: appError.type,
        code: appError.code,
        statusCode: appError.statusCode,
        userId: context?.userId,
        operation: context?.operation,
        url: req.url,
        method: req.method,
        userAgent: req.headers.get('user-agent'),
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        ...appError.metadata,
      },
      correlationId
    );

    // Create API response
    const response: APIErrorResponse = {
      error: {
        type: appError.type,
        code: appError.code,
        message: appError.userMessage,
        correlationId: appError.correlationId,
        timestamp: appError.timestamp,
        suggestions: appError.suggestions,
      },
      status: appError.statusCode,
    };

    // Add retry information for retryable errors
    if (appError.retryable && appError.metadata?.retryAfterSeconds) {
      response.error.retryAfter = appError.metadata.retryAfterSeconds;
    }

    // Include metadata in development
    if (process.env.NODE_ENV === 'development') {
      response.metadata = {
        debugMessage: appError.debugMessage,
        stack: appError.stack,
        ...appError.metadata,
      };
    }

    return NextResponse.json(response, {
      status: appError.statusCode,
      headers: {
        'X-Correlation-ID': correlationId,
        ...(appError.retryable &&
          appError.metadata?.retryAfterSeconds && {
            'Retry-After': appError.metadata.retryAfterSeconds.toString(),
          }),
      },
    });
  };
}

/**
 * Express-style error handling wrapper for API routes
 */
export function withErrorHandling(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) {
  return async function wrappedHandler(req: NextRequest, context: any): Promise<NextResponse> {
    const correlationId = advancedLogger.generateCorrelationId();
    const errorHandler = createErrorHandler();

    try {
      // Log incoming request
      advancedLogger.apiRequest(req.method || 'GET', req.url, correlationId, {
        userAgent: req.headers.get('user-agent'),
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      });

      const startTime = Date.now();
      const response = await handler(req, { ...context, correlationId });
      const duration = Date.now() - startTime;

      // Log successful response
      advancedLogger.apiResponse(
        req.method || 'GET',
        req.url,
        response.status,
        duration,
        correlationId
      );

      // Add correlation ID to response headers
      response.headers.set('X-Correlation-ID', correlationId);

      return response;
    } catch (error) {
      return errorHandler(error as Error, req, {
        correlationId,
        operation: `${req.method} ${req.url}`,
      });
    }
  };
}

/**
 * Helper to safely handle async operations with error conversion
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  errorFactory: (error: Error) => FlowVisionError
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw errorFactory(error as Error);
  }
}

/**
 * Development error formatter for better debugging
 */
export function formatErrorForDevelopment(error: FlowVisionError): string {
  const lines = [
    `🚨 ${error.type} Error [${error.code}]`,
    `📝 User Message: ${error.userMessage}`,
    `🔍 Debug Message: ${error.debugMessage}`,
    `🆔 Correlation ID: ${error.correlationId}`,
    `📊 Status Code: ${error.statusCode}`,
    `⚠️  Severity: ${error.severity}`,
    `🔄 Retryable: ${error.retryable ? 'Yes' : 'No'}`,
    `⏰ Timestamp: ${error.timestamp}`,
  ];

  if (error.suggestions?.length) {
    lines.push(`💡 Suggestions: ${error.suggestions.join(', ')}`);
  }

  if (error.metadata) {
    lines.push(`📋 Metadata: ${JSON.stringify(error.metadata, null, 2)}`);
  }

  if (error.stack) {
    lines.push(`📍 Stack Trace:\n${error.stack}`);
  }

  return lines.join('\n');
}

export default {
  FlowVisionError,
  ErrorFactory,
  createErrorHandler,
  withErrorHandling,
  safeAsync,
  formatErrorForDevelopment,
};
