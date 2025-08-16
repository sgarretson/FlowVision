'use client';

import React, { useState, useEffect } from 'react';
import { AIProgress } from '@/lib/async-ai-service';

interface AIProgressIndicatorProps {
  operationId: string;
  onCancel?: () => void;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

interface ProgressStep {
  id: string;
  label: string;
  description: string;
  estimatedDuration: number;
}

const progressSteps: Record<string, ProgressStep[]> = {
  issue_analysis: [
    {
      id: 'initialization',
      label: 'Initializing',
      description: 'Preparing AI analysis',
      estimatedDuration: 500,
    },
    {
      id: 'content_analysis',
      label: 'Analyzing',
      description: 'Processing issue content',
      estimatedDuration: 1500,
    },
    {
      id: 'ai_processing',
      label: 'AI Processing',
      description: 'Generating insights',
      estimatedDuration: 2000,
    },
    {
      id: 'finalization',
      label: 'Finalizing',
      description: 'Completing analysis',
      estimatedDuration: 500,
    },
  ],
  initiative_generation: [
    {
      id: 'initialization',
      label: 'Initializing',
      description: 'Setting up generation',
      estimatedDuration: 300,
    },
    {
      id: 'issue_analysis',
      label: 'Issue Analysis',
      description: 'Analyzing related issues',
      estimatedDuration: 1000,
    },
    {
      id: 'generation',
      label: 'Generating',
      description: 'Creating initiative recommendations',
      estimatedDuration: 2500,
    },
    {
      id: 'finalization',
      label: 'Finalizing',
      description: 'Formatting results',
      estimatedDuration: 300,
    },
  ],
  clustering: [
    {
      id: 'initialization',
      label: 'Initializing',
      description: 'Preparing clustering',
      estimatedDuration: 400,
    },
    {
      id: 'data_processing',
      label: 'Processing',
      description: 'Analyzing data patterns',
      estimatedDuration: 1800,
    },
    {
      id: 'clustering',
      label: 'Clustering',
      description: 'Grouping similar items',
      estimatedDuration: 1500,
    },
    {
      id: 'finalization',
      label: 'Finalizing',
      description: 'Organizing results',
      estimatedDuration: 400,
    },
  ],
  insights: [
    {
      id: 'initialization',
      label: 'Initializing',
      description: 'Setting up analysis',
      estimatedDuration: 300,
    },
    {
      id: 'data_analysis',
      label: 'Analyzing',
      description: 'Processing data trends',
      estimatedDuration: 2000,
    },
    {
      id: 'insight_generation',
      label: 'Generating',
      description: 'Creating insights',
      estimatedDuration: 1500,
    },
    {
      id: 'finalization',
      label: 'Finalizing',
      description: 'Compiling results',
      estimatedDuration: 300,
    },
  ],
};

export const AIProgressIndicator: React.FC<AIProgressIndicatorProps> = ({
  operationId,
  onCancel,
  onComplete,
  onError,
  className = '',
  variant = 'default',
}) => {
  const [progress, setProgress] = useState<AIProgress | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  // Determine operation type from progress data
  const operationType = progress?.currentStep
    ? Object.keys(progressSteps).find((type) =>
        progressSteps[type].some((step) => step.id === progress.currentStep)
      ) || 'issue_analysis'
    : 'issue_analysis';

  const steps = progressSteps[operationType];
  const currentStepIndex = progress?.currentStep
    ? steps.findIndex((step) => step.id === progress.currentStep)
    : 0;

  // Poll for progress updates
  useEffect(() => {
    if (!isPolling) return;

    const pollProgress = async () => {
      try {
        const response = await fetch(`/api/ai/progress/${operationId}`);
        if (response.ok) {
          const progressData: AIProgress = await response.json();
          setProgress(progressData);

          if (progressData.status === 'completed') {
            setIsPolling(false);
            if (onComplete) {
              // Fetch the result
              const resultResponse = await fetch(`/api/ai/result/${operationId}`);
              if (resultResponse.ok) {
                const result = await resultResponse.json();
                onComplete(result);
              }
            }
          } else if (progressData.status === 'failed') {
            setIsPolling(false);
            if (onError) {
              onError(progressData.message);
            }
          } else if (progressData.status === 'cancelled') {
            setIsPolling(false);
          }
        }
      } catch (error) {
        console.error('Error polling progress:', error);
        if (onError) {
          onError('Failed to check progress');
        }
      }
    };

    const interval = setInterval(pollProgress, 500);
    pollProgress(); // Initial poll

    return () => clearInterval(interval);
  }, [operationId, isPolling, onComplete, onError]);

  // Track elapsed time
  useEffect(() => {
    if (!progress || progress.status === 'completed' || progress.status === 'failed') return;

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - progress.startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [progress]);

  // Calculate estimated time remaining
  useEffect(() => {
    if (!progress || !steps.length) return;

    if (progress.estimatedCompletion) {
      setEstimatedTimeRemaining(Math.max(0, progress.estimatedCompletion - Date.now()));
    } else if (currentStepIndex >= 0) {
      // Calculate based on step progress
      const remainingSteps = steps.slice(currentStepIndex + 1);
      const currentStepRemaining =
        ((100 - progress.progress) / 100) * steps[currentStepIndex]?.estimatedDuration || 0;
      const totalRemaining =
        currentStepRemaining +
        remainingSteps.reduce((sum, step) => sum + step.estimatedDuration, 0);
      setEstimatedTimeRemaining(totalRemaining);
    }
  }, [progress, currentStepIndex, steps]);

  const handleCancel = async () => {
    if (!onCancel) return;

    try {
      const response = await fetch(`/api/ai/cancel/${operationId}`, { method: 'POST' });
      if (response.ok) {
        setIsPolling(false);
        onCancel();
      }
    } catch (error) {
      console.error('Error cancelling operation:', error);
    }
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'cancelled':
        return 'text-gray-600';
      case 'processing':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getProgressColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-500';
      case 'processing':
        return 'bg-blue-500';
      default:
        return 'bg-gray-300';
    }
  };

  if (!progress) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span className="text-sm text-gray-600">Initializing AI operation...</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-900">
              {progress.status === 'processing' ? 'Processing...' : progress.message}
            </span>
            <span className="text-xs text-gray-500">{progress.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress.status)}`}
              style={{ width: `${progress.progress}%` }}
            ></div>
          </div>
        </div>
        {onCancel && progress.status === 'processing' && (
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Cancel operation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">AI Processing</h3>
          <p className="text-sm text-gray-600 capitalize">
            {operationType.replace('_', ' ')} • Operation #{operationId.slice(-8)}
          </p>
        </div>
        {onCancel && progress.status === 'processing' && (
          <button
            onClick={handleCancel}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${getStatusColor(progress.status)}`}>
            {progress.message}
          </span>
          <span className="text-sm text-gray-500">{progress.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(progress.status)} ${
              progress.status === 'processing' ? 'animate-pulse' : ''
            }`}
            style={{ width: `${progress.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Detailed Steps */}
      {variant === 'detailed' && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Processing Steps</h4>
          <div className="space-y-3">
            {steps.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex || progress.status === 'completed';
              const isUpcoming = index > currentStepIndex;

              return (
                <div key={step.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    ) : isActive ? (
                      <div className="w-5 h-5 bg-blue-500 rounded-full animate-pulse"></div>
                    ) : (
                      <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        isActive
                          ? 'text-blue-600'
                          : isCompleted
                            ? 'text-green-600'
                            : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Time Information */}
      <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
        <div className="flex items-center space-x-4">
          <span>
            <span className="font-medium">Elapsed:</span> {formatTime(elapsedTime)}
          </span>
          {estimatedTimeRemaining !== null && progress.status === 'processing' && (
            <span>
              <span className="font-medium">Remaining:</span> ~{formatTime(estimatedTimeRemaining)}
            </span>
          )}
        </div>

        {progress.status === 'completed' && (
          <div className="flex items-center space-x-1 text-green-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Completed</span>
          </div>
        )}

        {progress.status === 'failed' && (
          <div className="flex items-center space-x-1 text-red-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Failed</span>
          </div>
        )}
      </div>

      {/* Performance Tips */}
      {progress.status === 'processing' &&
        estimatedTimeRemaining &&
        estimatedTimeRemaining > 3000 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex">
              <svg
                className="flex-shrink-0 w-5 h-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Tip:</span> You can continue working on other tasks
                  while this processes in the background.
                </p>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default AIProgressIndicator;
