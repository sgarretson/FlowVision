'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  ChartBarIcon,
  CpuChipIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface PriorityScore {
  initiativeId: string;
  currentPriority: number;
  aiRecommendedPriority: number;
  confidenceScore: number;
  reasoningFactors: Array<{
    factor: string;
    weight: number;
    score: number;
    reasoning: string;
  }>;
  overallReasoning: string;
  suggestedActions: string[];
  comparisonNotes?: string;
}

interface InitiativeOverview {
  id: string;
  title: string;
  priorityScore: number;
  status: string;
  roi: number;
  difficulty: number;
}

interface PrioritizationContext {
  organizationGoals: string[];
  currentQuarter: string;
  availableResources: {
    budget: number;
    teamCapacity: number;
    timeline: number;
  };
  strategicThemes: string[];
  riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
}

export default function InitiativePrioritizationDashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'recommendations' | 'context'>(
    'overview'
  );

  const [initiatives, setInitiatives] = useState<InitiativeOverview[]>([]);
  const [priorityScores, setPriorityScores] = useState<PriorityScore[]>([]);
  const [selectedInitiatives, setSelectedInitiatives] = useState<string[]>([]);
  const [applyRecommendations, setApplyRecommendations] = useState(false);

  const [context, setContext] = useState<PrioritizationContext>({
    organizationGoals: [
      'Improve operational efficiency',
      'Enhance client satisfaction',
      'Reduce project risks',
    ],
    currentQuarter: 'Q1 2025',
    availableResources: {
      budget: 100000,
      teamCapacity: 80,
      timeline: 90,
    },
    strategicThemes: ['Digital transformation', 'Process optimization', 'Quality improvement'],
    riskTolerance: 'MEDIUM',
  });

  useEffect(() => {
    if (session) {
      fetchInitiativesOverview();
    }
  }, [session]);

  const fetchInitiativesOverview = async () => {
    try {
      const response = await fetch('/api/ai/initiatives/prioritization');
      if (response.ok) {
        const data = await response.json();
        setInitiatives(data.overview?.initiatives || []);
      }
    } catch (error) {
      console.error('Error fetching initiatives overview:', error);
    }
  };

  const runPrioritizationAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/initiatives/prioritization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initiativeIds: selectedInitiatives.length > 0 ? selectedInitiatives : undefined,
          applyRecommendations,
          context,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPriorityScores(data.prioritization.recommendations || []);
        setActiveTab('recommendations');

        if (applyRecommendations) {
          // Refresh the overview to show updated priorities
          fetchInitiativesOverview();
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to run prioritization analysis');
      }
    } catch (error) {
      setError('Network error running prioritization analysis');
    } finally {
      setLoading(false);
    }
  };

  const toggleInitiativeSelection = (initiativeId: string) => {
    setSelectedInitiatives((prev) =>
      prev.includes(initiativeId)
        ? prev.filter((id) => id !== initiativeId)
        : [...prev, initiativeId]
    );
  };

  const selectAllInitiatives = () => {
    setSelectedInitiatives(initiatives.map((init) => init.id));
  };

  const clearSelection = () => {
    setSelectedInitiatives([]);
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 80) return 'text-green-600 bg-green-50';
    if (priority >= 60) return 'text-yellow-600 bg-yellow-50';
    if (priority >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'planning':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityChange = (current: number, recommended: number) => {
    const change = recommended - current;
    if (Math.abs(change) < 5) return { icon: null, color: 'text-gray-500', text: 'No change' };
    if (change > 0)
      return {
        icon: <ArrowUpIcon className="h-4 w-4" />,
        color: 'text-green-600',
        text: `+${change}`,
      };
    return {
      icon: <ArrowDownIcon className="h-4 w-4" />,
      color: 'text-red-600',
      text: `${change}`,
    };
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!session) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Authentication Required</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please sign in to access Initiative Prioritization Dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ChartBarIcon className="h-8 w-8 text-indigo-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Initiative Prioritization</h2>
              <p className="text-sm text-gray-500">AI-powered initiative priority optimization</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {loading && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                <span>Analyzing Priorities...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {selectedInitiatives.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">
                  {selectedInitiatives.length} initiative
                  {selectedInitiatives.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={clearSelection}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Clear
                </button>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="apply-recommendations"
                checked={applyRecommendations}
                onChange={(e) => setApplyRecommendations(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="apply-recommendations" className="text-sm text-gray-700">
                Apply recommendations automatically
              </label>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={selectAllInitiatives}
              className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Select All
            </button>
            <button
              onClick={runPrioritizationAnalysis}
              disabled={loading}
              className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <CpuChipIcon className="h-4 w-4 mr-2" />
              Analyze Priorities
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          {[
            { id: 'overview', name: 'Current Initiatives', count: initiatives.length },
            { id: 'recommendations', name: 'AI Recommendations', count: priorityScores.length },
            { id: 'context', name: 'Organization Context', count: 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              {tab.name}
              {tab.count > 0 && (
                <span
                  className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div>
            {initiatives.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Initiatives Found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create some initiatives to see prioritization analysis.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {initiatives.map((initiative) => (
                  <div
                    key={initiative.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedInitiatives.includes(initiative.id)
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleInitiativeSelection(initiative.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedInitiatives.includes(initiative.id)}
                          onChange={() => {}} // Handled by div onClick
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">{initiative.title}</h4>
                          <div className="flex items-center space-x-4 mt-1">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(initiative.status)}`}
                            >
                              {initiative.status}
                            </span>
                            <span className="text-sm text-gray-500">ROI: {initiative.roi}%</span>
                            <span className="text-sm text-gray-500">
                              Difficulty: {initiative.difficulty}/100
                            </span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`text-center p-2 rounded-lg ${getPriorityColor(initiative.priorityScore || 0)}`}
                      >
                        <div className="text-lg font-bold">{initiative.priorityScore || 0}</div>
                        <div className="text-xs">Priority</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div>
            {priorityScores.length === 0 ? (
              <div className="text-center py-12">
                <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Recommendations Yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Run the AI prioritization analysis to see intelligent priority recommendations.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {priorityScores.map((score, index) => {
                  const initiative = initiatives.find((init) => init.id === score.initiativeId);
                  const change = getPriorityChange(
                    score.currentPriority,
                    score.aiRecommendedPriority
                  );

                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {initiative?.title || 'Unknown Initiative'}
                          </h4>
                          {score.comparisonNotes && (
                            <p className="text-sm text-gray-500 mt-1">{score.comparisonNotes}</p>
                          )}
                        </div>

                        <div className={`text-right ${getConfidenceColor(score.confidenceScore)}`}>
                          <div className="text-lg font-semibold">{score.confidenceScore}%</div>
                          <div className="text-xs">Confidence</div>
                        </div>
                      </div>

                      {/* Priority Comparison */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div
                          className={`text-center p-3 rounded-lg ${getPriorityColor(score.currentPriority)}`}
                        >
                          <div className="text-xl font-bold">{score.currentPriority}</div>
                          <div className="text-sm">Current</div>
                        </div>
                        <div className="flex items-center justify-center">
                          <div className={`flex items-center space-x-1 ${change.color}`}>
                            {change.icon}
                            <span className="text-sm font-medium">{change.text}</span>
                          </div>
                        </div>
                        <div
                          className={`text-center p-3 rounded-lg ${getPriorityColor(score.aiRecommendedPriority)}`}
                        >
                          <div className="text-xl font-bold">{score.aiRecommendedPriority}</div>
                          <div className="text-sm">Recommended</div>
                        </div>
                      </div>

                      {/* Reasoning Factors */}
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Key Factors</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {score.reasoningFactors.slice(0, 4).map((factor, factorIndex) => (
                            <div key={factorIndex} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                  {factor.factor}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {factor.score}/10 (Weight: {factor.weight})
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">{factor.reasoning}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Overall Reasoning */}
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">AI Analysis</h5>
                        <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                          {score.overallReasoning}
                        </p>
                      </div>

                      {/* Suggested Actions */}
                      {score.suggestedActions.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            Suggested Actions
                          </h5>
                          <div className="space-y-1">
                            {score.suggestedActions.map((action, actionIndex) => (
                              <div key={actionIndex} className="flex items-start space-x-2 text-sm">
                                <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700">{action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'context' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Organization Context</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Organization Goals */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Goals
                  </label>
                  <div className="space-y-2">
                    {context.organizationGoals.map((goal, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={goal}
                          onChange={(e) => {
                            const newGoals = [...context.organizationGoals];
                            newGoals[index] = e.target.value;
                            setContext({ ...context, organizationGoals: newGoals });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strategic Themes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Strategic Themes
                  </label>
                  <div className="space-y-2">
                    {context.strategicThemes.map((theme, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={theme}
                          onChange={(e) => {
                            const newThemes = [...context.strategicThemes];
                            newThemes[index] = e.target.value;
                            setContext({ ...context, strategicThemes: newThemes });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-lg font-medium text-gray-900 mb-4">Resource Constraints</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Budget ($)
                  </label>
                  <input
                    type="number"
                    value={context.availableResources.budget}
                    onChange={(e) =>
                      setContext({
                        ...context,
                        availableResources: {
                          ...context.availableResources,
                          budget: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Capacity (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={context.availableResources.teamCapacity}
                    onChange={(e) =>
                      setContext({
                        ...context,
                        availableResources: {
                          ...context.availableResources,
                          teamCapacity: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeline (days)
                  </label>
                  <input
                    type="number"
                    value={context.availableResources.timeline}
                    onChange={(e) =>
                      setContext({
                        ...context,
                        availableResources: {
                          ...context.availableResources,
                          timeline: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Risk Tolerance</label>
              <select
                value={context.riskTolerance}
                onChange={(e) => setContext({ ...context, riskTolerance: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="LOW">Low - Conservative approach</option>
                <option value="MEDIUM">Medium - Balanced approach</option>
                <option value="HIGH">High - Aggressive approach</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Quarter
              </label>
              <input
                type="text"
                value={context.currentQuarter}
                onChange={(e) => setContext({ ...context, currentQuarter: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="e.g., Q1 2025"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
