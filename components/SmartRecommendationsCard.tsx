'use client';

import React, { useState } from 'react';
import {
  LightBulbIcon,
  SparklesIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import type { SmartRecommendation } from '@/lib/predictive-analytics';

interface SmartRecommendationsCardProps {
  recommendations: SmartRecommendation[];
  loading?: boolean;
}

export default function SmartRecommendationsCard({
  recommendations,
  loading,
}: SmartRecommendationsCardProps) {
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="card-primary p-6 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="skeleton h-6 w-6 rounded"></div>
          <div className="skeleton h-6 w-40"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-16 w-full rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'efficiency':
        return <SparklesIcon className="w-4 h-4" />;
      case 'cost':
        return <CurrencyDollarIcon className="w-4 h-4" />;
      case 'strategy':
        return <LightBulbIcon className="w-4 h-4" />;
      case 'risk':
        return <CheckCircleIcon className="w-4 h-4" />;
      default:
        return <LightBulbIcon className="w-4 h-4" />;
    }
  };

  const getSuccessProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-green-600';
    if (probability >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (recommendations.length === 0) {
    return (
      <div className="card-secondary p-6">
        <div className="flex items-center gap-2 mb-4">
          <LightBulbIcon className="w-6 h-6 text-yellow-600" />
          <h3 className="text-h3 text-gray-900">Smart Recommendations</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LightBulbIcon className="w-8 h-8 text-yellow-600" />
          </div>
          <p className="text-gray-700 font-medium">No recommendations available</p>
          <p className="text-sm text-gray-600 mt-1">AI analysis is generating insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-primary p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LightBulbIcon className="w-6 h-6 text-yellow-600" />
          <h3 className="text-h3 text-gray-900">Smart Recommendations</h3>
        </div>
        <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-medium">
          {recommendations.length} Actions
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-3">
        {recommendations.map((recommendation) => (
          <div
            key={recommendation.id}
            className={`border-2 rounded-xl p-4 transition-all duration-200 cursor-pointer hover:shadow-md ${getPriorityColor(recommendation.priority)}`}
            onClick={() =>
              setExpandedRecommendation(
                expandedRecommendation === recommendation.id ? null : recommendation.id
              )
            }
          >
            {/* Recommendation Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="flex items-center gap-2 mt-0.5">
                  {getCategoryIcon(recommendation.category)}
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(recommendation.priority)}`}
                  >
                    {recommendation.priority}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">
                    {recommendation.title}
                  </h4>
                  <p className="text-sm text-gray-700 line-clamp-2">{recommendation.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                    <span>Impact: {recommendation.expectedImpact}</span>
                    <span
                      className={`font-medium ${getSuccessProbabilityColor(recommendation.successProbability)}`}
                    >
                      {recommendation.successProbability}% success
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRightIcon
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 flex-shrink-0 ${
                  expandedRecommendation === recommendation.id ? 'rotate-90' : ''
                }`}
              />
            </div>

            {/* Expanded Details */}
            {expandedRecommendation === recommendation.id && (
              <div className="mt-4 pt-4 border-t border-current border-opacity-20 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Implementation</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">
                          Time: {recommendation.timeToImplement}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CurrencyDollarIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">
                          Resources: {recommendation.resourceRequirement}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-gray-500" />
                        <span
                          className={`font-medium ${getSuccessProbabilityColor(recommendation.successProbability)}`}
                        >
                          Success: {recommendation.successProbability}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Related Metrics</h5>
                    <div className="flex flex-wrap gap-1">
                      {recommendation.relatedMetrics.map((metric, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {metric}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Action Steps</h5>
                  <ol className="text-sm text-gray-700 space-y-1">
                    {recommendation.actionSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-4 h-4 bg-gray-200 text-gray-600 rounded-full text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="flex gap-2 pt-4">
                  <button className="btn-primary text-sm px-3 py-1">Implement</button>
                  <button className="btn-secondary text-sm px-3 py-1">Learn More</button>
                  <button className="btn-secondary text-sm px-3 py-1">Not Interested</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-red-600">
              {recommendations.filter((r) => r.priority === 'critical').length}
            </div>
            <div className="text-xs text-gray-600">Critical</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-orange-600">
              {recommendations.filter((r) => r.priority === 'high').length}
            </div>
            <div className="text-xs text-gray-600">High</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600">
              {recommendations.filter((r) => r.successProbability > 80).length}
            </div>
            <div className="text-xs text-gray-600">High Success</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-600">
              {Math.round(
                recommendations.reduce((sum, r) => sum + r.successProbability, 0) /
                  recommendations.length || 0
              )}
              %
            </div>
            <div className="text-xs text-gray-600">Avg Success</div>
          </div>
        </div>
      </div>
    </div>
  );
}
