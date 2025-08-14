'use client';

import React, { useState, useEffect } from 'react';
import {
  SparklesIcon,
  ClockIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface AISummaryProps {
  itemId: string;
  itemType: 'issue' | 'cluster';
  summary?: string | null;
  confidence?: number | null;
  generatedAt?: string | null;
  version?: string | null;
  onSummaryGenerated?: (summary: string) => void;
  onSummaryUpdated?: (summary: string) => void;
  className?: string;
}

interface AIAnalysis {
  summary: string;
  rootCauses?: string[];
  impact?: string;
  recommendations?: string[];
  crossIssuePatterns?: string[];
  strategicPriority?: string;
  initiativeRecommendations?: string[];
  confidence: number;
  generatedAt: string;
}

export default function AISummary({
  itemId,
  itemType,
  summary,
  confidence,
  generatedAt,
  version,
  onSummaryGenerated,
  onSummaryUpdated,
  className = '',
}: AISummaryProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState(summary || '');
  const [fullAnalysis, setFullAnalysis] = useState<AIAnalysis | null>(null);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPersistentAnalysis, setLoadingPersistentAnalysis] = useState(false);

  useEffect(() => {
    setEditedSummary(summary || '');

    // Load persistent detailed analysis if summary exists but fullAnalysis doesn't
    if (summary && !fullAnalysis && !loadingPersistentAnalysis) {
      loadPersistentAnalysis();
    }
  }, [summary, fullAnalysis, loadingPersistentAnalysis]);

  const loadPersistentAnalysis = async () => {
    setLoadingPersistentAnalysis(true);
    try {
      const endpoint = itemType === 'issue' ? `/api/issues/${itemId}` : `/api/clusters/${itemId}`;

      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        const analysisDetails =
          itemType === 'issue' ? data.issue?.aiAnalysisDetails : data.cluster?.aiAnalysisDetails;

        if (analysisDetails) {
          setFullAnalysis({
            summary: analysisDetails.summary || summary || '',
            rootCauses: analysisDetails.rootCauses || [],
            impact: analysisDetails.impact || '',
            recommendations: analysisDetails.recommendations || [],
            crossIssuePatterns: analysisDetails.crossIssuePatterns || [],
            strategicPriority: analysisDetails.strategicPriority || '',
            initiativeRecommendations: analysisDetails.initiativeRecommendations || [],
            confidence: analysisDetails.confidence || 75,
            generatedAt: analysisDetails.generatedAt || new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.error('Failed to load persistent analysis:', err);
    } finally {
      setLoadingPersistentAnalysis(false);
    }
  };

  const generateSummary = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const endpoint =
        itemType === 'issue'
          ? `/api/issues/${itemId}/generate-summary`
          : `/api/clusters/${itemId}/generate-summary`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate AI summary');
      }

      const data = await response.json();
      setFullAnalysis(data.analysis);

      if (onSummaryGenerated) {
        onSummaryGenerated(data.analysis.summary);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveSummary = async () => {
    if (editedSummary.trim() === summary) {
      setIsEditing(false);
      return;
    }

    try {
      // Here you would call an API to update the summary
      // For now, we'll just call the callback
      if (onSummaryUpdated) {
        onSummaryUpdated(editedSummary.trim());
      }
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update summary');
    }
  };

  const cancelEdit = () => {
    setEditedSummary(summary || '');
    setIsEditing(false);
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return 'text-green-600 bg-green-50';
    if (conf >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceText = (conf: number) => {
    if (conf >= 80) return 'High Confidence';
    if (conf >= 60) return 'Medium Confidence';
    return 'Low Confidence';
  };

  // If no summary exists, show generate button
  if (!summary && !isGenerating) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="w-5 h-5 text-blue-600" />
            <span className="text-blue-900 font-medium">AI Analysis Available</span>
          </div>
          <button
            onClick={generateSummary}
            className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <SparklesIcon className="w-4 h-4" />
            <span>Generate Summary</span>
          </button>
        </div>
        <p className="text-blue-700 text-sm mt-2">
          Get AI-powered insights, root cause analysis, and recommendations for this {itemType}.
        </p>
        {error && (
          <div className="mt-2 flex items-center space-x-2 text-red-600">
            <ExclamationTriangleIcon className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
    );
  }

  // Show loading state
  if (isGenerating) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin">
            <SparklesIcon className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-blue-900 font-medium">Generating AI Analysis...</span>
        </div>
        <p className="text-blue-700 text-sm mt-2">
          Analyzing {itemType} with AI to provide insights and recommendations.
        </p>
      </div>
    );
  }

  // Show summary with edit capability
  return (
    <div
      className={`bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="w-5 h-5 text-purple-600" />
          <span className="text-purple-900 font-medium">AI Analysis</span>
          {confidence && (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(confidence)}`}
            >
              {getConfidenceText(confidence)} ({confidence}%)
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {generatedAt && (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <ClockIcon className="w-3 h-3" />
              <span>{new Date(generatedAt).toLocaleDateString()}</span>
            </div>
          )}
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Edit summary"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Summary Content */}
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editedSummary}
            onChange={(e) => setEditedSummary(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={3}
            placeholder="Edit the AI summary..."
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={cancelEdit}
              className="flex items-center space-x-1 px-3 py-1 text-gray-600 hover:text-gray-800"
            >
              <XMarkIcon className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              onClick={saveSummary}
              className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <CheckIcon className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-gray-800 leading-relaxed">{summary}</p>

          {fullAnalysis && (
            <div className="mt-3">
              <button
                onClick={() => setShowFullAnalysis(!showFullAnalysis)}
                className="flex items-center space-x-1 text-purple-600 hover:text-purple-800 text-sm"
              >
                <InformationCircleIcon className="w-4 h-4" />
                <span>{showFullAnalysis ? 'Hide' : 'Show'} Detailed Analysis</span>
              </button>

              {showFullAnalysis && (
                <div className="mt-3 space-y-3 bg-white bg-opacity-50 rounded-lg p-3">
                  {fullAnalysis.rootCauses && fullAnalysis.rootCauses.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">Root Causes:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {fullAnalysis.rootCauses.map((cause, index) => (
                          <li key={index}>{cause}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {fullAnalysis.recommendations && fullAnalysis.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">Recommendations:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {fullAnalysis.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {fullAnalysis.crossIssuePatterns &&
                    fullAnalysis.crossIssuePatterns.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-1">Cross-Issue Patterns:</h4>
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                          {fullAnalysis.crossIssuePatterns.map((pattern, index) => (
                            <li key={index}>{pattern}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          <div className="mt-3 flex justify-between items-center">
            <button
              onClick={generateSummary}
              className="text-purple-600 hover:text-purple-800 text-sm flex items-center space-x-1"
              disabled={isGenerating}
            >
              <SparklesIcon className="w-4 h-4" />
              <span>Regenerate</span>
            </button>

            {version && <span className="text-xs text-gray-500">Model: {version}</span>}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center space-x-2 text-red-600">
          <ExclamationTriangleIcon className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
}
