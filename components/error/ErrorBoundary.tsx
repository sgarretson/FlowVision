/**
 * React Error Boundary Components for FlowVision
 * Provides graceful error handling with user-friendly interfaces
 * and comprehensive error reporting for debugging.
 */

'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { advancedLogger, LogContext } from '@/lib/advanced-logger';
import { ErrorFactory, FlowVisionError, formatErrorForDevelopment } from '@/lib/error-handler';

// Error boundary state interface
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  correlationId: string;
  retryCount: number;
}

// Error boundary props interface
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, correlationId: string) => void;
  showDetails?: boolean;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  isolate?: boolean;
  context?: string;
}

/**
 * Main Error Boundary component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      correlationId: '',
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      correlationId: advancedLogger.generateCorrelationId(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const correlationId = this.state.correlationId || advancedLogger.generateCorrelationId();

    // Create FlowVision error from React error
    const appError = ErrorFactory.system(
      `React component error: ${error.message}`,
      error,
      correlationId
    );

    // Log error with full context
    advancedLogger.error(
      LogContext.UI,
      'React Error Boundary caught error',
      appError,
      {
        component: this.props.context || 'Unknown',
        errorBoundary: true,
        componentStack: errorInfo.componentStack,
        errorInfo,
        props: this.props.isolate ? '[isolated]' : this.props,
        retryCount: this.state.retryCount,
      },
      correlationId
    );

    // Update state with error info
    this.setState({
      errorInfo,
      correlationId,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, correlationId);
    }

    // Report to external error tracking in production
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      this.reportErrorToService(appError, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when props change (if enabled)
    if (hasError && resetOnPropsChange) {
      if (resetKeys) {
        const hasResetKeyChanged = resetKeys.some(
          (key, index) => key !== prevProps.resetKeys?.[index]
        );
        if (hasResetKeyChanged) {
          this.resetErrorBoundary();
        }
      } else {
        // Reset on any prop change
        if (prevProps !== this.props) {
          this.resetErrorBoundary();
        }
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    advancedLogger.info(LogContext.UI, 'Error boundary reset', {
      correlationId: this.state.correlationId,
      retryCount: this.state.retryCount,
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      correlationId: '',
      retryCount: this.state.retryCount + 1,
    });
  };

  retryAfterDelay = (delayMs: number = 1000) => {
    advancedLogger.info(LogContext.UI, `Retrying after ${delayMs}ms delay`, {
      correlationId: this.state.correlationId,
    });

    this.resetTimeoutId = window.setTimeout(() => {
      this.resetErrorBoundary();
    }, delayMs);
  };

  reportErrorToService = (error: FlowVisionError, errorInfo: ErrorInfo) => {
    // Report to external error tracking service
    // Implementation would depend on the chosen service (Sentry, LogRocket, etc.)
    try {
      if (window.Sentry) {
        window.Sentry.captureException(error, {
          tags: {
            component: 'ErrorBoundary',
            correlationId: error.correlationId,
          },
          extra: {
            componentStack: errorInfo.componentStack,
            retryCount: this.state.retryCount,
          },
        });
      }
    } catch (reportingError) {
      advancedLogger.error(
        LogContext.SYSTEM,
        'Failed to report error to external service',
        reportingError as Error,
        { originalError: error.message }
      );
    }
  };

  render() {
    const { hasError, error, errorInfo, correlationId, retryCount } = this.state;
    const { children, fallback, showDetails, maxRetries = 3 } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Determine if we should show retry option
      const canRetry = retryCount < maxRetries;

      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo}
          correlationId={correlationId}
          retryCount={retryCount}
          onRetry={canRetry ? this.resetErrorBoundary : undefined}
          onRetryAfterDelay={canRetry ? this.retryAfterDelay : undefined}
          showDetails={showDetails}
        />
      );
    }

    return children;
  }
}

/**
 * Error fallback component interface
 */
interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  correlationId: string;
  retryCount: number;
  onRetry?: () => void;
  onRetryAfterDelay?: (delay: number) => void;
  showDetails?: boolean;
}

/**
 * Default error fallback component
 */
export function ErrorFallback({
  error,
  errorInfo,
  correlationId,
  retryCount,
  onRetry,
  onRetryAfterDelay,
  showDetails = process.env.NODE_ENV === 'development',
}: ErrorFallbackProps) {
  const [detailsExpanded, setDetailsExpanded] = React.useState(false);
  const [reportSent, setReportSent] = React.useState(false);

  const sendReport = async () => {
    try {
      await fetch('/api/error-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
          errorInfo,
          correlationId,
          retryCount,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      });
      setReportSent(true);
      advancedLogger.info(LogContext.UI, 'Error report sent successfully', { correlationId });
    } catch (reportError) {
      advancedLogger.error(LogContext.UI, 'Failed to send error report', reportError as Error, {
        correlationId,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        {/* Error Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        {/* Error Message */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600">
            We encountered an unexpected error. Our team has been notified and is working on a fix.
          </p>
        </div>

        {/* Error ID */}
        <div className="bg-gray-50 rounded p-3 mb-4">
          <p className="text-sm text-gray-600">
            Error ID: <span className="font-mono text-gray-800">{correlationId}</span>
          </p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">Retry attempt: {retryCount}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-4">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          )}

          {onRetryAfterDelay && (
            <button
              onClick={() => onRetryAfterDelay(2000)}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Retry in 2 seconds
            </button>
          )}

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Refresh Page
          </button>

          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-100 text-gray-600 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Go Back
          </button>
        </div>

        {/* Send Report */}
        {!reportSent && (
          <button
            onClick={sendReport}
            className="w-full text-sm text-blue-600 hover:text-blue-800 underline mb-4"
          >
            Send Error Report
          </button>
        )}

        {reportSent && (
          <p className="text-sm text-green-600 text-center mb-4">
            ✓ Error report sent. Thank you for helping us improve!
          </p>
        )}

        {/* Technical Details (Development or Optional) */}
        {showDetails && (
          <div className="border-t pt-4">
            <button
              onClick={() => setDetailsExpanded(!detailsExpanded)}
              className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-gray-800"
            >
              <span>Technical Details</span>
              <svg
                className={`w-4 h-4 transform transition-transform ${detailsExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {detailsExpanded && (
              <div className="mt-3 space-y-3">
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 mb-1">Error Message:</h4>
                  <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded font-mono">
                    {error.message}
                  </p>
                </div>

                {error.stack && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-1">Stack Trace:</h4>
                    <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-auto max-h-32">
                      {error.stack}
                    </pre>
                  </div>
                )}

                {errorInfo?.componentStack && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-1">Component Stack:</h4>
                    <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-auto max-h-32">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}

                {process.env.NODE_ENV === 'development' && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-1">Development Info:</h4>
                    <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-auto max-h-32">
                      {formatErrorForDevelopment(error as any)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * HOC for wrapping components with error boundary
 */
export function withErrorBoundary<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WrappedComponent(props: T) {
    return (
      <ErrorBoundary {...errorBoundaryProps} context={Component.displayName || Component.name}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * Hook for handling errors in functional components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    const correlationId = advancedLogger.generateCorrelationId();

    advancedLogger.error(LogContext.UI, 'Manual error handling triggered', error, {
      correlationId,
    });

    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  // Throw error to be caught by error boundary
  if (error) {
    throw error;
  }

  return { handleError, clearError };
}

/**
 * Specialized error boundaries for different contexts
 */
export const PageErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary
    context="Page"
    resetOnPropsChange
    showDetails={process.env.NODE_ENV === 'development'}
  >
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary = ({
  children,
  name,
}: {
  children: ReactNode;
  name?: string;
}) => (
  <ErrorBoundary
    context={name || 'Component'}
    isolate
    maxRetries={2}
    fallback={
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-800 text-sm">
          This component encountered an error. Please refresh the page.
        </p>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export const ModalErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary
    context="Modal"
    isolate
    fallback={
      <div className="p-6 text-center">
        <p className="text-gray-600 mb-4">This dialog encountered an error.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Refresh Page
        </button>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;
