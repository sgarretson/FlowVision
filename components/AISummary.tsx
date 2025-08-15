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
    if (conf >= 80) return 'status-high text-green-700 bg-green-100';
    if (conf >= 60) return 'status-medium text-yellow-700 bg-yellow-100';
    return 'status-low text-red-700 bg-red-100';
  };

  const getConfidenceText = (conf: number) => {
    if (conf >= 80) return 'High Confidence';
    if (conf >= 60) return 'Medium Confidence';
    return 'Low Confidence';
  };

  // If no summary exists, show generate button
  if (!summary && !isGenerating) {
    return (
      <div className={`card-tertiary p-6 border-2 border-dashed border-gray-300 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="w-5 h-5 text-primary" />
            <span className="text-h3 text-gray-900">AI Analysis Available</span>
          </div>
          <button onClick={generateSummary} className="btn-primary flex items-center space-x-2">
            <SparklesIcon className="w-4 h-4" />
            <span>Generate Summary</span>
          </button>
        </div>
        <p className="text-caption mb-3">
          Get AI-powered insights, root cause analysis, and recommendations for this {itemType}.
        </p>
        {error && (
          <div className="mt-3 flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
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
      <div className={`card-secondary p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-3">
          <div className="animate-spin">
            <SparklesIcon className="w-5 h-5 text-primary" />
          </div>
          <span className="text-h3">Generating AI Analysis...</span>
        </div>
        <p className="text-caption">
          Analyzing {itemType} with AI to provide insights and recommendations.
        </p>
        <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className="bg-primary h-full rounded-full animate-pulse w-3/4"></div>
        </div>
      </div>
    );
  }

  // Show summary with edit capability
  return (
    <div className={`card-secondary p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="w-5 h-5 text-primary" />
            <span className="text-h3">AI Analysis</span>
          </div>
          {confidence && (
            <span
              className={`status-badge px-3 py-1 text-xs font-medium ${getConfidenceColor(confidence)}`}
            >
              {getConfidenceText(confidence)} ({confidence}%)
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {version && (
            <div className="flex items-center space-x-1 text-caption">
              <span className="font-medium">Model:</span>
              <span className="text-primary font-mono text-sm">{version}</span>
            </div>
          )}
          {generatedAt && (
            <div className="flex items-center space-x-1 text-caption">
              <ClockIcon className="w-4 h-4" />
              <span>{new Date(generatedAt).toLocaleDateString()}</span>
            </div>
          )}
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-gray-400 hover:text-primary transition-colors rounded-lg hover:bg-gray-50"
              title="Edit summary"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Summary Content */}
      {isEditing ? (
        <div className="space-y-4">
          <textarea
            value={editedSummary}
            onChange={(e) => setEditedSummary(e.target.value)}
            className="textarea-field w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={4}
            placeholder="Edit the AI summary..."
          />
          <div className="flex justify-end space-x-3">
            <button onClick={cancelEdit} className="btn-secondary flex items-center space-x-2">
              <XMarkIcon className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button onClick={saveSummary} className="btn-primary flex items-center space-x-2">
              <CheckIcon className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-body leading-relaxed">{summary}</p>

          {fullAnalysis && (
            <div className="border-t pt-4">
              <button
                onClick={() => setShowFullAnalysis(!showFullAnalysis)}
                className="flex items-center space-x-2 text-primary hover:text-blue-700 text-sm font-medium transition-colors"
              >
                <InformationCircleIcon className="w-4 h-4" />
                <span>{showFullAnalysis ? 'Hide' : 'Show'} Detailed Analysis</span>
              </button>

              {showFullAnalysis && (
                <div className="mt-4 space-y-4 card-tertiary p-4">
                  {fullAnalysis.rootCauses && fullAnalysis.rootCauses.length > 0 && (
                    <div>
                      <h4 className="text-h3 mb-2 text-gray-900">Root Causes:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-2">
                        {fullAnalysis.rootCauses.map((cause, index) => (
                          <li key={index} className="leading-relaxed">
                            {cause}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {fullAnalysis.recommendations && fullAnalysis.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-h3 mb-2 text-gray-900">Recommendations:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-2">
                        {fullAnalysis.recommendations.map((rec, index) => (
                          <li key={index} className="leading-relaxed">
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {fullAnalysis.crossIssuePatterns &&
                    fullAnalysis.crossIssuePatterns.length > 0 && (
                      <div>
                        <h4 className="text-h3 mb-2 text-gray-900">Cross-Issue Patterns:</h4>
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-2">
                          {fullAnalysis.crossIssuePatterns.map((pattern, index) => (
                            <li key={index} className="leading-relaxed">
                              {pattern}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-4 flex justify-between items-center">
            <button
              onClick={generateSummary}
              className="btn-secondary text-sm flex items-center space-x-2"
              disabled={isGenerating}
            >
              <SparklesIcon className="w-4 h-4" />
              <span>Regenerate</span>
            </button>
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
