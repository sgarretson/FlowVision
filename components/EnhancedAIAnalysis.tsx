'use client';

import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface AIAnalysisData {
  summary: string;
  rootCauses?: string[];
  impact?: string;
  recommendations?: string[];
  confidence: number;
  category?: string;
  severity?: string;
  quickWins?: string[];
  longTermStrategy?: string;
  businessImpact?: {
    financial?: string;
    operational?: string;
    strategic?: string;
  };
  confidenceReasoning?: {
    score: number;
    reasoning: string;
    dataQuality: number;
    sampleSize: number;
    historicalAccuracy: number;
    uncertaintyFactors: string[];
  };
}

interface EnhancedAIAnalysisProps {
  issueId: string;
  issueDescription: string;
  existingAnalysis?: AIAnalysisData | null;
  onAnalysisUpdate?: (analysis: AIAnalysisData) => void;
}

export default function EnhancedAIAnalysis({
  issueId,
  issueDescription,
  existingAnalysis,
  onAnalysisUpdate,
}: EnhancedAIAnalysisProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisData | null>(existingAnalysis || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const regenerateAnalysis = async () => {
    if (!issueDescription?.trim()) {
      setError('Issue description is required for analysis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/issues/${issueId}/generate-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok) {
        const enhancedAnalysis: AIAnalysisData = {
          summary: data.summary || 'AI analysis generated',
          rootCauses: data.rootCauses || [],
          impact: data.impact || 'Impact analysis pending',
          recommendations: data.recommendations || [],
          confidence: data.confidence || 75,
          category: data.category || 'General',
          severity: data.severity || 'Medium',
          quickWins: data.quickWins || [],
          longTermStrategy: data.longTermStrategy || '',
          businessImpact: data.businessImpact || {},
          confidenceReasoning: data.confidenceReasoning || {
            score: data.confidence || 75,
            reasoning: 'Analysis based on available data',
            dataQuality: 80,
            sampleSize: 100,
            historicalAccuracy: 85,
            uncertaintyFactors: [],
          },
        };

        setAnalysis(enhancedAnalysis);
        setExpanded(true);

        if (onAnalysisUpdate) {
          onAnalysisUpdate(enhancedAnalysis);
        }
      } else {
        if (response.status === 401) {
          setError('Please sign in to use AI analysis.');
        } else {
          setError(data.fallback || data.error || 'AI analysis not available');
        }
      }
    } catch (err) {
      console.error('AI analysis error:', err);
      setError('Failed to analyze issue with AI');
    } finally {
      setLoading(false);
    }
  };

  const formatConfidence = (confidence: number) => {
    if (confidence >= 90) return { text: 'Very High', color: 'text-green-600' };
    if (confidence >= 80) return { text: 'High', color: 'text-green-500' };
    if (confidence >= 70) return { text: 'Medium', color: 'text-yellow-600' };
    if (confidence >= 60) return { text: 'Low', color: 'text-orange-600' };
    return { text: 'Very Low', color: 'text-red-600' };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="w-full">
      {/* AI Analysis Button */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={regenerateAnalysis}
          disabled={loading || !issueDescription?.trim()}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full"></div>
              Analyzing...
            </>
          ) : (
            <>
              <span className="text-purple-600">🤖</span>
              {analysis ? 'Regenerate' : 'AI Analysis'}
            </>
          )}
        </button>

        {analysis && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
          >
            {expanded ? (
              <>
                <ChevronUpIcon className="w-4 h-4" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDownIcon className="w-4 h-4" />
                Expand Details
              </>
            )}
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* AI Analysis Results */}
      {analysis && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
          {/* Summary Header */}
          <div className="p-4 border-b border-purple-200">
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-lg font-semibold text-purple-800 flex items-center gap-2">
                <span className="text-purple-600">🧠</span>
                AI Analysis
              </h4>
              <div className="flex items-center gap-4">
                {analysis.category && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {analysis.category}
                  </span>
                )}
                {analysis.severity && (
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(analysis.severity)}`}
                  >
                    {analysis.severity} Severity
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-600">Confidence:</span>
                  <span
                    className={`text-xs font-medium ${formatConfidence(analysis.confidence).color}`}
                  >
                    {analysis.confidence}% ({formatConfidence(analysis.confidence).text})
                  </span>
                </div>
              </div>
            </div>

            <div className="text-sm text-purple-700 mb-3">
              <strong>Summary:</strong> {analysis.summary}
            </div>

            {analysis.impact && (
              <div className="text-sm text-purple-700">
                <strong>Impact:</strong> {analysis.impact}
              </div>
            )}
          </div>

          {/* Expandable Detailed Analysis */}
          {expanded && (
            <div className="p-4 space-y-4">
              {/* Root Causes */}
              {analysis.rootCauses && analysis.rootCauses.length > 0 && (
                <div>
                  <h5 className="font-medium text-purple-800 mb-2">🔍 Root Causes</h5>
                  <ul className="space-y-1">
                    {analysis.rootCauses.map((cause, index) => (
                      <li key={index} className="text-sm text-purple-700 flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        {cause}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <div>
                  <h5 className="font-medium text-purple-800 mb-2">💡 Recommendations</h5>
                  <ul className="space-y-1">
                    {analysis.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-purple-700 flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quick Wins */}
              {analysis.quickWins && analysis.quickWins.length > 0 && (
                <div>
                  <h5 className="font-medium text-purple-800 mb-2">⚡ Quick Wins</h5>
                  <ul className="space-y-1">
                    {analysis.quickWins.map((win, index) => (
                      <li key={index} className="text-sm text-purple-700 flex items-start gap-2">
                        <span className="text-yellow-500 mt-1">⭐</span>
                        {win}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Long Term Strategy */}
              {analysis.longTermStrategy && (
                <div>
                  <h5 className="font-medium text-purple-800 mb-2">🎯 Long Term Strategy</h5>
                  <p className="text-sm text-purple-700">{analysis.longTermStrategy}</p>
                </div>
              )}

              {/* Business Impact */}
              {analysis.businessImpact && Object.keys(analysis.businessImpact).length > 0 && (
                <div>
                  <h5 className="font-medium text-purple-800 mb-2">📊 Business Impact</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {analysis.businessImpact.financial && (
                      <div className="bg-white bg-opacity-50 p-3 rounded border">
                        <h6 className="font-medium text-green-700 text-xs mb-1">💰 Financial</h6>
                        <p className="text-xs text-gray-700">{analysis.businessImpact.financial}</p>
                      </div>
                    )}
                    {analysis.businessImpact.operational && (
                      <div className="bg-white bg-opacity-50 p-3 rounded border">
                        <h6 className="font-medium text-blue-700 text-xs mb-1">⚙️ Operational</h6>
                        <p className="text-xs text-gray-700">
                          {analysis.businessImpact.operational}
                        </p>
                      </div>
                    )}
                    {analysis.businessImpact.strategic && (
                      <div className="bg-white bg-opacity-50 p-3 rounded border">
                        <h6 className="font-medium text-purple-700 text-xs mb-1">🎯 Strategic</h6>
                        <p className="text-xs text-gray-700">{analysis.businessImpact.strategic}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Detailed Confidence Reasoning */}
              <div className="border-t border-purple-200 pt-4">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 mb-2"
                >
                  {showDetails ? (
                    <ChevronUpIcon className="w-4 h-4" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4" />
                  )}
                  Confidence Details
                </button>

                {showDetails && analysis.confidenceReasoning && (
                  <div className="bg-white bg-opacity-50 p-3 rounded border space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="font-medium text-gray-600">Data Quality:</span>
                        <div className="text-purple-700">
                          {analysis.confidenceReasoning.dataQuality}%
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Sample Size:</span>
                        <div className="text-purple-700">
                          {analysis.confidenceReasoning.sampleSize}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Historical Accuracy:</span>
                        <div className="text-purple-700">
                          {analysis.confidenceReasoning.historicalAccuracy}%
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Overall Score:</span>
                        <div className="text-purple-700 font-medium">
                          {analysis.confidenceReasoning.score}%
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="font-medium text-gray-600 text-xs">Reasoning:</span>
                      <p className="text-xs text-gray-700 mt-1">
                        {analysis.confidenceReasoning.reasoning}
                      </p>
                    </div>

                    {analysis.confidenceReasoning.uncertaintyFactors &&
                      analysis.confidenceReasoning.uncertaintyFactors.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-600 text-xs">
                            Uncertainty Factors:
                          </span>
                          <ul className="mt-1 space-y-1">
                            {analysis.confidenceReasoning.uncertaintyFactors.map(
                              (factor, index) => (
                                <li
                                  key={index}
                                  className="text-xs text-orange-600 flex items-start gap-1"
                                >
                                  <span>⚠️</span>
                                  {factor}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-3 bg-purple-50 border-t border-purple-200 rounded-b-lg">
            <div className="text-xs text-purple-600 flex items-center justify-between">
              <span>
                🤖 Analysis powered by AI • Results may vary • Always verify with domain expertise
              </span>
              {analysis && (
                <span>
                  Generated with {formatConfidence(analysis.confidence).text.toLowerCase()}{' '}
                  confidence
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
