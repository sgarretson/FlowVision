import React, { useState } from 'react';
import {
  LightBulbIcon,
  SparklesIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface SmartSuggestion {
  id: string;
  type: 'title' | 'problem' | 'goal';
  current: string;
  suggested: string;
  reasoning: string;
  confidence: number;
  improvement: string;
}

interface InitiativeSmartSuggestionsProps {
  title: string;
  problem: string;
  goal: string;
  validationResult?: any;
  onApplySuggestion: (type: 'title' | 'problem' | 'goal', value: string) => void;
  className?: string;
}

export default function InitiativeSmartSuggestions({
  title,
  problem,
  goal,
  validationResult,
  onApplySuggestion,
  className = '',
}: InitiativeSmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  const generateSmartSuggestions = async () => {
    if (!title.trim() || !problem.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/ai/suggest-improvements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          problem: problem.trim(),
          goal: goal.trim(),
          validationContext: validationResult,
        }),
      });

      if (response.ok) {
        const suggestionData = await response.json();
        setSuggestions(suggestionData.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to generate smart suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (suggestion: SmartSuggestion) => {
    onApplySuggestion(suggestion.type, suggestion.suggested);
    setAppliedSuggestions((prev) => new Set([...prev, suggestion.id]));
  };

  const dismissSuggestion = (suggestionId: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
  };

  // Auto-generate suggestions when validation score is low
  React.useEffect(() => {
    if (validationResult && validationResult.score < 70 && (title.trim() || problem.trim())) {
      generateSmartSuggestions();
    }
  }, [validationResult?.score, title, problem, goal]);

  if (!suggestions.length && !loading) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {loading && (
        <div className="flex items-center gap-2 text-purple-600 text-sm">
          <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          Generating smart improvement suggestions...
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-purple-800 flex items-center gap-2">
              <SparklesIcon className="w-5 h-5" />
              Smart Enhancement Suggestions
            </h4>
            <span className="text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
              {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                className="bg-white rounded-lg p-4 border border-purple-100 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <LightBulbIcon className="w-5 h-5 text-purple-600 mt-0.5" />
                  </div>

                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-purple-800 capitalize">
                          {suggestion.type} Enhancement
                        </span>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {suggestion.confidence}% confidence
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => applySuggestion(suggestion)}
                          disabled={appliedSuggestions.has(suggestion.id)}
                          className={`p-1.5 rounded-md transition-colors ${
                            appliedSuggestions.has(suggestion.id)
                              ? 'bg-green-100 text-green-600 cursor-not-allowed'
                              : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                          }`}
                          title={
                            appliedSuggestions.has(suggestion.id) ? 'Applied' : 'Apply suggestion'
                          }
                        >
                          {appliedSuggestions.has(suggestion.id) ? (
                            <CheckIcon className="w-4 h-4" />
                          ) : (
                            <ClipboardDocumentIcon className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => dismissSuggestion(suggestion.id)}
                          className="p-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                          title="Dismiss suggestion"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Current vs Suggested */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700">Current:</h5>
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                          <p className="text-sm text-gray-800 italic">"{suggestion.current}"</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700">Suggested:</h5>
                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                          <p className="text-sm text-gray-800 font-medium">
                            "{suggestion.suggested}"
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Reasoning and Improvement */}
                    <div className="space-y-2">
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <h5 className="text-sm font-medium text-blue-800 mb-1">Why this helps:</h5>
                        <p className="text-sm text-blue-700">{suggestion.reasoning}</p>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <h5 className="text-sm font-medium text-yellow-800 mb-1">
                          Expected improvement:
                        </h5>
                        <p className="text-sm text-yellow-700">{suggestion.improvement}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="mt-4 pt-4 border-t border-purple-200">
            <div className="flex items-center justify-between">
              <button
                onClick={generateSmartSuggestions}
                disabled={loading}
                className="btn-secondary text-sm"
              >
                {loading ? 'Generating...' : '🔄 Refresh Suggestions'}
              </button>
              <button
                onClick={() => setSuggestions([])}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Dismiss All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
