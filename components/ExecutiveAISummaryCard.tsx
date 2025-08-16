'use client';

import React, { useState } from 'react';
import {
  SparklesIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  CheckCircleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import type { ExecutiveAISummary } from '@/lib/predictive-analytics';

interface ExecutiveAISummaryCardProps {
  summary: ExecutiveAISummary;
  loading?: boolean;
}

export default function ExecutiveAISummaryCard({ summary, loading }: ExecutiveAISummaryCardProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('insights');

  if (loading) {
    return (
      <div className="card-primary p-6 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="skeleton h-6 w-6 rounded"></div>
          <div className="skeleton h-6 w-48"></div>
        </div>
        <div className="skeleton h-16 w-full mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-12 w-full rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'attention':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
      case 'good':
        return <SparklesIcon className="w-6 h-6 text-blue-600" />;
      case 'attention':
        return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />;
      case 'critical':
        return <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />;
      default:
        return <EyeIcon className="w-6 h-6 text-gray-600" />;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div
      className={`card-elevated p-6 border-2 ${getStatusColor(summary.overallStatus)} group hover:shadow-card-elevated-hover transition-all duration-300`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getStatusIcon(summary.overallStatus)}
          <h3 className="text-h3 text-gray-900">Executive AI Summary</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${getConfidenceColor(summary.confidenceScore)}`}>
            {summary.confidenceScore}% confident
          </span>
          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">{summary.period}</span>
        </div>
      </div>

      {/* Status Overview */}
      <div className="mb-6 p-4 bg-white bg-opacity-60 rounded-xl border border-current border-opacity-20">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900 capitalize">
              {summary.overallStatus}
            </div>
            <div className="text-sm text-gray-600">Overall Status</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Generated</div>
            <div className="text-sm font-medium">{summary.generatedAt.toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Expandable Sections */}
      <div className="space-y-3">
        {/* Key Insights */}
        <div className="border border-gray-200 rounded-lg">
          <button
            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
            onClick={() => toggleSection('insights')}
          >
            <div className="flex items-center gap-2">
              <EyeIcon className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-gray-900">Key Insights</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {summary.keyInsights.length}
              </span>
            </div>
            <ChevronDownIcon
              className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                expandedSection === 'insights' ? 'rotate-180' : ''
              }`}
            />
          </button>
          {expandedSection === 'insights' && (
            <div className="px-3 pb-3 animate-fade-in">
              <ul className="space-y-2">
                {summary.keyInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Major Changes */}
        {summary.majorChanges.length > 0 && (
          <div className="border border-gray-200 rounded-lg">
            <button
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => toggleSection('changes')}
            >
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-gray-900">Major Changes</span>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                  {summary.majorChanges.length}
                </span>
              </div>
              <ChevronDownIcon
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  expandedSection === 'changes' ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedSection === 'changes' && (
              <div className="px-3 pb-3 animate-fade-in">
                <ul className="space-y-2">
                  {summary.majorChanges.map((change, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Upcoming Risks */}
        {summary.upcomingRisks.length > 0 && (
          <div className="border border-gray-200 rounded-lg">
            <button
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => toggleSection('risks')}
            >
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                <span className="font-medium text-gray-900">Upcoming Risks</span>
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                  {summary.upcomingRisks.length}
                </span>
              </div>
              <ChevronDownIcon
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  expandedSection === 'risks' ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedSection === 'risks' && (
              <div className="px-3 pb-3 animate-fade-in">
                <ul className="space-y-2">
                  {summary.upcomingRisks.map((risk, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Opportunities */}
        {summary.opportunities.length > 0 && (
          <div className="border border-gray-200 rounded-lg">
            <button
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => toggleSection('opportunities')}
            >
              <div className="flex items-center gap-2">
                <LightBulbIcon className="w-4 h-4 text-green-600" />
                <span className="font-medium text-gray-900">Opportunities</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {summary.opportunities.length}
                </span>
              </div>
              <ChevronDownIcon
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  expandedSection === 'opportunities' ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedSection === 'opportunities' && (
              <div className="px-3 pb-3 animate-fade-in">
                <ul className="space-y-2">
                  {summary.opportunities.map((opportunity, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>{opportunity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Recommended Actions */}
        {summary.recommendedActions.length > 0 && (
          <div className="border border-gray-200 rounded-lg">
            <button
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => toggleSection('actions')}
            >
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4 text-orange-600" />
                <span className="font-medium text-gray-900">Recommended Actions</span>
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                  {summary.recommendedActions.length}
                </span>
              </div>
              <ChevronDownIcon
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  expandedSection === 'actions' ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedSection === 'actions' && (
              <div className="px-3 pb-3 animate-fade-in">
                <ul className="space-y-2">
                  {summary.recommendedActions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <div className="w-4 h-4 bg-orange-200 text-orange-600 rounded-full text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
                        {idx + 1}
                      </div>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
