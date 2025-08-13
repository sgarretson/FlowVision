'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  SparklesIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  PlayIcon,
  PauseIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface SolutionRecommendation {
  title: string;
  description: string;
  type: 'TECHNOLOGY' | 'PROCESS' | 'TRAINING' | 'POLICY';
  priority: number;
  estimatedCost?: number;
  estimatedHours?: number;
  confidence: number;
  reasoning: string;
  dependencies?: string[];
  tags: string[];
}

interface TaskRecommendation {
  title: string;
  description: string;
  estimatedHours: number;
  priority: number;
  dependencies: string[];
  tags: string[];
  confidence: number;
  reasoning: string;
}

interface AnalysisResults {
  effectivenessScore: number;
  insights: string[];
  recommendations: string[];
  confidence: number;
}

export default function AISolutionsDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'recommendations' | 'tasks' | 'analysis'>(
    'recommendations'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for different AI features
  const [recommendations, setRecommendations] = useState<SolutionRecommendation[]>([]);
  const [tasks, setTasks] = useState<TaskRecommendation[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResults | null>(null);
  const [selectedInitiative, setSelectedInitiative] = useState<string>('');
  const [selectedSolution, setSelectedSolution] = useState<string>('');

  // Available initiatives and solutions for selection
  const [initiatives, setInitiatives] = useState<Array<{ id: string; title: string }>>([]);
  const [solutions, setSolutions] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    fetchInitiatives();
    fetchSolutions();
  }, []);

  const fetchInitiatives = async () => {
    try {
      const response = await fetch('/api/initiatives');
      if (response.ok) {
        const data = await response.json();
        setInitiatives(data.initiatives || []);
      }
    } catch (error) {
      console.error('Error fetching initiatives:', error);
    }
  };

  const fetchSolutions = async () => {
    try {
      const response = await fetch('/api/initiatives?include=solutions');
      if (response.ok) {
        const data = await response.json();
        const allSolutions =
          data.initiatives?.flatMap(
            (init: any) =>
              init.solutions?.map((sol: any) => ({
                id: sol.id,
                title: `${init.title}: ${sol.title}`,
              })) || []
          ) || [];
        setSolutions(allSolutions);
      }
    } catch (error) {
      console.error('Error fetching solutions:', error);
    }
  };

  const generateRecommendations = async () => {
    if (!selectedInitiative) {
      setError('Please select an initiative first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/solutions/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initiativeId: selectedInitiative,
          maxRecommendations: 5,
          includeSystemAnalytics: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
        setActiveTab('recommendations');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate recommendations');
      }
    } catch (error) {
      setError('Network error generating recommendations');
    } finally {
      setLoading(false);
    }
  };

  const generateTasks = async () => {
    if (!selectedSolution) {
      setError('Please select a solution first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ai/solutions/${selectedSolution}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxTasks: 8,
          autoCreate: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data.recommendations || []);
        setActiveTab('tasks');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate tasks');
      }
    } catch (error) {
      setError('Network error generating tasks');
    } finally {
      setLoading(false);
    }
  };

  const analyzeSolution = async () => {
    if (!selectedSolution) {
      setError('Please select a solution first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ai/solutions/${selectedSolution}/analysis`);

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis || null);
        setActiveTab('analysis');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to analyze solution');
      }
    } catch (error) {
      setError('Network error analyzing solution');
    } finally {
      setLoading(false);
    }
  };

  const getSolutionTypeIcon = (type: string) => {
    switch (type) {
      case 'TECHNOLOGY':
        return <CogIcon className="h-5 w-5" />;
      case 'PROCESS':
        return <ArrowTrendingUpIcon className="h-5 w-5" />;
      case 'TRAINING':
        return <DocumentTextIcon className="h-5 w-5" />;
      case 'POLICY':
        return <CheckCircleIcon className="h-5 w-5" />;
      default:
        return <SparklesIcon className="h-5 w-5" />;
    }
  };

  const getSolutionTypeColor = (type: string) => {
    switch (type) {
      case 'TECHNOLOGY':
        return 'bg-blue-100 text-blue-800';
      case 'PROCESS':
        return 'bg-green-100 text-green-800';
      case 'TRAINING':
        return 'bg-yellow-100 text-yellow-800';
      case 'POLICY':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
            Please sign in to access AI Solutions Dashboard.
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
            <SparklesIcon className="h-8 w-8 text-indigo-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI Solutions Dashboard</h2>
              <p className="text-sm text-gray-500">
                Generate recommendations, tasks, and analyze solutions
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {loading && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                <span>AI Processing...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Initiative Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Initiative
            </label>
            <select
              value={selectedInitiative}
              onChange={(e) => setSelectedInitiative(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Choose an initiative...</option>
              {initiatives.map((init) => (
                <option key={init.id} value={init.id}>
                  {init.title}
                </option>
              ))}
            </select>
          </div>

          {/* Solution Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Solution</label>
            <select
              value={selectedSolution}
              onChange={(e) => setSelectedSolution(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Choose a solution...</option>
              {solutions.map((sol) => (
                <option key={sol.id} value={sol.id}>
                  {sol.title}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2">
            <button
              onClick={generateRecommendations}
              disabled={!selectedInitiative || loading}
              className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <SparklesIcon className="h-4 w-4 mr-2" />
              Generate Solutions
            </button>
            <div className="flex space-x-2">
              <button
                onClick={generateTasks}
                disabled={!selectedSolution || loading}
                className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <PlayIcon className="h-4 w-4 mr-1" />
                Tasks
              </button>
              <button
                onClick={analyzeSolution}
                disabled={!selectedSolution || loading}
                className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <ChartBarIcon className="h-4 w-4 mr-1" />
                Analyze
              </button>
            </div>
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
            { id: 'recommendations', name: 'AI Recommendations', count: recommendations.length },
            { id: 'tasks', name: 'Task Generation', count: tasks.length },
            { id: 'analysis', name: 'Solution Analysis', count: analysis ? 1 : 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
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
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            {recommendations.length === 0 ? (
              <div className="text-center py-12">
                <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Recommendations Yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select an initiative and click "Generate Solutions" to get AI-powered
                  recommendations.
                </p>
              </div>
            ) : (
              recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${getSolutionTypeColor(rec.type)}`}>
                        {getSolutionTypeIcon(rec.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900">{rec.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{rec.description}</p>

                        {/* Meta information */}
                        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                          <span>Priority: {rec.priority}/10</span>
                          {rec.estimatedCost && (
                            <span>Cost: ${rec.estimatedCost.toLocaleString()}</span>
                          )}
                          {rec.estimatedHours && <span>Effort: {rec.estimatedHours}h</span>}
                        </div>

                        {/* Tags */}
                        {rec.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {rec.tags.map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* AI Reasoning */}
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-500">
                            View AI Reasoning
                          </summary>
                          <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                            {rec.reasoning}
                          </p>
                        </details>
                      </div>
                    </div>

                    {/* Confidence Score */}
                    <div className="text-right">
                      <div
                        className={`text-lg font-semibold ${getConfidenceColor(rec.confidence)}`}
                      >
                        {rec.confidence}%
                      </div>
                      <div className="text-xs text-gray-500">Confidence</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <PlayIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Tasks Generated</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select a solution and click "Tasks" to generate AI-powered task breakdowns.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks.map((task, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>

                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Priority: {task.priority}/10</span>
                          <span>Effort: {task.estimatedHours}h</span>
                        </div>

                        {task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {task.tags.slice(0, 3).map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {tag}
                              </span>
                            ))}
                            {task.tags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{task.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div
                        className={`text-sm font-semibold ${getConfidenceColor(task.confidence)}`}
                      >
                        {task.confidence}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div>
            {!analysis ? (
              <div className="text-center py-12">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Analysis Available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select a solution and click "Analyze" to get AI-powered effectiveness analysis.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Effectiveness Score */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Effectiveness Score</h3>
                      <p className="text-sm text-gray-500">AI assessment of solution performance</p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-3xl font-bold ${getConfidenceColor(analysis.effectivenessScore)}`}
                      >
                        {analysis.effectivenessScore}%
                      </div>
                      <div className={`text-sm ${getConfidenceColor(analysis.confidence)}`}>
                        {analysis.confidence}% confidence
                      </div>
                    </div>
                  </div>
                </div>

                {/* Insights */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Key Insights</h4>
                  <div className="space-y-2">
                    {analysis.insights.map((insight, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                        <span className="text-sm text-gray-700">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">AI Recommendations</h4>
                  <div className="space-y-2">
                    {analysis.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <ArrowTrendingUpIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                        <span className="text-sm text-gray-700">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
