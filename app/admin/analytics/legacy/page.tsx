'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type AnalyticsData = {
  overview: {
    totalInitiatives: number;
    completedInitiatives: number;
    activeInitiatives: number;
    totalIssues: number;
    resolvedIssues: number;
    recentActivity: number;
    completionRate: number;
    resolutionRate: number;
    avgCompletionTime: number;
  };
  phaseDistribution: Record<string, number>;
  insights: Array<{
    type: string;
    title: string;
    value: number;
    trend: 'up' | 'down' | 'stable';
    description: string;
  }>;
  trends: {
    issuesOverTime: Array<{ date: string; votes: number }>;
    aiUsage: number;
  };
};

export default function AnalyzePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'reports'>('overview');

  useEffect(() => {
    if (!session) {
      router.push('/auth');
      return;
    }
    loadAnalytics();
  }, [session, router]);

  async function loadAnalytics() {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics/dashboard');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      } else {
        setError('Failed to load analytics data');
      }
    } catch (err) {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }

  function getTrendIcon(trend: string) {
    switch (trend) {
      case 'up':
        return (
          <svg
            className="w-4 h-4 text-success"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        );
      case 'down':
        return (
          <svg
            className="w-4 h-4 text-danger"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-4 h-4 text-warning"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        );
    }
  }

  function getTrendColor(trend: string) {
    switch (trend) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-danger';
      default:
        return 'text-warning';
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="skeleton h-10 w-80"></div>
          <div className="skeleton h-10 w-32"></div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex space-x-4 border-b border-gray-200">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-8 w-24 mb-4"></div>
          ))}
        </div>

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-secondary p-6">
              <div className="skeleton h-4 w-32 mb-2"></div>
              <div className="skeleton h-8 w-16 mb-2"></div>
              <div className="skeleton h-3 w-24"></div>
            </div>
          ))}
        </div>

        {/* Content Area Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-primary p-6">
            <div className="skeleton h-6 w-48 mb-4"></div>
            <div className="skeleton h-40 w-full"></div>
          </div>
          <div className="card-primary p-6">
            <div className="skeleton h-6 w-48 mb-4"></div>
            <div className="skeleton h-40 w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-secondary p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-danger"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-h2 text-danger mb-2">Analytics Unavailable</h2>
        <p className="text-body mb-4">{error}</p>
        <button onClick={loadAnalytics} className="btn-primary">
          Retry Loading
        </button>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1">Efficiency Intelligence</h1>
          <p className="text-body text-gray-600 mt-1">
            Transform your operational data into actionable insights
          </p>
        </div>
        <Link href="/logs" className="btn-secondary text-sm" title="View detailed audit logs">
          View Audit Logs
        </Link>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'insights', label: 'AI Insights', icon: '🤖' },
            { id: 'reports', label: 'Reports', icon: '📈' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card-secondary p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {analytics.overview.completionRate}%
              </div>
              <div className="text-caption text-gray-600">Initiative Success Rate</div>
              <div className="text-xs text-gray-500 mt-1">
                {analytics.overview.completedInitiatives} of {analytics.overview.totalInitiatives}{' '}
                completed
              </div>
            </div>

            <div className="card-secondary p-6 text-center">
              <div className="text-3xl font-bold text-success mb-2">
                {analytics.overview.resolutionRate}%
              </div>
              <div className="text-caption text-gray-600">Issue Resolution Rate</div>
              <div className="text-xs text-gray-500 mt-1">
                {analytics.overview.resolvedIssues} of {analytics.overview.totalIssues} resolved
              </div>
            </div>

            <div className="card-secondary p-6 text-center">
              <div className="text-3xl font-bold text-warning mb-2">
                {analytics.overview.avgCompletionTime}
              </div>
              <div className="text-caption text-gray-600">Avg. Completion Days</div>
              <div className="text-xs text-gray-500 mt-1">Time to complete initiatives</div>
            </div>

            <div className="card-secondary p-6 text-center">
              <div className="text-3xl font-bold text-gray-600 mb-2">
                {analytics.overview.recentActivity}
              </div>
              <div className="text-caption text-gray-600">Weekly Activity</div>
              <div className="text-xs text-gray-500 mt-1">Team actions last 7 days</div>
            </div>
          </div>

          {/* Charts and Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Phase Distribution */}
            <div className="card-primary p-6">
              <h3 className="text-h3 mb-4 flex items-center">
                <span className="mr-2">🔄</span>
                Initiative Flow Distribution
              </h3>
              <div className="space-y-3">
                {Object.entries(analytics.phaseDistribution).map(([phase, count]) => {
                  const total = Object.values(analytics.phaseDistribution).reduce(
                    (a, b) => a + b,
                    0
                  );
                  const percentage = total > 0 ? (count / total) * 100 : 0;

                  return (
                    <div key={phase} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-primary rounded-full mr-3"></div>
                        <span className="text-sm font-medium capitalize">
                          {phase.toLowerCase().replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card-primary p-6">
              <h3 className="text-h3 mb-4 flex items-center">
                <span className="mr-2">⚡</span>
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  href="/issues"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-red-200 transition-colors">
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-sm">Identify New Issues</div>
                    <div className="text-xs text-gray-500">
                      Discover operational friction points
                    </div>
                  </div>
                </Link>

                <Link
                  href="/initiatives"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-sm">Create Initiative</div>
                    <div className="text-xs text-gray-500">Transform insights into action</div>
                  </div>
                </Link>

                <Link
                  href="/track"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-sm">Track Progress</div>
                    <div className="text-xs text-gray-500">Monitor initiative execution</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          {/* AI-Powered Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analytics.insights.map((insight, index) => (
              <div key={index} className="card-primary p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-h3">{insight.title}</h3>
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(insight.trend)}
                    <span className={`text-sm font-medium ${getTrendColor(insight.trend)}`}>
                      {insight.trend === 'up'
                        ? 'Improving'
                        : insight.trend === 'down'
                          ? 'Declining'
                          : 'Stable'}
                    </span>
                  </div>
                </div>

                <div className="text-3xl font-bold text-primary mb-2">
                  {insight.type === 'velocity'
                    ? `${insight.value}d`
                    : insight.type === 'engagement'
                      ? insight.value
                      : `${insight.value.toFixed(1)}%`}
                </div>

                <p className="text-sm text-gray-600">{insight.description}</p>

                {insight.type === 'efficiency' && insight.value < 50 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-yellow-600 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-yellow-800">Recommendation</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Consider reviewing initiative scoping and resource allocation to improve
                      completion rates.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* AI Usage Stats */}
          <div className="card-secondary p-6">
            <h3 className="text-h3 mb-4 flex items-center">
              <span className="mr-2">🤖</span>
              AI Assistance Impact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {analytics.trends.aiUsage}
                </div>
                <div className="text-sm text-gray-600">AI Interactions (30d)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success mb-1">
                  {analytics.overview.totalInitiatives > 0
                    ? Math.round(
                        (analytics.trends.aiUsage / analytics.overview.totalInitiatives) * 100
                      )
                    : 0}
                  %
                </div>
                <div className="text-sm text-gray-600">AI Utilization Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning mb-1">
                  {analytics.trends.aiUsage > 0 ? '⬆️' : '➡️'}
                </div>
                <div className="text-sm text-gray-600">
                  {analytics.trends.aiUsage > 10 ? 'High Adoption' : 'Growing Usage'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Export Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card-tertiary p-6 text-center hover:shadow-card-secondary transition-shadow cursor-pointer">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-h3 mb-2">Executive Summary</h3>
              <p className="text-caption text-gray-600 mb-4">
                Weekly efficiency report for leadership
              </p>
              <button className="btn-secondary text-sm w-full">Generate Report</button>
            </div>

            <div className="card-tertiary p-6 text-center hover:shadow-card-secondary transition-shadow cursor-pointer">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-h3 mb-2">Data Export</h3>
              <p className="text-caption text-gray-600 mb-4">
                Export raw data for external analysis
              </p>
              <button className="btn-secondary text-sm w-full">Export CSV</button>
            </div>

            <div className="card-tertiary p-6 text-center hover:shadow-card-secondary transition-shadow cursor-pointer">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-h3 mb-2">Scheduled Reports</h3>
              <p className="text-caption text-gray-600 mb-4">Setup automated reporting schedules</p>
              <button className="btn-secondary text-sm w-full">Configure</button>
            </div>
          </div>

          {/* Report History */}
          <div className="card-primary p-6">
            <h3 className="text-h3 mb-4">Recent Reports</h3>
            <div className="text-center py-8 text-gray-500">
              <svg
                className="w-12 h-12 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm">No reports generated yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Generate your first report to get started
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
