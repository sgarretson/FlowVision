'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowPathIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

interface CorrelationResult {
  sourceEntity: {
    id: string;
    type: string;
    title: string;
    status?: string;
    metadata: Record<string, any>;
  };
  targetEntity: {
    id: string;
    type: string;
    title: string;
    status?: string;
    metadata: Record<string, any>;
  };
  correlationType: {
    category: 'causal' | 'temporal' | 'resource' | 'thematic' | 'performance';
    direction: 'bidirectional' | 'source-to-target' | 'target-to-source';
    significance: 'high' | 'medium' | 'low';
  };
  strength: number;
  confidence: {
    score: number;
    reasoning: string[];
    dataQuality: 'high' | 'medium' | 'low';
    sampleSize: number;
    historicalAccuracy?: number;
  };
  patterns: Array<{
    patternType: 'recurring' | 'emerging' | 'seasonal' | 'cascade' | 'bottleneck';
    frequency: number;
    timeframe: string;
    description: string;
    lastOccurrence: Date;
    confidenceInterval: number;
  }>;
  businessImpact: {
    financial: {
      costOfInaction: number;
      potentialSavings: number;
      investmentRequired: number;
    };
    timeline: {
      daysToResolution: number;
      criticalDeadline?: Date;
    };
    resources: {
      peopleRequired: number;
      skillsNeeded: string[];
      toolsRequired: string[];
    };
    stakeholders: Array<{
      id: string;
      name: string;
      role: string;
      impactLevel: 'high' | 'medium' | 'low';
    }>;
  };
  recommendations: Array<{
    priority: 'immediate' | 'short-term' | 'long-term';
    category: 'prevention' | 'optimization' | 'mitigation' | 'escalation';
    action: string;
    rationale: string;
    expectedOutcome: string;
    requiredResources: string[];
    timeline: string;
    successMetrics: string[];
  }>;
}

interface CorrelationDashboardProps {
  entityId: string;
  entityType: 'issue' | 'initiative' | 'cluster' | 'user' | 'milestone';
  className?: string;
}

export default function CorrelationDashboard({
  entityId,
  entityType,
  className = '',
}: CorrelationDashboardProps) {
  const [correlations, setCorrelations] = useState<CorrelationResult[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCorrelation, setSelectedCorrelation] = useState<CorrelationResult | null>(null);
  const [analysisMetadata, setAnalysisMetadata] = useState<any>(null);

  useEffect(() => {
    fetchCorrelations();
  }, [entityId, entityType]);

  const fetchCorrelations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/insights/correlations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityId,
          entityType,
          options: {
            maxResults: 15,
            minStrength: 0.3,
            includeHistorical: true,
            timeRangeDays: 90,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch correlations');
      }

      const data = await response.json();
      setCorrelations(data.correlations || []);
      setInsights(data.insights || []);
      setRecommendations(data.recommendations || []);
      setAnalysisMetadata(data.metadata || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getCorrelationTypeIcon = (category: string) => {
    switch (category) {
      case 'causal':
        return ArrowPathIcon;
      case 'temporal':
        return ClockIcon;
      case 'resource':
        return UserGroupIcon;
      case 'thematic':
        return ChartBarIcon;
      case 'performance':
        return CheckCircleIcon;
      default:
        return InformationCircleIcon;
    }
  };

  const getCorrelationTypeColor = (category: string) => {
    switch (category) {
      case 'causal':
        return 'text-purple-600 bg-purple-100';
      case 'temporal':
        return 'text-blue-600 bg-blue-100';
      case 'resource':
        return 'text-orange-600 bg-orange-100';
      case 'thematic':
        return 'text-green-600 bg-green-100';
      case 'performance':
        return 'text-indigo-600 bg-indigo-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 0.8) return 'text-red-600 bg-red-100';
    if (strength >= 0.6) return 'text-orange-600 bg-orange-100';
    if (strength >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getSignificanceIcon = (significance: string) => {
    switch (significance) {
      case 'high':
        return ExclamationTriangleIcon;
      case 'medium':
        return InformationCircleIcon;
      case 'low':
        return CheckCircleIcon;
      default:
        return InformationCircleIcon;
    }
  };

  if (loading) {
    return (
      <div className={`card-elevated p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-48"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`card-elevated p-6 ${className}`}>
        <div className="text-center text-red-600">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-2" />
          <p className="font-medium">Correlation Analysis Failed</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
          <button
            onClick={fetchCorrelations}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Summary Stats */}
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <ChartBarIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Correlation Analysis</h2>
          </div>
          <button
            onClick={fetchCorrelations}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>

        {analysisMetadata && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analysisMetadata.totalFound}</div>
              <div className="text-sm text-blue-700">Total Found</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analysisMetadata.strongCorrelations}
              </div>
              <div className="text-sm text-green-700">Strong (&gt;70%)</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((analysisMetadata.averageStrength || 0) * 100)}%
              </div>
              <div className="text-sm text-purple-700">Avg Strength</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {correlations.filter((c) => c.correlationType.significance === 'high').length}
              </div>
              <div className="text-sm text-orange-700">High Significance</div>
            </div>
          </div>
        )}

        {/* Insights Summary */}
        {insights.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Insights</h3>
            <div className="space-y-2">
              {insights.map((insight, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System Recommendations */}
        {recommendations.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">System Recommendations</h3>
            <div className="space-y-2">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Correlation List */}
      <div className="card-elevated p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Detected Correlations ({correlations.length})
        </h3>

        {correlations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ChartBarIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No significant correlations detected</p>
            <p className="text-sm">Try adjusting the analysis parameters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {correlations.map((correlation, idx) => {
              const TypeIcon = getCorrelationTypeIcon(correlation.correlationType.category);
              const SignificanceIcon = getSignificanceIcon(
                correlation.correlationType.significance
              );

              return (
                <motion.div
                  key={`${correlation.sourceEntity.id}-${correlation.targetEntity.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="card-interactive p-4 border border-gray-200 hover:border-blue-300"
                  onClick={() => setSelectedCorrelation(correlation)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div
                          className={`p-2 rounded-lg ${getCorrelationTypeColor(
                            correlation.correlationType.category
                          )}`}
                        >
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {correlation.sourceEntity.title} ↔ {correlation.targetEntity.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {correlation.correlationType.category} correlation
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">Strength:</span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStrengthColor(
                              correlation.strength
                            )}`}
                          >
                            {Math.round(correlation.strength * 100)}%
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">Confidence:</span>
                          <span className="font-medium">{correlation.confidence.score}%</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <SignificanceIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-500 capitalize">
                            {correlation.correlationType.significance}
                          </span>
                        </div>
                      </div>

                      {correlation.patterns.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-500 mb-1">Detected Patterns:</div>
                          <div className="flex flex-wrap gap-1">
                            {correlation.patterns.slice(0, 3).map((pattern, pidx) => (
                              <span
                                key={pidx}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                              >
                                {pattern.patternType}
                              </span>
                            ))}
                            {correlation.patterns.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{correlation.patterns.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-right text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <CurrencyDollarIcon className="h-4 w-4" />
                        <span>
                          $
                          {Math.round(correlation.businessImpact.financial.potentialSavings / 1000)}
                          k
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                        <ClockIcon className="h-4 w-4" />
                        <span>{correlation.businessImpact.timeline.daysToResolution}d</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Correlation Modal */}
      {selectedCorrelation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Correlation Details</h3>
                <button
                  onClick={() => setSelectedCorrelation(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Correlation Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Source Entity</h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="font-medium">{selectedCorrelation.sourceEntity.title}</div>
                    <div className="text-sm text-gray-600 capitalize">
                      {selectedCorrelation.sourceEntity.type}
                    </div>
                    {selectedCorrelation.sourceEntity.status && (
                      <div className="text-sm text-gray-500 mt-1">
                        Status: {selectedCorrelation.sourceEntity.status}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Target Entity</h4>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="font-medium">{selectedCorrelation.targetEntity.title}</div>
                    <div className="text-sm text-gray-600 capitalize">
                      {selectedCorrelation.targetEntity.type}
                    </div>
                    {selectedCorrelation.targetEntity.status && (
                      <div className="text-sm text-gray-500 mt-1">
                        Status: {selectedCorrelation.targetEntity.status}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Business Impact */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Business Impact</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-sm text-red-600 font-medium">Cost of Inaction</div>
                    <div className="text-lg font-bold text-red-700">
                      $
                      {selectedCorrelation.businessImpact.financial.costOfInaction.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-600 font-medium">Potential Savings</div>
                    <div className="text-lg font-bold text-green-700">
                      $
                      {selectedCorrelation.businessImpact.financial.potentialSavings.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium">Investment Required</div>
                    <div className="text-lg font-bold text-blue-700">
                      $
                      {selectedCorrelation.businessImpact.financial.investmentRequired.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Patterns */}
              {selectedCorrelation.patterns.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Detected Patterns</h4>
                  <div className="space-y-3">
                    {selectedCorrelation.patterns.map((pattern, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="font-medium capitalize">{pattern.patternType}</div>
                          <div className="text-sm text-gray-500">
                            {Math.round(pattern.confidenceInterval * 100)}% confidence
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{pattern.description}</div>
                        <div className="text-xs text-gray-500 mt-2">
                          Frequency: {pattern.frequency} | Timeframe: {pattern.timeframe}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {selectedCorrelation.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Recommendations</h4>
                  <div className="space-y-3">
                    {selectedCorrelation.recommendations.map((rec, idx) => (
                      <div key={idx} className="border border-gray-200 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{rec.action}</div>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              rec.priority === 'immediate'
                                ? 'bg-red-100 text-red-700'
                                : rec.priority === 'short-term'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {rec.priority}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">{rec.rationale}</div>
                        <div className="text-sm text-gray-500">
                          Expected outcome: {rec.expectedOutcome}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
