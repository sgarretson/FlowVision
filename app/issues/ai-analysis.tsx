'use client';

import React, { useState } from 'react';

interface AIAnalysisProps {
  issueDescription: string;
  onInsights?: (insights: string) => void;
}

export default function AIAnalysis({ issueDescription, onInsights }: AIAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  async function analyzeIssue() {
    if (!issueDescription.trim()) {
      setError('Issue description is required for analysis');
      return;
    }

    setLoading(true);
    setError(null);
    setInsights(null);

    try {
      const response = await fetch('/api/ai/analyze-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: issueDescription }),
      });

      const data = await response.json();

      if (response.ok && data.insights) {
        setInsights(data.insights);
        setShowPanel(true);
        if (onInsights) {
          onInsights(data.insights);
        }
      } else {
        if (response.status === 401) {
          setError('Please sign in to use AI analysis.');
        } else {
          setError(data.fallback || data.error || 'AI analysis not available');
        }
      }
    } catch (err) {
      setError('Failed to analyze issue with AI');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      {/* AI Analysis Button */}
      <button
        onClick={analyzeIssue}
        disabled={loading || !issueDescription.trim()}
        className="btn-secondary text-sm w-full sm:w-auto"
      >
        {loading ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full mr-2"></div>
            Analyzing...
          </>
        ) : (
          <>🤖 AI Analysis</>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div
          className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md"
          role="alert"
          aria-live="polite"
        >
          <div className="text-sm text-yellow-800">{error}</div>
        </div>
      )}

      {/* AI Insights Panel */}
      {showPanel && insights && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-h4 text-blue-800">AI Analysis</h4>
            <button
              onClick={() => setShowPanel(false)}
              className="text-blue-600 hover:text-blue-800 text-lg"
            >
              ✕
            </button>
          </div>
          <div className="text-sm text-blue-700 whitespace-pre-wrap">{insights}</div>
          <div className="mt-3 text-xs text-blue-600">
            Analysis powered by AI • Results may vary • Always verify with domain expertise
          </div>
        </div>
      )}
    </div>
  );
}
