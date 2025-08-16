'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { advancedLogger, LogContext } from '@/lib/advanced-logger';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  level?: 'page' | 'section' | 'component';
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showReloadButton?: boolean;
  showDetails?: boolean;
  className?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

class EnhancedErrorBoundary extends Component<Props, State> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: null,
    retryCount: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { level = 'component', onError } = this.props;
    const errorId = this.state.errorId || 'unknown';

    // Log error with context
    advancedLogger.error(
      LogContext.UI_ERROR,
      `Error boundary caught error at ${level} level`,
      error,
      {
        errorId,
        level,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount,
      }
    );

    // Update state with error info
    this.setState({ errorInfo });

    // Report to error tracking service
    this.reportError(error, errorInfo, errorId);

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }

    // Auto-retry for transient errors (with exponential backoff)
    if (this.isRetriableError(error) && this.state.retryCount < 3) {
      const retryDelay = Math.pow(2, this.state.retryCount) * 1000; // 1s, 2s, 4s

      const timeout = setTimeout(() => {
        this.handleRetry();
      }, retryDelay);

      this.retryTimeouts.push(timeout);
    }
  }

  public componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach((timeout) => clearTimeout(timeout));
  }

  private async reportError(error: Error, errorInfo: ErrorInfo, errorId: string) {
    try {
      await fetch('/api/error-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          errorId,
          level: this.props.level,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        }),
      });
    } catch (reportError) {
      advancedLogger.error(LogContext.UI_ERROR, 'Failed to report error', reportError as Error, {
        originalErrorId: errorId,
      });
    }
  }

  private isRetriableError(error: Error): boolean {
    // Determine if error is likely transient and worth retrying
    const retriablePatterns = [
      /network/i,
      /fetch/i,
      /timeout/i,
      /connection/i,
      /service unavailable/i,
    ];

    return retriablePatterns.some(
      (pattern) => pattern.test(error.message) || pattern.test(error.name)
    );
  }

  private handleRetry = () => {
    advancedLogger.info(LogContext.UI_ERROR, 'Attempting error boundary retry', {
      errorId: this.state.errorId,
      retryCount: this.state.retryCount + 1,
    });

    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  private handleReload = () => {
    advancedLogger.info(LogContext.UI_ERROR, 'Manual page reload triggered from error boundary', {
      errorId: this.state.errorId,
    });

    window.location.reload();
  };

  private getErrorTitle(): string {
    const { level = 'component' } = this.props;

    switch (level) {
      case 'page':
        return 'Page Error';
      case 'section':
        return 'Section Error';
      case 'component':
      default:
        return 'Component Error';
    }
  }

  private getErrorMessage(): string {
    const { error } = this.state;
    const { level = 'component' } = this.props;

    if (error?.message) {
      // User-friendly error messages
      if (error.message.includes('ChunkLoadError')) {
        return 'The application has been updated. Please refresh the page to get the latest version.';
      }

      if (error.message.includes('Network')) {
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      }

      if (error.message.includes('timeout')) {
        return 'The request took too long to complete. Please try again.';
      }
    }

    switch (level) {
      case 'page':
        return 'We encountered an error while loading this page. Please try refreshing or navigate to a different page.';
      case 'section':
        return 'There was a problem loading this section. Some features may be temporarily unavailable.';
      case 'component':
      default:
        return 'A component failed to load properly. This may be a temporary issue.';
    }
  }

  private getRecoveryActions(): Array<{ label: string; action: () => void; primary?: boolean }> {
    const { showReloadButton = true, level = 'component' } = this.props;
    const { retryCount } = this.state;
    const actions: Array<{ label: string; action: () => void; primary?: boolean }> = [];

    // Retry action (if not already auto-retried too many times)
    if (retryCount < 3) {
      actions.push({
        label: retryCount > 0 ? `Retry (${retryCount}/3)` : 'Try Again',
        action: this.handleRetry,
        primary: true,
      });
    }

    // Reload action (for page-level errors or when retries exhausted)
    if (showReloadButton && (level === 'page' || retryCount >= 3)) {
      actions.push({
        label: 'Reload Page',
        action: this.handleReload,
        primary: retryCount >= 3,
      });
    }

    // Navigate back (for page-level errors)
    if (level === 'page' && window.history.length > 1) {
      actions.push({
        label: 'Go Back',
        action: () => window.history.back(),
      });
    }

    return actions;
  }

  public render() {
    const { hasError, error, errorInfo } = this.state;
    const {
      children,
      fallback,
      showDetails = false,
      className = '',
      level = 'component',
    } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      const errorTitle = this.getErrorTitle();
      const errorMessage = this.getErrorMessage();
      const recoveryActions = this.getRecoveryActions();

      // Different layouts based on error level
      if (level === 'page') {
        return (
          <div className={`min-h-screen flex items-center justify-center bg-gray-50 ${className}`}>
            <div className="max-w-md w-full">
              <div className="error-state-container">
                <svg className="error-state-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>

                <h1 className="error-state-title">{errorTitle}</h1>
                <p className="error-state-description">{errorMessage}</p>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  {recoveryActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className={action.primary ? 'error-retry-button' : 'button-outline button-md'}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>

                {showDetails && process.env.NODE_ENV === 'development' && (
                  <details className="mt-6 text-left w-full max-w-2xl">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                      Error Details (Development)
                    </summary>
                    <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-lg text-sm">
                      <h4 className="font-semibold text-red-800">Error Message:</h4>
                      <p className="text-red-700 mt-1 font-mono">{error?.message}</p>

                      {error?.stack && (
                        <>
                          <h4 className="font-semibold text-red-800 mt-3">Stack Trace:</h4>
                          <pre className="text-red-700 mt-1 whitespace-pre-wrap overflow-auto text-xs">
                            {error.stack}
                          </pre>
                        </>
                      )}

                      {errorInfo?.componentStack && (
                        <>
                          <h4 className="font-semibold text-red-800 mt-3">Component Stack:</h4>
                          <pre className="text-red-700 mt-1 whitespace-pre-wrap overflow-auto text-xs">
                            {errorInfo.componentStack}
                          </pre>
                        </>
                      )}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        );
      }

      // Section or component level error
      return (
        <div className={`error-message ${className}`}>
          <div className="flex">
            <svg className="error-icon mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>

            <div className="flex-1">
              <h3 className="font-medium text-red-800">{errorTitle}</h3>
              <p className="text-red-700 mt-1">{errorMessage}</p>

              {recoveryActions.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {recoveryActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className={
                        action.primary
                          ? 'px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-button'
                          : 'px-3 py-1 border border-red-300 text-red-700 text-sm rounded hover:bg-red-50 transition-button'
                      }
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {showDetails && process.env.NODE_ENV === 'development' && error && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                    View Error Details
                  </summary>
                  <div className="mt-2 text-xs text-red-600 font-mono bg-red-50 p-2 rounded border">
                    {error.message}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default EnhancedErrorBoundary;
