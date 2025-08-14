'use client';

import React, { useState } from 'react';
import {
  CpuChipIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface AIAnalysisContext {
  categorySummary: string;
  strategicRecommendations: string[];
  impactAnalysis?: any;
  patterns?: string[];
  rootCauses?: string[];
  businessImpact?: any;
  confidence: number;
  generatedAt: string;
  issueCount: number;
}

interface AddressedIssue {
  id: string;
  description: string;
  category: string;
  status: string;
  votes: number;
  heatmapScore: number;
  createdAt: string;
}

interface InitiativeAIContextProps {
  sourceCategory?: string;
  aiAnalysisContext?: AIAnalysisContext;
  aiConfidence?: number;
  aiGeneratedAt?: string;
  addressedIssues?: AddressedIssue[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'OPEN':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'BEING_ADDRESSED':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'RESOLVED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'CLOSED':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'OPEN':
      return <ExclamationTriangleIcon className="w-4 h-4" />;
    case 'BEING_ADDRESSED':
      return <ClockIcon className="w-4 h-4" />;
    case 'RESOLVED':
      return <CheckCircleIcon className="w-4 h-4" />;
    case 'CLOSED':
      return <CheckCircleIcon className="w-4 h-4" />;
    default:
      return <InformationCircleIcon className="w-4 h-4" />;
  }
};

export default function InitiativeAIContext({
  sourceCategory,
  aiAnalysisContext,
  aiConfidence,
  aiGeneratedAt,
  addressedIssues = [],
}: InitiativeAIContextProps) {
  const [showAIDetails, setShowAIDetails] = useState(false);
  const [showIssuesList, setShowIssuesList] = useState(false);

  // Don't render if no AI context available
  if (!sourceCategory && !aiAnalysisContext && (!addressedIssues || addressedIssues.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* AI Analysis Context */}
      {(sourceCategory || aiAnalysisContext) && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowAIDetails(!showAIDetails)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <CpuChipIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-purple-900">AI-Generated Initiative</h3>
                <div className="flex items-center gap-4 text-sm text-purple-700">
                  {sourceCategory && (
                    <span>
                      Source: <span className="font-medium">{sourceCategory}</span>
                    </span>
                  )}
                  {aiConfidence && (
                    <span className="flex items-center gap-1">
                      <InformationCircleIcon className="w-4 h-4" />
                      {aiConfidence}% Confidence
                    </span>
                  )}
                  {aiGeneratedAt && (
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      {new Date(aiGeneratedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {showAIDetails ? (
              <ChevronUpIcon className="w-5 h-5 text-purple-600" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-purple-600" />
            )}
          </div>

          {showAIDetails && aiAnalysisContext && (
            <div className="mt-6 space-y-4">
              {/* Category Summary */}
              <div className="bg-white rounded-lg p-4 border border-purple-100">
                <h4 className="font-semibold text-purple-900 mb-2">Executive Summary</h4>
                <p className="text-gray-700">{aiAnalysisContext.categorySummary}</p>
              </div>

              {/* Strategic Recommendations */}
              {aiAnalysisContext.strategicRecommendations &&
                aiAnalysisContext.strategicRecommendations.length > 0 && (
                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                    <h4 className="font-semibold text-purple-900 mb-2">
                      Strategic Recommendations
                    </h4>
                    <ul className="space-y-2">
                      {aiAnalysisContext.strategicRecommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="w-5 h-5 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                            {index + 1}
                          </span>
                          <span className="text-gray-700">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Root Causes */}
              {aiAnalysisContext.rootCauses && aiAnalysisContext.rootCauses.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-purple-100">
                  <h4 className="font-semibold text-purple-900 mb-2">Root Causes Identified</h4>
                  <ul className="space-y-1">
                    {aiAnalysisContext.rootCauses.map((cause, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-gray-700 text-sm">{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Business Impact */}
              {aiAnalysisContext.businessImpact && (
                <div className="bg-white rounded-lg p-4 border border-purple-100">
                  <h4 className="font-semibold text-purple-900 mb-2">Business Impact Analysis</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {aiAnalysisContext.businessImpact.financial && (
                      <div>
                        <span className="font-medium text-gray-600">Financial Impact:</span>
                        <span className="ml-2 text-gray-700">
                          {aiAnalysisContext.businessImpact.financial}
                        </span>
                      </div>
                    )}
                    {aiAnalysisContext.businessImpact.operational && (
                      <div>
                        <span className="font-medium text-gray-600">Operational Impact:</span>
                        <span className="ml-2 text-gray-700">
                          {aiAnalysisContext.businessImpact.operational}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Addressed Issues */}
      {addressedIssues && addressedIssues.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowIssuesList(!showIssuesList)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Addressed Issues</h3>
                <p className="text-sm text-blue-700">
                  This initiative addresses {addressedIssues.length} employee feedback{' '}
                  {addressedIssues.length === 1 ? 'issue' : 'issues'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {addressedIssues.length} {addressedIssues.length === 1 ? 'Issue' : 'Issues'}
              </span>
              {showIssuesList ? (
                <ChevronUpIcon className="w-5 h-5 text-blue-600" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-blue-600" />
              )}
            </div>
          </div>

          {showIssuesList && (
            <div className="mt-6 space-y-3">
              {addressedIssues.map((issue) => (
                <div key={issue.id} className="bg-white rounded-lg p-4 border border-blue-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium mb-2">{issue.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>
                          Category: <span className="font-medium">{issue.category}</span>
                        </span>
                        <span>
                          Votes: <span className="font-medium">{issue.votes}</span>
                        </span>
                        <span>
                          Heat Score: <span className="font-medium">{issue.heatmapScore}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(issue.status)}`}
                      >
                        {getStatusIcon(issue.status)}
                        {issue.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
