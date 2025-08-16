/**
 * Advanced Centralized Logging System for FlowVision
 * Provides structured logging with context awareness, performance monitoring,
 * and development-friendly debugging capabilities.
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Log levels and contexts
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export enum LogContext {
  AUTH = 'auth',
  API = 'api',
  DATABASE = 'database',
  AI_SERVICE = 'ai_service',
  UI = 'ui',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  BUSINESS = 'business',
  SYSTEM = 'system',
}

// Structured log entry interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: LogContext;
  message: string;
  correlationId: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  stackTrace?: string;
  performance?: {
    duration?: number;
    memory?: number;
    cpu?: number;
    apiEndpoint?: string;
    sqlQuery?: string;
  };
  userAgent?: string;
  ip?: string;
  url?: string;
  method?: string;
}

// Performance timing helper
interface TimingOperation {
  startTime: number;
  context: LogContext;
  operation: string;
  metadata?: Record<string, any>;
}

class AdvancedLogger {
  private winston: winston.Logger;
  private activeTimings: Map<string, TimingOperation> = new Map();
  private correlationIdCounter = 0;

  constructor() {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const enabledContexts = process.env.LOG_CONTEXTS?.split(',') || Object.values(LogContext);

    // Create winston logger with multiple transports
    this.winston = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf((info) => {
          // Filter by enabled contexts
          if (info.context && !enabledContexts.includes(info.context)) {
            return '';
          }
          return JSON.stringify(info, null, 2);
        })
      ),
      transports: [
        // Console transport for development
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'HH:mm:ss' }),
            winston.format.printf((info) => {
              const correlation = info.correlationId ? ` [${info.correlationId.slice(-6)}]` : '';
              const context = info.context ? ` [${info.context}]` : '';
              const metadata = info.metadata ? ` ${JSON.stringify(info.metadata)}` : '';
              return `${info.timestamp}${correlation}${context} ${info.level}: ${info.message}${metadata}`;
            })
          ),
        }),

        // File transport for persistent logs
        new DailyRotateFile({
          dirname: 'logs',
          filename: 'flowvision-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '30d',
          maxSize: '20m',
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),

        // Error-specific file transport
        new DailyRotateFile({
          dirname: 'logs',
          filename: 'flowvision-errors-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxFiles: '30d',
          maxSize: '20m',
        }),
      ],
    });

    // Add external transports in production
    if (process.env.NODE_ENV === 'production') {
      this.addProductionTransports();
    }
  }

  /**
   * Generate a unique correlation ID for request tracking
   */
  generateCorrelationId(): string {
    const timestamp = Date.now().toString(36);
    const counter = (this.correlationIdCounter++).toString(36).padStart(3, '0');
    return `${timestamp}-${counter}`;
  }

  /**
   * Core logging method with structured format
   */
  private log(
    level: LogLevel,
    context: LogContext,
    message: string,
    metadata?: Record<string, any>,
    correlationId?: string,
    error?: Error
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      correlationId: correlationId || this.generateCorrelationId(),
      metadata,
      stackTrace: error?.stack,
      userAgent: metadata?.userAgent,
      ip: metadata?.ip,
      url: metadata?.url,
      method: metadata?.method,
      userId: metadata?.userId,
      sessionId: metadata?.sessionId,
    };

    this.winston.log(level, entry);

    // In development, also log to browser console if available
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log(`[${context}] ${message}`, metadata);
    }
  }

  /**
   * Debug level logging
   */
  debug(
    context: LogContext,
    message: string,
    metadata?: Record<string, any>,
    correlationId?: string
  ): void {
    this.log(LogLevel.DEBUG, context, message, metadata, correlationId);
  }

  /**
   * Info level logging
   */
  info(
    context: LogContext,
    message: string,
    metadata?: Record<string, any>,
    correlationId?: string
  ): void {
    this.log(LogLevel.INFO, context, message, metadata, correlationId);
  }

  /**
   * Warning level logging
   */
  warn(
    context: LogContext,
    message: string,
    metadata?: Record<string, any>,
    correlationId?: string
  ): void {
    this.log(LogLevel.WARN, context, message, metadata, correlationId);
  }

  /**
   * Error level logging with automatic stack trace
   */
  error(
    context: LogContext,
    message: string,
    error?: Error,
    metadata?: Record<string, any>,
    correlationId?: string
  ): void {
    this.log(
      LogLevel.ERROR,
      context,
      message,
      { ...metadata, errorMessage: error?.message },
      correlationId,
      error
    );
  }

  /**
   * Fatal level logging for critical system errors
   */
  fatal(
    context: LogContext,
    message: string,
    error?: Error,
    metadata?: Record<string, any>,
    correlationId?: string
  ): void {
    this.log(
      LogLevel.FATAL,
      context,
      message,
      { ...metadata, errorMessage: error?.message },
      correlationId,
      error
    );
  }

  /**
   * Start timing an operation
   */
  startTiming(
    operationId: string,
    context: LogContext,
    operation: string,
    metadata?: Record<string, any>
  ): void {
    this.activeTimings.set(operationId, {
      startTime: Date.now(),
      context,
      operation,
      metadata,
    });
  }

  /**
   * End timing an operation and log performance data
   */
  endTiming(operationId: string, correlationId?: string): number | null {
    const timing = this.activeTimings.get(operationId);
    if (!timing) {
      this.warn(LogContext.PERFORMANCE, `Timing operation not found: ${operationId}`);
      return null;
    }

    const duration = Date.now() - timing.startTime;
    this.activeTimings.delete(operationId);

    const performanceData = {
      duration,
      operation: timing.operation,
      ...timing.metadata,
    };

    // Log performance warning if operation is slow
    if (duration > 1000) {
      this.warn(
        LogContext.PERFORMANCE,
        `Slow operation detected: ${timing.operation}`,
        performanceData,
        correlationId
      );
    } else {
      this.info(
        LogContext.PERFORMANCE,
        `Operation completed: ${timing.operation}`,
        performanceData,
        correlationId
      );
    }

    return duration;
  }

  /**
   * Convenient timing wrapper for async operations
   */
  async timeOperation<T>(
    operationId: string,
    context: LogContext,
    operation: string,
    asyncFn: () => Promise<T>,
    correlationId?: string
  ): Promise<T> {
    this.startTiming(operationId, context, operation);
    try {
      const result = await asyncFn();
      this.endTiming(operationId, correlationId);
      return result;
    } catch (error) {
      this.endTiming(operationId, correlationId);
      this.error(context, `Operation failed: ${operation}`, error as Error, {}, correlationId);
      throw error;
    }
  }

  /**
   * Log API request details
   */
  apiRequest(
    method: string,
    url: string,
    correlationId: string,
    metadata?: Record<string, any>
  ): void {
    this.info(
      LogContext.API,
      `API Request: ${method} ${url}`,
      {
        method,
        url,
        ...metadata,
      },
      correlationId
    );
  }

  /**
   * Log API response details
   */
  apiResponse(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    correlationId: string,
    metadata?: Record<string, any>
  ): void {
    const level =
      statusCode >= 400 ? LogLevel.ERROR : statusCode >= 300 ? LogLevel.WARN : LogLevel.INFO;

    this.log(
      level,
      LogContext.API,
      `API Response: ${method} ${url} - ${statusCode}`,
      {
        method,
        url,
        statusCode,
        duration,
        ...metadata,
      },
      correlationId
    );
  }

  /**
   * Log database operations
   */
  database(
    operation: string,
    table: string,
    duration?: number,
    correlationId?: string,
    metadata?: Record<string, any>
  ): void {
    const level = duration && duration > 100 ? LogLevel.WARN : LogLevel.DEBUG;

    this.log(
      level,
      LogContext.DATABASE,
      `Database ${operation}: ${table}`,
      {
        operation,
        table,
        duration,
        ...metadata,
      },
      correlationId
    );
  }

  /**
   * Log AI service interactions
   */
  aiService(
    operation: string,
    model: string,
    tokens?: number,
    cost?: number,
    confidence?: number,
    correlationId?: string
  ): void {
    this.info(
      LogContext.AI_SERVICE,
      `AI Service: ${operation}`,
      {
        operation,
        model,
        tokens,
        cost,
        confidence,
      },
      correlationId
    );
  }

  /**
   * Log security events
   */
  security(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    metadata?: Record<string, any>,
    correlationId?: string
  ): void {
    const level =
      severity === 'critical'
        ? LogLevel.FATAL
        : severity === 'high'
          ? LogLevel.ERROR
          : severity === 'medium'
            ? LogLevel.WARN
            : LogLevel.INFO;

    this.log(
      level,
      LogContext.SECURITY,
      `Security Event: ${event}`,
      {
        event,
        severity,
        ...metadata,
      },
      correlationId
    );
  }

  /**
   * Log business events for analytics
   */
  business(
    event: string,
    userId?: string,
    metadata?: Record<string, any>,
    correlationId?: string
  ): void {
    this.info(
      LogContext.BUSINESS,
      `Business Event: ${event}`,
      {
        event,
        userId,
        ...metadata,
      },
      correlationId
    );
  }

  /**
   * Add production-specific transports
   */
  private addProductionTransports(): void {
    // Add external logging services in production
    if (process.env.DATADOG_API_KEY) {
      // Add DataDog transport
      // Implementation would depend on specific DataDog winston transport
    }

    if (process.env.SENTRY_DSN) {
      // Add Sentry transport for error logging
      // Implementation would depend on Sentry winston transport
    }

    // Add CloudWatch logs if running on AWS
    if (process.env.AWS_REGION) {
      // Add CloudWatch transport
      // Implementation would depend on CloudWatch winston transport
    }
  }

  /**
   * Create child logger with preset context and correlation ID
   */
  child(context: LogContext, correlationId?: string): ChildLogger {
    return new ChildLogger(this, context, correlationId || this.generateCorrelationId());
  }

  /**
   * Flush all logs (useful for graceful shutdown)
   */
  async flush(): Promise<void> {
    return new Promise((resolve) => {
      this.winston.on('finish', resolve);
      this.winston.end();
    });
  }
}

/**
 * Child logger for specific contexts with preset correlation ID
 */
class ChildLogger {
  constructor(
    private parent: AdvancedLogger,
    private context: LogContext,
    private correlationId: string
  ) {}

  debug(message: string, metadata?: Record<string, any>): void {
    this.parent.debug(this.context, message, metadata, this.correlationId);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.parent.info(this.context, message, metadata, this.correlationId);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.parent.warn(this.context, message, metadata, this.correlationId);
  }

  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.parent.error(this.context, message, error, metadata, this.correlationId);
  }

  startTiming(operationId: string, operation: string, metadata?: Record<string, any>): void {
    this.parent.startTiming(operationId, this.context, operation, metadata);
  }

  endTiming(operationId: string): number | null {
    return this.parent.endTiming(operationId, this.correlationId);
  }

  async timeOperation<T>(
    operationId: string,
    operation: string,
    asyncFn: () => Promise<T>
  ): Promise<T> {
    return this.parent.timeOperation(
      operationId,
      this.context,
      operation,
      asyncFn,
      this.correlationId
    );
  }
}

// Export singleton instance
export const advancedLogger = new AdvancedLogger();

// Export commonly used child loggers
export const apiLogger = advancedLogger.child(LogContext.API);
export const dbLogger = advancedLogger.child(LogContext.DATABASE);
export const aiLogger = advancedLogger.child(LogContext.AI_SERVICE);
export const securityLogger = advancedLogger.child(LogContext.SECURITY);
export const authLogger = advancedLogger.child(LogContext.AUTH);
export const uiLogger = advancedLogger.child(LogContext.UI);

export default advancedLogger;
