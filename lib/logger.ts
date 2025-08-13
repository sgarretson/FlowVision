/**
 * Advanced Logging System for FlowVision
 * Provides comprehensive logging for GitHub operations, CI/CD, and testing
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogContext {
  component?: string;
  operation?: string;
  userId?: string;
  requestId?: string;
  githubContext?: {
    pr?: string;
    branch?: string;
    commit?: string;
    action?: string;
  };
  testContext?: {
    suite?: string;
    test?: string;
    environment?: string;
  };
  performance?: {
    startTime?: number;
    duration?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  stack?: string;
  environment: string;
}

class Logger {
  private logLevel: LogLevel;
  private environment: string;
  private enabledContexts: Set<string>;

  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.logLevel = this.parseLogLevel(process.env.LOG_LEVEL || 'INFO');
    this.enabledContexts = new Set(
      (process.env.LOG_CONTEXTS || 'github,testing,api,auth,ai').split(',')
    );
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toUpperCase()) {
      case 'DEBUG':
        return LogLevel.DEBUG;
      case 'INFO':
        return LogLevel.INFO;
      case 'WARN':
        return LogLevel.WARN;
      case 'ERROR':
        return LogLevel.ERROR;
      case 'FATAL':
        return LogLevel.FATAL;
      default:
        return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel, context?: LogContext): boolean {
    if (level < this.logLevel) return false;

    // Check if context is enabled
    if (context?.component && !this.enabledContexts.has(context.component)) {
      return false;
    }

    return true;
  }

  private formatLogEntry(level: LogLevel, message: string, context: LogContext = {}): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        requestId: context.requestId || this.generateRequestId(),
      },
      environment: this.environment,
    };
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private writeLog(entry: LogEntry): void {
    const logString = JSON.stringify(entry, null, this.environment === 'development' ? 2 : 0);

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logString);
        break;
      case LogLevel.INFO:
        console.info(logString);
        break;
      case LogLevel.WARN:
        console.warn(logString);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(logString);
        break;
    }

    // In production, also write to external logging service
    if (this.environment === 'production' && entry.level >= LogLevel.WARN) {
      this.sendToExternalLogger(entry);
    }
  }

  private async sendToExternalLogger(entry: LogEntry): Promise<void> {
    try {
      // Send to external logging service (e.g., DataDog, LogRocket, etc.)
      // For now, we'll store critical logs in the database
      if (typeof window === 'undefined') {
        // Server-side only
        const { prisma } = await import('@/lib/prisma');
        await prisma.auditLog.create({
          data: {
            action: `LOG_${LogLevel[entry.level]}`,
            userId: entry.context.userId || null,
            details: {
              level: entry.level,
              message: entry.message,
              component: entry.context.component || 'SYSTEM',
              requestId: entry.context.requestId || 'unknown',
              environment: entry.environment,
              context: entry.context,
              timestamp: entry.timestamp,
            } as any, // Type assertion for Prisma JSON field
            timestamp: new Date(entry.timestamp),
          },
        });
      }
    } catch (error) {
      console.error('Failed to send log to external logger:', error);
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG, context)) {
      this.writeLog(this.formatLogEntry(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO, context)) {
      this.writeLog(this.formatLogEntry(LogLevel.INFO, message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN, context)) {
      this.writeLog(this.formatLogEntry(LogLevel.WARN, message, context));
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const entry = this.formatLogEntry(LogLevel.ERROR, message, context);
    if (error) {
      entry.stack = error.stack;
    }

    if (this.shouldLog(LogLevel.ERROR, context)) {
      this.writeLog(entry);
    }
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    const entry = this.formatLogEntry(LogLevel.FATAL, message, context);
    if (error) {
      entry.stack = error.stack;
    }

    if (this.shouldLog(LogLevel.FATAL, context)) {
      this.writeLog(entry);
    }
  }

  // Specialized logging methods
  github(
    message: string,
    githubContext: LogContext['githubContext'],
    metadata?: Record<string, unknown>
  ): void {
    this.info(message, {
      component: 'github',
      githubContext,
      metadata,
    });
  }

  testing(
    message: string,
    testContext: LogContext['testContext'],
    metadata?: Record<string, unknown>
  ): void {
    this.info(message, {
      component: 'testing',
      testContext,
      metadata,
    });
  }

  performance(
    message: string,
    duration: number,
    operation?: string,
    metadata?: Record<string, unknown>
  ): void {
    this.info(message, {
      component: 'performance',
      operation,
      performance: { duration },
      metadata,
    });
  }

  api(
    message: string,
    operation: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ): void {
    this.info(message, {
      component: 'api',
      operation,
      userId,
      metadata,
    });
  }

  // Performance timing helper
  time(label: string): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.performance(`Operation completed: ${label}`, duration, label);
    };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export specialized loggers for different contexts
export const githubLogger = {
  pr: (message: string, prNumber: string, metadata?: Record<string, unknown>) =>
    logger.github(message, { pr: prNumber }, metadata),

  workflow: (message: string, action: string, metadata?: Record<string, unknown>) =>
    logger.github(message, { action }, metadata),

  branch: (message: string, branch: string, metadata?: Record<string, unknown>) =>
    logger.github(message, { branch }, metadata),

  commit: (message: string, commit: string, metadata?: Record<string, unknown>) =>
    logger.github(message, { commit }, metadata),
};

export const testLogger = {
  suite: (message: string, suite: string, metadata?: Record<string, unknown>) =>
    logger.testing(message, { suite }, metadata),

  test: (message: string, test: string, suite?: string, metadata?: Record<string, unknown>) =>
    logger.testing(message, { test, suite }, metadata),

  environment: (message: string, environment: string, metadata?: Record<string, unknown>) =>
    logger.testing(message, { environment }, metadata),
};

export const apiLogger = {
  request: (
    endpoint: string,
    method: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ) => logger.api(`${method} ${endpoint}`, `${method}_${endpoint}`, userId, metadata),

  response: (
    endpoint: string,
    method: string,
    status: number,
    duration: number,
    metadata?: Record<string, unknown>
  ) =>
    logger.api(`${method} ${endpoint} - ${status}`, `${method}_${endpoint}_response`, undefined, {
      status,
      duration,
      ...metadata,
    }),

  error: (endpoint: string, method: string, error: Error, metadata?: Record<string, unknown>) =>
    logger.error(`API Error: ${method} ${endpoint}`, error, {
      component: 'api',
      operation: `${method}_${endpoint}`,
      metadata,
    }),
};

export default logger;
