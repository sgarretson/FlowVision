'use client';

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  CpuChipIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface CategoryAIAnalysis {
  categorySummary: string;
  crossIssuePatterns: string[];
  impactAnalysis: {
    businessImpact: 'HIGH' | 'MEDIUM' | 'LOW';
    affectedDepartments: string[];
    estimatedProductivityLoss: string;
    totalIssueCount: number;
    criticalIssueCount: number;
  };
  strategicRecommendations: string[];
  priorityIssues: string[];
  rootCauseAnalysis: string[];
  implementationRoadmap: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  confidence: number;
  generatedAt: string;
}

interface CategoryAISummaryProps {
  categoryName: string;
  onAnalysisGenerated?: (analysis: CategoryAIAnalysis) => void;
}

export default function CategoryAISummary({
  categoryName,
  onAnalysisGenerated,
}: CategoryAISummaryProps) {
  const [analysis, setAnalysis] = useState<CategoryAIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<
    'overview' | 'patterns' | 'recommendations' | 'roadmap'
  >('overview');

  async function generateAnalysis() {
    if (!categoryName) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/categories/${encodeURIComponent(categoryName)}/ai-analysis`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate analysis');
      }

      const analysisData = await response.json();
      setAnalysis(analysisData);

      // Persist analysis to localStorage for future visits
      const storageKey = `ai-analysis-${categoryName}`;
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          data: analysisData,
          timestamp: Date.now(),
          categoryName,
        })
      );

      onAnalysisGenerated?.(analysisData);
    } catch (err) {
      console.error('Analysis generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate analysis');
    } finally {
      setLoading(false);
    }
  }

  async function createInitiativeFromAnalysis() {
    if (!analysis) return;

    try {
      setLoading(true);

      // Create initiative from AI analysis
      const initiativeData = {
        title: `${categoryName} Strategic Initiative`,
        problem: analysis.categorySummary,
        goal: analysis.strategicRecommendations[0] || `Resolve ${categoryName} challenges`,
        kpis: [
          `Improve ${categoryName} satisfaction by 25%`,
          `Reduce related issues by 50%`,
          `Achieve sustained improvement metrics`,
        ],
      };

      const response = await fetch('/api/initiatives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(initiativeData),
      });

      if (response.ok) {
        const initiative = await response.json();
        // Redirect to the new initiative
        window.location.href = `/initiatives/${initiative.id}`;
      } else {
        throw new Error('Failed to create initiative');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create initiative');
      console.error('Initiative creation error:', err);
    } finally {
      setLoading(false);
    }
  }

  // Load cached analysis on component mount
  React.useEffect(() => {
    if (!categoryName) return;

    const storageKey = `ai-analysis-${categoryName}`;
    const cached = localStorage.getItem(storageKey);

    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        // Use cached analysis if less than 7 days old
        const daysSinceGenerated = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);

        if (daysSinceGenerated < 7) {
          setAnalysis(data);
        }
      } catch (err) {
        console.warn('Failed to load cached analysis:', err);
      }
    }
  }, [categoryName]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'HIGH':
        return 'text-red-700 bg-red-100 border-red-200';
      case 'MEDIUM':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'LOW':
        return 'text-green-700 bg-green-100 border-green-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const sections = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'patterns', label: 'Patterns', icon: CpuChipIcon },
    { id: 'recommendations', label: 'Strategy', icon: LightBulbIcon },
    { id: 'roadmap', label: 'Roadmap', icon: ClockIcon },
  ] as const;

  if (!analysis && !loading && !error) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <CpuChipIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900">AI Strategic Analysis</h3>
              <p className="text-sm text-blue-700">
                Generate comprehensive insights for{' '}
                <span className="font-medium">{categoryName}</span> category
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={generateAnalysis}
              className="btn-primary flex items-center gap-2 hover:scale-105 transition-transform duration-200"
            >
              <CpuChipIcon className="w-4 h-4" />
              Generate Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div>
            <div className="text-lg font-semibold text-blue-900">Generating AI Analysis...</div>
            <div className="text-sm text-blue-700">
              Analyzing {categoryName} patterns, impacts, and strategic recommendations
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            <div>
              <div className="text-lg font-semibold text-red-900">Analysis Failed</div>
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
          <button
            onClick={generateAnalysis}
            className="btn-secondary text-sm hover:scale-105 transition-transform duration-200"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <CpuChipIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-blue-900">AI Strategic Analysis</h3>
            <div className="flex items-center gap-4 text-sm text-blue-700">
              <span>
                Category: <span className="font-medium">{categoryName}</span>
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium border ${getImpactColor(analysis.impactAnalysis.businessImpact)}`}
              >
                {analysis.impactAnalysis.businessImpact} Impact
              </span>
              <span className="flex items-center gap-1">
                <InformationCircleIcon className="w-4 h-4" />
                {analysis.confidence}% Confidence
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={generateAnalysis}
            disabled={loading}
            className="btn-secondary text-sm hover:scale-105 transition-transform duration-200"
          >
            {loading ? 'Refreshing...' : 'Refresh Analysis'}
          </button>
          <button
            onClick={createInitiativeFromAnalysis}
            disabled={loading}
            className="btn-primary flex items-center gap-2 text-sm hover:scale-105 transition-transform duration-200"
          >
            <LightBulbIcon className="w-4 h-4" />
            Create Initiative
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 mb-6 bg-white/50 p-1 rounded-lg">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeSection === section.id
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-blue-600 hover:bg-white/30'
              }`}
            >
              <Icon className="w-4 h-4" />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Content Sections */}
      <div className="space-y-6">
        {activeSection === 'overview' && (
          <div className="space-y-4 animate-fade-in">
            {/* Executive Summary */}
            <div className="bg-white/60 border border-blue-200 rounded-lg p-5">
              <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <InformationCircleIcon className="w-5 h-5" />
                Executive Summary
              </h4>
              <p className="text-blue-800 leading-relaxed">{analysis.categorySummary}</p>
            </div>

            {/* Impact Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/60 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">
                  {analysis.impactAnalysis.totalIssueCount}
                </div>
                <div className="text-sm text-blue-600">Total Issues</div>
              </div>
              <div className="bg-white/60 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-700">
                  {analysis.impactAnalysis.criticalIssueCount}
                </div>
                <div className="text-sm text-red-600">Critical Issues</div>
              </div>
              <div className="bg-white/60 border border-purple-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-700">
                  {analysis.impactAnalysis.affectedDepartments.length}
                </div>
                <div className="text-sm text-purple-600">Departments</div>
              </div>
              <div className="bg-white/60 border border-orange-200 rounded-lg p-4 text-center">
                <div className="text-lg font-bold text-orange-700">
                  {analysis.impactAnalysis.estimatedProductivityLoss}
                </div>
                <div className="text-sm text-orange-600">Est. Impact</div>
              </div>
            </div>

            {/* Root Causes */}
            <div className="bg-white/60 border border-blue-200 rounded-lg p-5">
              <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5" />
                Root Cause Analysis
              </h4>
              <div className="space-y-2">
                {analysis.rootCauseAnalysis.map((cause, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-medium mt-0.5 flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-blue-800 text-sm">{cause}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'patterns' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white/60 border border-blue-200 rounded-lg p-5">
              <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <CpuChipIcon className="w-5 h-5" />
                Cross-Issue Patterns
              </h4>
              <div className="space-y-3">
                {analysis.crossIssuePatterns.map((pattern, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-blue-800">{pattern}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/60 border border-blue-200 rounded-lg p-5">
              <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5" />
                Priority Issues
              </h4>
              <div className="space-y-2">
                {analysis.priorityIssues.map((issue, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="w-5 h-5 bg-red-200 rounded-full flex items-center justify-center text-red-700 text-xs font-bold flex-shrink-0">
                      !
                    </div>
                    <p className="text-red-800 text-sm">{issue}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'recommendations' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white/60 border border-blue-200 rounded-lg p-5">
              <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <LightBulbIcon className="w-5 h-5" />
                Strategic Recommendations
              </h4>
              <div className="space-y-3">
                {analysis.strategicRecommendations.map((recommendation, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center text-green-700 text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-green-800">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'roadmap' && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid gap-4">
              {/* Immediate Actions */}
              <div className="bg-white/60 border border-red-200 rounded-lg p-5">
                <h4 className="text-lg font-semibold text-red-900 mb-3 flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                  Immediate Actions (Next 30 Days)
                </h4>
                <div className="space-y-2">
                  {analysis.implementationRoadmap.immediate.map((action, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xs font-medium mt-0.5 flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-red-800 text-sm">{action}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Short-term Actions */}
              <div className="bg-white/60 border border-yellow-200 rounded-lg p-5">
                <h4 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                  <ClockIcon className="w-5 h-5" />
                  Short-term Actions (Next 90 Days)
                </h4>
                <div className="space-y-2">
                  {analysis.implementationRoadmap.shortTerm.map((action, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 text-xs font-medium mt-0.5 flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-yellow-800 text-sm">{action}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Long-term Strategic Initiatives */}
              <div className="bg-white/60 border border-green-200 rounded-lg p-5">
                <h4 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <ArrowTrendingUpIcon className="w-5 h-5" />
                  Long-term Strategy (6+ Months)
                </h4>
                <div className="space-y-2">
                  {analysis.implementationRoadmap.longTerm.map((action, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs font-medium mt-0.5 flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-green-800 text-sm">{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-blue-200 flex items-center justify-between text-xs text-blue-600">
        <span>Generated: {new Date(analysis.generatedAt).toLocaleString()}</span>
        <span className="flex items-center gap-1">
          <CheckCircleIcon className="w-4 h-4" />
          AI Confidence: {analysis.confidence}%
        </span>
      </div>
    </div>
  );
}
