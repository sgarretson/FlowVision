import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  LightBulbIcon,
  ChartBarIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ClockIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import { systemConfig } from '@/lib/system-config';

interface InitiativeValidationResult {
  score: number;
  strategicAlignment: {
    businessValue: number;
    feasibility: number;
    urgency: number;
    resourceRequirement: number;
  };
  completeness: {
    hasClearProblem: boolean;
    hasSpecificGoal: boolean;
    hasMeasurableOutcomes: boolean;
    hasTimelineConsideration: boolean;
    hasResourceEstimation: boolean;
    hasStakeholderImpact: boolean;
    wordCount: {
      title: number;
      problem: number;
      goal: number;
    };
  };
  crossImpactAnalysis: {
    conflictingInitiatives: Array<{
      id: string;
      title: string;
      conflictType: 'resource' | 'timeline' | 'scope' | 'strategic';
      severity: 'low' | 'medium' | 'high';
    }>;
    synergisticOpportunities: Array<{
      id: string;
      title: string;
      synergyType: 'resource' | 'timeline' | 'scope' | 'strategic';
      potential: 'low' | 'medium' | 'high';
    }>;
  };
  feedback: Array<{
    type: 'error' | 'warning' | 'success' | 'info';
    category: 'strategic' | 'tactical' | 'operational' | 'validation';
    message: string;
    suggestion?: string;
  }>;
  aiRecommendations: Array<{
    type: 'strategic' | 'tactical' | 'risk' | 'enhancement';
    priority: 'high' | 'medium' | 'low';
    content: string;
    reasoning: string;
    confidence: number;
  }>;
}

interface SmartInitiativeValidationProps {
  title: string;
  problem: string;
  goal: string;
  onValidationChange?: (result: InitiativeValidationResult) => void;
  showStrategicAnalysis?: boolean;
  showCrossImpactAnalysis?: boolean;
  className?: string;
}

export default function SmartInitiativeValidation({
  title,
  problem,
  goal,
  onValidationChange,
  showStrategicAnalysis = true,
  showCrossImpactAnalysis = true,
  className = '',
}: SmartInitiativeValidationProps) {
  const [validationResult, setValidationResult] = useState<InitiativeValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationThresholds, setValidationThresholds] = useState({
    excellent: 85,
    good: 70,
    poor: 50,
  });

  // Load validation thresholds from system configuration
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
      }
    };

    loadValidationThresholds();
  }, []);

  // Debounced validation effect
  useEffect(() => {
    // Require at least title and problem for validation
    if (!title || !problem || title.length < 3 || problem.length < 10) {
      setValidationResult(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/ai/validate-initiative', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            problem: problem.trim(),
            goal: goal.trim(),
            options: {
              includeStrategicAnalysis: showStrategicAnalysis,
              includeCrossImpactAnalysis: showCrossImpactAnalysis,
            },
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setValidationResult(result);
          onValidationChange?.(result);
        } else {
          console.error('Validation API call failed:', response.statusText);
        }
      } catch (error) {
        console.error('Initiative validation failed:', error);
      } finally {
        setLoading(false);
      }
    }, 1200); // Longer debounce for strategic analysis

    return () => clearTimeout(timeoutId);
  }, [title, problem, goal, showStrategicAnalysis, showCrossImpactAnalysis, onValidationChange]);

  if (!validationResult && !loading) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= validationThresholds.excellent)
      return 'text-green-600 bg-green-50 border-green-200';
    if (score >= validationThresholds.good) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreIcon = (score: number) => {
    if (score >= validationThresholds.excellent)
      return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
    if (score >= validationThresholds.good)
      return <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600" />;
    return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
  };

  const getStrategicAlignmentColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-blue-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getFeedbackIcon = (type: string) => {
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

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'strategic':
        return <SparklesIcon className="w-4 h-4 text-purple-500" />;
      case 'tactical':
        return <ChartBarIcon className="w-4 h-4 text-blue-500" />;
      case 'risk':
        return <FireIcon className="w-4 h-4 text-red-500" />;
      default:
        return <LightBulbIcon className="w-4 h-4 text-green-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-green-600 bg-green-100';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {loading && (
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          Analyzing strategic alignment and initiative quality...
        </div>
      )}

      {validationResult && (
        <>
          {/* Strategic Quality Score */}
          <div className={`p-6 rounded-lg border ${getScoreColor(validationResult.score)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {getScoreIcon(validationResult.score)}
                <span className="font-semibold text-lg">Strategic Initiative Quality</span>
              </div>
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5" />
                <span className="text-2xl font-bold">{validationResult.score}/100</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-white rounded-full h-3 mb-4">
              <div
                className={`h-3 rounded-full transition-all duration-700 ${
                  validationResult.score >= validationThresholds.excellent
                    ? 'bg-green-500'
                    : validationResult.score >= validationThresholds.good
                      ? 'bg-blue-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${validationResult.score}%` }}
              ></div>
            </div>

            {/* Strategic Alignment Breakdown */}
            {showStrategicAnalysis && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium">Business Value</span>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${getStrategicAlignmentColor(validationResult.strategicAlignment.businessValue)}`}
                        style={{ width: `${validationResult.strategicAlignment.businessValue}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-600">
                    {validationResult.strategicAlignment.businessValue}%
                  </span>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CheckCircleIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium">Feasibility</span>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${getStrategicAlignmentColor(validationResult.strategicAlignment.feasibility)}`}
                        style={{ width: `${validationResult.strategicAlignment.feasibility}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-600">
                    {validationResult.strategicAlignment.feasibility}%
                  </span>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <ClockIcon className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs font-medium">Urgency</span>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${getStrategicAlignmentColor(validationResult.strategicAlignment.urgency)}`}
                        style={{ width: `${validationResult.strategicAlignment.urgency}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-600">
                    {validationResult.strategicAlignment.urgency}%
                  </span>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <UsersIcon className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium">Resources</span>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${getStrategicAlignmentColor(validationResult.strategicAlignment.resourceRequirement)}`}
                        style={{
                          width: `${validationResult.strategicAlignment.resourceRequirement}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-600">
                    {validationResult.strategicAlignment.resourceRequirement}%
                  </span>
                </div>
              </div>
            )}

            {/* Completeness indicators */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              <div
                className={`flex items-center gap-1 ${validationResult.completeness.hasClearProblem ? 'text-green-600' : 'text-gray-400'}`}
              >
                {validationResult.completeness.hasClearProblem ? '✅' : '⚪'}
                Clear Problem
              </div>
              <div
                className={`flex items-center gap-1 ${validationResult.completeness.hasSpecificGoal ? 'text-green-600' : 'text-gray-400'}`}
              >
                {validationResult.completeness.hasSpecificGoal ? '✅' : '⚪'}
                Specific Goal
              </div>
              <div
                className={`flex items-center gap-1 ${validationResult.completeness.hasMeasurableOutcomes ? 'text-green-600' : 'text-gray-400'}`}
              >
                {validationResult.completeness.hasMeasurableOutcomes ? '✅' : '⚪'}
                Measurable
              </div>
              <div
                className={`flex items-center gap-1 ${validationResult.completeness.hasTimelineConsideration ? 'text-green-600' : 'text-gray-400'}`}
              >
                {validationResult.completeness.hasTimelineConsideration ? '✅' : '⚪'}
                Timeline
              </div>
              <div
                className={`flex items-center gap-1 ${validationResult.completeness.hasResourceEstimation ? 'text-green-600' : 'text-gray-400'}`}
              >
                {validationResult.completeness.hasResourceEstimation ? '✅' : '⚪'}
                Resources
              </div>
              <div
                className={`flex items-center gap-1 ${validationResult.completeness.hasStakeholderImpact ? 'text-green-600' : 'text-gray-400'}`}
              >
                {validationResult.completeness.hasStakeholderImpact ? '✅' : '⚪'}
                Stakeholders
              </div>
            </div>
          </div>

          {/* Cross-Initiative Impact Analysis */}
          {showCrossImpactAnalysis && validationResult.crossImpactAnalysis && (
            <>
              {(validationResult.crossImpactAnalysis.conflictingInitiatives.length > 0 ||
                validationResult.crossImpactAnalysis.synergisticOpportunities.length > 0) && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-5">
                  <h4 className="text-lg font-semibold text-indigo-800 flex items-center gap-2 mb-4">
                    <ArrowTrendingUpIcon className="w-5 h-5" />
                    Cross-Initiative Impact Analysis
                  </h4>

                  {/* Conflicts */}
                  {validationResult.crossImpactAnalysis.conflictingInitiatives.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-red-700 mb-2">
                        ⚠️ Potential Conflicts
                      </h5>
                      <div className="space-y-2">
                        {validationResult.crossImpactAnalysis.conflictingInitiatives.map(
                          (conflict, index) => (
                            <div
                              key={index}
                              className="bg-white rounded-md p-3 border border-red-100"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-800">
                                    {conflict.title}
                                  </p>
                                  <p className="text-xs text-gray-600 capitalize">
                                    {conflict.conflictType} conflict
                                  </p>
                                </div>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(conflict.severity)}`}
                                >
                                  {conflict.severity}
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Synergies */}
                  {validationResult.crossImpactAnalysis.synergisticOpportunities.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-green-700 mb-2">
                        🤝 Synergistic Opportunities
                      </h5>
                      <div className="space-y-2">
                        {validationResult.crossImpactAnalysis.synergisticOpportunities.map(
                          (synergy, index) => (
                            <div
                              key={index}
                              className="bg-white rounded-md p-3 border border-green-100"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-800">
                                    {synergy.title}
                                  </p>
                                  <p className="text-xs text-gray-600 capitalize">
                                    {synergy.synergyType} opportunity
                                  </p>
                                </div>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(synergy.potential)}`}
                                >
                                  {synergy.potential} potential
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Validation Feedback */}
          {validationResult.feedback.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <InformationCircleIcon className="w-4 h-4" />
                Strategic Validation Feedback
              </h4>
              {validationResult.feedback.map((feedback, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-md border-l-4 ${
                    feedback.type === 'error'
                      ? 'bg-red-50 border-red-400'
                      : feedback.type === 'warning'
                        ? 'bg-yellow-50 border-yellow-400'
                        : feedback.type === 'success'
                          ? 'bg-green-50 border-green-400'
                          : 'bg-blue-50 border-blue-400'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getFeedbackIcon(feedback.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-800">{feedback.message}</p>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full capitalize">
                          {feedback.category}
                        </span>
                      </div>
                      {feedback.suggestion && (
                        <p className="text-sm text-gray-600">💡 {feedback.suggestion}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI Strategic Recommendations */}
          {validationResult.aiRecommendations.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-5">
              <h4 className="text-lg font-semibold text-purple-800 flex items-center gap-2 mb-4">
                <SparklesIcon className="w-5 h-5" />
                AI Strategic Recommendations
              </h4>
              <div className="space-y-4">
                {validationResult.aiRecommendations.map((recommendation, index) => (
                  <div key={index} className="bg-white rounded-md p-4 border border-purple-100">
                    <div className="flex items-start gap-3">
                      {getRecommendationIcon(recommendation.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              recommendation.priority === 'high'
                                ? 'bg-red-100 text-red-700'
                                : recommendation.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {recommendation.priority} priority
                          </span>
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full capitalize">
                            {recommendation.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 font-medium mb-1">
                          {recommendation.content}
                        </p>
                        <p className="text-xs text-gray-600 mb-2">{recommendation.reasoning}</p>
                        <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                          {recommendation.confidence}% confidence
                        </span>
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
