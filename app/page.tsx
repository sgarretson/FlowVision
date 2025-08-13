'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type Issue = {
  id: string;
  description: string;
  votes: number;
  heatmapScore: number;
  createdAt: string;
};

type Initiative = {
  id: string;
  title: string;
  status: string;
  progress: number;
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push('/auth');
      return;
    }
    loadDashboardData();
  }, [session, router]);

  async function loadDashboardData() {
    try {
      const [issuesRes, initiativesRes] = await Promise.all([
        fetch('/api/issues'),
        fetch('/api/initiatives'),
      ]);

      if (issuesRes.ok) {
        const issuesData = await issuesRes.json();
        setIssues(issuesData); // Get ALL issues for accurate statistics
      }

      if (initiativesRes.ok) {
        const initiativesData = await initiativesRes.json();
        setInitiatives(initiativesData); // Get ALL initiatives for accurate statistics
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getHeatmapColor(score: number): string {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'COMPLETED':
      case 'Done':
        return 'bg-green-100 text-green-800';
      case 'ACTIVE':
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'APPROVED':
      case 'Prioritize':
        return 'bg-orange-100 text-orange-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'PLANNING':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  if (loading) {
    return (
      <main className="space-y-8 animate-fade-in">
        {/* Hero Section Skeleton */}
        <div className="text-center py-8">
          <div className="skeleton h-10 w-64 mx-auto mb-4"></div>
          <div className="skeleton h-6 w-96 mx-auto"></div>
        </div>

        {/* Hero Metric Skeleton */}
        <div className="text-center">
          <div className="card-primary p-8 max-w-md mx-auto">
            <div className="skeleton h-20 w-24 mx-auto mb-2"></div>
            <div className="skeleton h-8 w-40 mx-auto mb-4"></div>
            <div className="skeleton h-4 w-48 mx-auto"></div>
          </div>
        </div>

        {/* Quick Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-secondary p-6 text-center">
              <div className="skeleton h-10 w-16 mx-auto mb-2"></div>
              <div className="skeleton h-4 w-24 mx-auto"></div>
            </div>
          ))}
        </div>

        {/* Quick Actions Skeleton */}
        <div className="text-center">
          <div className="skeleton h-8 w-32 mx-auto mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-tertiary p-6">
                <div className="skeleton h-12 w-12 mx-auto mb-4 rounded-lg"></div>
                <div className="skeleton h-6 w-32 mx-auto mb-2"></div>
                <div className="skeleton h-4 w-40 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  const topIssues = issues.slice(0, 3);
  const recentInitiatives = initiatives.slice(0, 3);
  const issueStats = {
    total: issues.length,
    critical: issues.filter((i) => i.heatmapScore >= 80).length,
    high: issues.filter((i) => i.heatmapScore >= 60 && i.heatmapScore < 80).length,
  };

  return (
    <main className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center py-8">
        <h1 className="text-h1 mb-4">Welcome to FlowVision</h1>
        <p className="text-body max-w-2xl mx-auto">
          Transform friction into flow. Detect operational issues, categorize improvement ideas, and
          create strategic roadmaps to efficiency.
        </p>
      </div>

      {/* Hero Metric */}
      <div className="text-center">
        <div className="card-primary p-8 max-w-md mx-auto">
          <div className="text-6xl font-bold text-primary mb-2">
            {initiatives.filter((i) => i.status === 'ACTIVE' || i.status === 'In Progress').length}
          </div>
          <div className="text-h3 text-gray-600 mb-4">Active Initiatives</div>
          <div className="text-caption">
            {initiatives.length > 0
              ? `${Math.round((initiatives.filter((i) => i.status === 'ACTIVE' || i.status === 'In Progress').length / initiatives.length) * 100)}% of total initiatives`
              : 'Start by identifying issues or creating your first initiative'}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card-secondary p-6 text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">{initiatives.length}</div>
          <div className="text-caption">Total Initiatives</div>
        </div>
        <div className="card-secondary p-6 text-center">
          <div className="text-3xl font-bold text-warning mb-2">{issueStats.total}</div>
          <div className="text-caption">Issues Identified</div>
        </div>
        <div className="card-secondary p-6 text-center">
          <div className="text-3xl font-bold text-danger mb-2">{issueStats.critical}</div>
          <div className="text-caption">Critical Issues</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="text-center">
        <h2 className="text-h2 mb-6">Get Started</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Link
            href="/issues"
            className="card-tertiary p-6 hover:shadow-card-secondary transition-shadow duration-200 group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
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
                  d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-h3 mb-2">Identify Issues</h3>
            <p className="text-caption">Report and vote on problems that need attention</p>
          </Link>

          <Link
            href="/ideas"
            className="card-tertiary p-6 hover:shadow-card-secondary transition-shadow duration-200 group"
          >
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-yellow-200 transition-colors">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="text-h3 mb-2">Capture Ideas</h3>
            <p className="text-caption">Brainstorm and collaborate on strategic opportunities</p>
          </Link>

          <Link
            href="/initiatives"
            className="card-tertiary p-6 hover:shadow-card-secondary transition-shadow duration-200 group"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
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
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-h3 mb-2">Plan Initiatives</h3>
            <p className="text-caption">Create and prioritize solutions to move forward</p>
          </Link>

          <Link
            href="/track"
            className="card-tertiary p-6 hover:shadow-card-secondary transition-shadow duration-200 group"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-h3 mb-2">Execute & Track</h3>
            <p className="text-caption">Monitor progress and keep initiatives on track</p>
          </Link>
        </div>
      </div>

      {/* Recent Activity - Only show if there's content */}
      {(topIssues.length > 0 || recentInitiatives.length > 0) && (
        <div>
          <h2 className="text-h2 mb-6 text-center">Recent Activity</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {/* Top Issues */}
            {topIssues.length > 0 && (
              <div className="card-secondary p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-h3">Top Issues</h3>
                  <Link href="/issues" className="text-sm text-primary hover:underline font-medium">
                    View All
                  </Link>
                </div>
                <div className="space-y-4">
                  {topIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-2 min-w-[60px]">
                        <span className="text-sm font-semibold text-gray-700">{issue.votes}</span>
                        <div
                          className={`w-3 h-3 rounded-full ${getHeatmapColor(issue.heatmapScore)}`}
                        ></div>
                      </div>
                      <p className="text-caption flex-1">{issue.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Initiatives */}
            {recentInitiatives.length > 0 && (
              <div className="card-secondary p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-h3">Recent Initiatives</h3>
                  <Link
                    href="/initiatives"
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    View All
                  </Link>
                </div>
                <div className="space-y-4">
                  {recentInitiatives.map((initiative) => (
                    <div key={initiative.id} className="p-3 rounded-lg bg-gray-50">
                      <Link
                        href={`/initiatives/${initiative.id}`}
                        className="text-body font-medium hover:text-primary transition-colors"
                      >
                        {initiative.title}
                      </Link>
                      <div className="flex items-center gap-3 mt-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(initiative.status)}`}
                        >
                          {initiative.status}
                        </span>
                        <div className="flex items-center gap-1">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-300"
                              style={{ width: `${initiative.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">{initiative.progress}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
