'use client';

import React, { useState } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  LightBulbIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import type { PredictiveTrend } from '@/lib/predictive-analytics';

interface PredictiveTrendsCardProps {
  trends: PredictiveTrend[];
  loading?: boolean;
}

export default function PredictiveTrendsCard({ trends, loading }: PredictiveTrendsCardProps) {
  const [expandedTrend, setExpandedTrend] = useState<string | null>(null);

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

  const getTrendColor = (changePercent: number) => {
    if (changePercent > 5) return 'text-green-600';
    if (changePercent < -5) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendBgColor = (changePercent: number) => {
    if (changePercent > 5) return 'bg-green-50 border-green-200';
    if (changePercent < -5) return 'bg-red-50 border-red-200';
    return 'bg-gray-50 border-gray-200';
  };

  const getTrendIcon = (changePercent: number) => {
    if (changePercent > 0) {
      return <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />;
    } else if (changePercent < 0) {
      return <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />;
    }
    return <div className="w-4 h-4 bg-gray-400 rounded-full"></div>;
  };

  if (trends.length === 0) {
    return (
      <div className="card-secondary p-6">
        <div className="flex items-center gap-2 mb-4">
          <ChartBarIcon className="w-6 h-6 text-blue-600" />
          <h3 className="text-h3 text-gray-900">Predictive Trends</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChartBarIcon className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-700 font-medium">Generating trend analysis...</p>
          <p className="text-sm text-gray-600 mt-1">AI models require more historical data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-primary p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ChartBarIcon className="w-6 h-6 text-blue-600" />
          <h3 className="text-h3 text-gray-900">Predictive Trends</h3>
        </div>
        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
          {trends.length} Forecasts
        </div>
      </div>

      {/* Trends List */}
      <div className="space-y-3">
        {trends.map((trend, index) => (
          <div
            key={`${trend.metric}-${index}`}
            className={`border-2 rounded-xl p-4 transition-all duration-200 cursor-pointer hover:shadow-md ${getTrendBgColor(trend.changePercent)}`}
            onClick={() => setExpandedTrend(expandedTrend === trend.metric ? null : trend.metric)}
          >
            {/* Trend Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  {getTrendIcon(trend.changePercent)}
                  <div className="text-sm font-medium text-gray-900">{trend.metric}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    {trend.currentValue} → {trend.predictedValue}
                  </div>
                  <div className={`text-sm font-semibold ${getTrendColor(trend.changePercent)}`}>
                    {trend.changePercent > 0 ? '+' : ''}
                    {trend.changePercent}%
                  </div>
                </div>
                <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                  {trend.confidence}% confident
                </div>
                <ChevronDownIcon
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                    expandedTrend === trend.metric ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </div>

            {/* Expanded Details */}
            {expandedTrend === trend.metric && (
              <div className="mt-4 pt-4 border-t border-current border-opacity-20 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Key Factors</h5>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {trend.factors.map((factor, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-current rounded-full mt-2 flex-shrink-0 opacity-60"></div>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Recommendation</h5>
                    <div className="flex items-start gap-2">
                      <LightBulbIcon className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{trend.recommendation}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-current border-opacity-10">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Forecast timeframe: {trend.timeframe}</span>
                    <span>Confidence: {trend.confidence}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-700 font-medium">
            {trends.filter((t) => t.changePercent > 0).length} positive trends
          </span>
          <span className="text-gray-600">
            Avg confidence:{' '}
            {Math.round(trends.reduce((sum, t) => sum + t.confidence, 0) / trends.length)}%
          </span>
        </div>
      </div>
    </div>
  );
}
