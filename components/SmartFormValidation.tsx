import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  LightBulbIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import {
  smartFormValidator,
  ValidationResult,
  ValidationFeedback,
  SmartSuggestion,
} from '@/lib/smart-form-validation';
import { systemConfig } from '@/lib/system-config';

interface SmartFormValidationProps {
  description: string;
  selectedCategories?: {
    businessArea?: string;
    department?: string;
    impactType?: string;
  };
  onValidationChange?: (result: ValidationResult) => void;
  showSuggestions?: boolean;
  className?: string;
}

export default function SmartFormValidation({
  description,
  selectedCategories,
  onValidationChange,
  showSuggestions = true,
  className = '',
}: SmartFormValidationProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationThresholds, setValidationThresholds] = useState({
    excellent: 80,
    good: 60,
    poor: 40,
  });
  const [improvementSuggestions, setImprovementSuggestions] = useState<SmartSuggestion[]>([]);

  // Load validation thresholds from configuration
  useEffect(() => {
    const loadValidationThresholds = async () => {
      try {
        const thresholds = await systemConfig.getValidationThresholds();
        setValidationThresholds({
          excellent: thresholds.excellent,
          good: thresholds.good,
          poor: thresholds.needsImprovement,
        });
      } catch (error) {
        console.error('Failed to load validation thresholds:', error);
        // Keep default values if loading fails
      }
    };

    loadValidationThresholds();
  }, []);

  // Debounced validation effect
  useEffect(() => {
    if (!description || description.length < 5) {
      setValidationResult(null);
      setImprovementSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await smartFormValidator.validateIssueDescription(
          description,
          selectedCategories
        );
        setValidationResult(result);
        onValidationChange?.(result);

        // Get improvement suggestions if score is below 80
        if (showSuggestions && result.score < 80) {
          const suggestions = await smartFormValidator.getImprovementSuggestions(
            description,
            result.score
          );
          setImprovementSuggestions(suggestions);
        } else {
          setImprovementSuggestions([]);
        }
      } catch (error) {
        console.error('Validation failed:', error);
      } finally {
        setLoading(false);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timeoutId);
  }, [description, selectedCategories, onValidationChange, showSuggestions]);

  if (!validationResult && !loading) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= validationThresholds.excellent)
      return 'text-green-600 bg-green-50 border-green-200';
    if (score >= validationThresholds.good) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreIcon = (score: number) => {
    if (score >= validationThresholds.excellent)
      return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
    if (score >= validationThresholds.good)
      return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
    return <XCircleIcon className="w-5 h-5 text-red-600" />;
  };

  const getFeedbackIcon = (type: ValidationFeedback['type']) => {
    switch (type) {
      case 'error':
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
      case 'success':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      default:
        return <InformationCircleIcon className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSuggestionIcon = (type: SmartSuggestion['type']) => {
    switch (type) {
      case 'completion':
        return '✍️';
      case 'example':
        return '💡';
      case 'template':
        return '📝';
      default:
        return '💭';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {loading && (
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          Analyzing your description...
        </div>
      )}

      {validationResult && (
        <>
          {/* Quality Score */}
          <div className={`p-4 rounded-lg border ${getScoreColor(validationResult.score)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getScoreIcon(validationResult.score)}
                <span className="font-semibold">Issue Quality Score</span>
              </div>
              <div className="flex items-center gap-2">
                <ChartBarIcon className="w-4 h-4" />
                <span className="text-lg font-bold">{validationResult.score}/100</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-white rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  validationResult.score >= validationThresholds.excellent
                    ? 'bg-green-500'
                    : validationResult.score >= validationThresholds.good
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${validationResult.score}%` }}
              ></div>
            </div>

            {/* Completeness indicators */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              <div
                className={`flex items-center gap-1 ${validationResult.completeness.hasBusinessImpact ? 'text-green-600' : 'text-gray-400'}`}
              >
                {validationResult.completeness.hasBusinessImpact ? '✅' : '⚪'}
                Business Impact
              </div>
              <div
                className={`flex items-center gap-1 ${validationResult.completeness.hasFrequency ? 'text-green-600' : 'text-gray-400'}`}
              >
                {validationResult.completeness.hasFrequency ? '✅' : '⚪'}
                Frequency
              </div>
              <div
                className={`flex items-center gap-1 ${validationResult.completeness.hasAffectedDepartments ? 'text-green-600' : 'text-gray-400'}`}
              >
                {validationResult.completeness.hasAffectedDepartments ? '✅' : '⚪'}
                Stakeholders
              </div>
              <div
                className={`flex items-center gap-1 ${validationResult.completeness.hasSpecificExamples ? 'text-green-600' : 'text-gray-400'}`}
              >
                {validationResult.completeness.hasSpecificExamples ? '✅' : '⚪'}
                Examples
              </div>
              <div
                className={`flex items-center gap-1 ${validationResult.completeness.hasMeasurableMetrics ? 'text-green-600' : 'text-gray-400'}`}
              >
                {validationResult.completeness.hasMeasurableMetrics ? '✅' : '⚪'}
                Metrics
              </div>
              <div className="text-gray-600">{validationResult.completeness.wordCount} words</div>
            </div>
          </div>

          {/* Feedback Messages */}
          {validationResult.feedback.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <InformationCircleIcon className="w-4 h-4" />
                Validation Feedback
              </h4>
              {validationResult.feedback.map((feedback, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-md border-l-4 ${
                    feedback.type === 'error'
                      ? 'bg-red-50 border-red-400'
                      : feedback.type === 'warning'
                        ? 'bg-yellow-50 border-yellow-400'
                        : feedback.type === 'success'
                          ? 'bg-green-50 border-green-400'
                          : 'bg-blue-50 border-blue-400'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {getFeedbackIcon(feedback.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{feedback.message}</p>
                      {feedback.suggestion && (
                        <p className="text-sm text-gray-600 mt-1">💡 {feedback.suggestion}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI Improvement Suggestions */}
          {showSuggestions && improvementSuggestions.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-purple-800 flex items-center gap-2 mb-3">
                <LightBulbIcon className="w-4 h-4" />
                AI Improvement Suggestions
              </h4>
              <div className="space-y-3">
                {improvementSuggestions.map((suggestion, index) => (
                  <div key={index} className="bg-white rounded-md p-3 border border-purple-100">
                    <div className="flex items-start gap-2">
                      <span className="text-lg flex-shrink-0">
                        {getSuggestionIcon(suggestion.type)}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 font-medium">{suggestion.content}</p>
                        <p className="text-xs text-gray-600 mt-1">{suggestion.reasoning}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                            {suggestion.confidence}% confidence
                          </span>
                          <span className="text-xs text-gray-500 capitalize">
                            {suggestion.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
