'use client';

import React from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import type { StrategicHealthMetrics } from '@/lib/strategic-health';

interface StrategicHealthCardProps {
  metrics?: StrategicHealthMetrics;
  loading?: boolean;
}

export default function StrategicHealthCard({ metrics, loading }: StrategicHealthCardProps) {
  if (loading || !metrics) {
    return (
      <div className="card-primary p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton h-6 w-40"></div>
          <div className="skeleton h-8 w-20"></div>
        </div>
        <div className="skeleton h-16 w-24 mb-4"></div>
        <div className="skeleton h-4 w-full mb-2"></div>
        <div className="skeleton h-4 w-3/4"></div>
      </div>
    );
  }

  const getHealthColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 55) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 85) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-blue-50 border-blue-200';
    if (score >= 55) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getTrendIcon = () => {
    switch (metrics.trends.direction) {
      case 'up':
        return <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />;
      case 'down':
        return <ArrowTrendingDownIcon className="w-5 h-5 text-red-600" />;
      default:
        return <MinusIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div
      className={`card-elevated p-6 border-2 ${getHealthBgColor(metrics.overallScore)} group hover:shadow-card-elevated-hover transition-all duration-300`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ChartBarIcon className="w-6 h-6 text-primary" />
          <h3 className="text-h3 text-gray-900">Strategic Health Score</h3>
        </div>
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          <span className="text-sm font-medium text-gray-600">
            {metrics.trends.changePercent > 0 ? '+' : ''}
            {metrics.trends.changePercent}%
          </span>
        </div>
      </div>

      {/* Main Score */}
      <div className="mb-6">
        <div
          className={`text-5xl font-bold ${getHealthColor(metrics.overallScore)} mb-2 group-hover:scale-105 transition-transform duration-200`}
        >
          {metrics.overallScore}
        </div>
        <div className="text-sm text-gray-600 bg-white bg-opacity-50 px-3 py-1 rounded-full inline-block">
          Last {metrics.trends.timeframe}
        </div>
      </div>

      {/* Health Indicators */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">Initiative Velocity</span>
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${metrics.indicators.initiativeVelocity}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {metrics.indicators.initiativeVelocity}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">Issue Resolution</span>
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${metrics.indicators.issueResolution}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {metrics.indicators.issueResolution}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">Business Impact</span>
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${metrics.indicators.businessImpact}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {metrics.indicators.businessImpact}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">AI Efficiency</span>
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${metrics.indicators.aiEfficiency}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {metrics.indicators.aiEfficiency}
            </span>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      {metrics.insights.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-2">
            <InformationCircleIcon className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">Key Insights</span>
          </div>
          <div className="text-sm text-gray-700 space-y-1">
            {metrics.insights.slice(0, 2).map((insight, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
