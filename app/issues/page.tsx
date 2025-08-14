'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AIAnalysis from './ai-analysis';
import ClusteringView from './clustering-view';
import AIClusters from './ai-clusters';
import AISummary from '@/components/AISummary';
import { trackEvent } from '@/utils/analytics';
import { useToast } from '@/components/ToastProvider';

type Issue = {
  id: string;
  description: string;
  votes: number;
  heatmapScore: number;
  createdAt: string;
  aiSummary?: string | null;
  aiConfidence?: number | null;
  aiGeneratedAt?: string | null;
  aiVersion?: string | null;
};

export default function IssuesPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const router = useRouter();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIssue, setNewIssue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'report' | 'browse' | 'ai-analysis'>(
    'overview'
  );
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    if (!session) {
      router.push('/auth');
      return;
    }
    fetchIssues();
  }, [session, router]);

  // Restore persisted selection
  useEffect(() => {
    if (!session?.user?.email) return;
    try {
      const storageKey = `issues:selected:${session.user.email}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const ids: unknown = JSON.parse(raw);
        if (Array.isArray(ids)) {
          // Filter against current issues once loaded
          const valid = ids.filter((id) => typeof id === 'string');
          setSelectedIssues(new Set(valid as string[]));
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email]);

  // Keep selection valid when issue list changes
  useEffect(() => {
    if (!issues?.length) return;
    setSelectedIssues((prev) => {
      const issueIds = new Set(issues.map((i) => i.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (issueIds.has(id)) next.add(id);
      });
      return next;
    });
  }, [issues]);

  // Persist selection
  useEffect(() => {
    if (!session?.user?.email) return;
    try {
      const storageKey = `issues:selected:${session.user.email}`;
      localStorage.setItem(storageKey, JSON.stringify(Array.from(selectedIssues)));
    } catch {}
  }, [selectedIssues, session?.user?.email]);

  async function fetchIssues() {
    try {
      const res = await fetch('/api/issues');
      if (res.ok) {
        const data = await res.json();
        setIssues(data);
      } else {
        setMessage('Failed to load issues');
      }
    } catch (error) {
      setMessage('Failed to load issues');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newIssue.trim()) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newIssue }),
      });

      if (res.ok) {
        setNewIssue('');
        fetchIssues(); // Refresh the list
        setMessage('Issue created successfully');
        trackEvent('issues_create_success');
        showToast('Issue created', 'success');
      } else {
        setMessage('Failed to create issue');
        trackEvent('issues_create_fail');
        showToast('Failed to create issue', 'error');
      }
    } catch (error) {
      setMessage('Failed to create issue');
      showToast('Failed to create issue', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVote(issueId: string, increment: boolean) {
    try {
      const res = await fetch(`/api/issues/${issueId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ increment }),
      });

      if (res.ok) {
        fetchIssues(); // Refresh to show updated votes
        trackEvent('issues_vote', { issueId, up: increment });
        showToast(increment ? 'Upvoted issue' : 'Downvoted issue', 'success');
      } else {
        setMessage('Failed to vote on issue');
        showToast('Failed to vote on issue', 'error');
      }
    } catch (error) {
      setMessage('Failed to vote on issue');
    }
  }

  async function handleConvertToInitiative(issue: Issue) {
    // Navigate to initiatives page with pre-filled data
    const params = new URLSearchParams({
      fromIssue: 'true',
      problem: issue.description,
      title: `Initiative: ${issue.description.substring(0, 50)}...`,
    });
    router.push(`/initiatives?${params.toString()}`);
  }

  function handleSelectIssue(issueId: string, checked: boolean) {
    const newSelected = new Set(selectedIssues);
    if (checked) newSelected.add(issueId);
    else newSelected.delete(issueId);
    setSelectedIssues(newSelected);
  }

  function handleSelectAll(checked: boolean) {
    setSelectedIssues(checked ? new Set(issues.map((i) => i.id)) : new Set());
  }

  async function handleCreateInitiativeFromSelected() {
    if (selectedIssues.size === 0) {
      setMessage('Please select at least one issue to create an initiative');
      return;
    }

    setBulkActionLoading(true);
    setMessage(null);

    try {
      const selectedIssueObjects = issues.filter((issue) => selectedIssues.has(issue.id));

      const res = await fetch('/api/initiatives/from-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issues: selectedIssueObjects.map((issue) => ({
            id: issue.id,
            description: issue.description,
            heatmapScore: issue.heatmapScore,
            votes: issue.votes,
            aiSummary: issue.aiSummary,
            aiConfidence: issue.aiConfidence,
          })),
        }),
      });

      if (res.ok) {
        const initiative = await res.json();
        setSelectedIssues(new Set()); // Clear selection
        setMessage(
          `Initiative "${initiative.title}" created successfully from ${selectedIssues.size} issue(s)`
        );
        trackEvent('initiative_created_from_issues', {
          count: selectedIssues.size,
          initiativeId: initiative.id,
        });
        showToast('Initiative created from selected issues', 'success');

        // Navigate to the new initiative after a short delay
        setTimeout(() => {
          router.push(`/initiatives/${initiative.id}`);
        }, 1500);
      } else {
        const error = await res.json();
        setMessage(error.error || 'Failed to create initiative from issues');
        trackEvent('initiative_create_from_issues_fail', { count: selectedIssues.size });
        showToast('Failed to create initiative from issues', 'error');
      }
    } catch (error) {
      setMessage('Failed to create initiative from issues');
      showToast('Failed to create initiative from issues', 'error');
    } finally {
      setBulkActionLoading(false);
    }
  }

  function getHeatmapColor(score: number): string {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  function getHeatmapLabel(score: number): string {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Header Skeleton */}
        <div className="text-center">
          <div className="skeleton h-12 w-80 mx-auto mb-4"></div>
          <div className="skeleton h-6 w-96 mx-auto mb-6"></div>
          <div className="flex justify-center gap-4">
            <div className="skeleton h-4 w-24"></div>
            <div className="skeleton h-4 w-20"></div>
          </div>
        </div>

        {/* Form Skeleton */}
        <div className="card-primary p-6 max-w-2xl mx-auto">
          <div className="skeleton h-8 w-48 mx-auto mb-6"></div>
          <div className="skeleton h-24 w-full mb-4"></div>
          <div className="flex justify-center">
            <div className="skeleton h-10 w-32"></div>
          </div>
        </div>

        {/* Legend Skeleton */}
        <div className="card-secondary p-6 max-w-4xl mx-auto">
          <div className="skeleton h-6 w-40 mx-auto mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 rounded-lg text-center">
                <div className="skeleton h-6 w-6 mx-auto mb-2 rounded-full"></div>
                <div className="skeleton h-4 w-16 mx-auto mb-1"></div>
                <div className="skeleton h-3 w-12 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Issues List Skeleton */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-secondary p-6">
              <div className="flex items-start gap-6">
                <div className="flex flex-col items-center gap-2 min-w-[80px]">
                  <div className="skeleton h-8 w-8 rounded-lg"></div>
                  <div className="skeleton h-8 w-8"></div>
                  <div className="skeleton h-8 w-8 rounded-lg"></div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-4 w-full"></div>
                      <div className="skeleton h-4 w-3/4"></div>
                    </div>
                    <div className="skeleton h-6 w-20 rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="skeleton h-4 w-24"></div>
                    <div className="skeleton h-8 w-32"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Clean Header */}
      <div className="text-center">
        <h1 className="text-h1 mb-4">Issue Identification</h1>
        <p className="text-body max-w-2xl mx-auto mb-6">
          Identify and prioritize problems that need attention. Vote on issues to help determine
          which ones should become initiatives.
        </p>
      </div>

      {/* Enhanced Tab Navigation */}
      <div className="max-w-6xl mx-auto">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 justify-center">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📈 Overview
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {issues.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'report'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📝 Report Issue
            </button>
            <button
              onClick={() => setActiveTab('browse')}
              className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'browse'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📋 Browse Issues
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {issues.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('ai-analysis')}
              className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'ai-analysis'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🧠 AI Analysis
              <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">AI</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Statistics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card-primary p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{issues.length}</div>
                <div className="text-sm text-gray-600">Total Issues</div>
              </div>
              <div className="card-primary p-6 text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {issues.filter((i) => i.heatmapScore >= 80).length}
                </div>
                <div className="text-sm text-gray-600">Critical</div>
              </div>
              <div className="card-primary p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{selectedIssues.size}</div>
                <div className="text-sm text-gray-600">Selected</div>
              </div>
              <div className="card-primary p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {issues.filter((i) => i.aiSummary).length}
                </div>
                <div className="text-sm text-gray-600">AI Analyzed</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card-secondary p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('report')}
                  className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <span className="text-2xl">📝</span>
                  <div className="text-left">
                    <div className="font-medium">Report New Issue</div>
                    <div className="text-sm text-gray-600">Submit a new problem</div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <span className="text-2xl">📋</span>
                  <div className="text-left">
                    <div className="font-medium">Browse & Vote</div>
                    <div className="text-sm text-gray-600">Review existing issues</div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('ai-analysis')}
                  className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <span className="text-2xl">🧠</span>
                  <div className="text-left">
                    <div className="font-medium">AI Insights</div>
                    <div className="text-sm text-gray-600">Strategic analysis</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="space-y-8">
            {/* Create New Issue Form */}
            <div className="card-primary p-8 max-w-3xl mx-auto">
              <h2 className="text-h2 mb-6 text-center">Report New Issue</h2>
              <p className="text-center text-gray-600 mb-8">
                Help us identify problems that need attention. Be specific about impact and
                frequency.
              </p>
              <form onSubmit={handleSubmit} className="space-y-6">
                <textarea
                  className="textarea-field"
                  placeholder="Describe the issue or problem you've identified. Include:
• What is the problem?
• How often does it occur?
• What is the business impact?
• Who is affected?"
                  value={newIssue}
                  onChange={(e) => setNewIssue(e.target.value)}
                  rows={6}
                  disabled={submitting}
                />
                <div className="flex justify-center">
                  <button
                    type="submit"
                    className={`btn-primary ${submitting || !newIssue.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={submitting || !newIssue.trim()}
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 loading-spinner"></div>
                        Creating...
                      </div>
                    ) : (
                      'Submit Issue'
                    )}
                  </button>
                </div>
              </form>
              {message && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm text-center">
                  {message}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'browse' && (
          <div className="space-y-8">
            {/* Create New Issue Form */}
            <div className="card-primary p-6 max-w-2xl mx-auto">
              <h2 className="text-h2 mb-6 text-center">Report New Issue</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                  className="textarea-field"
                  placeholder="Describe the issue or problem you've identified. Be specific about the impact and frequency..."
                  value={newIssue}
                  onChange={(e) => setNewIssue(e.target.value)}
                  rows={4}
                  disabled={submitting}
                />
                <div className="flex justify-center">
                  <button
                    type="submit"
                    className={`btn-primary ${submitting || !newIssue.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={submitting || !newIssue.trim()}
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 loading-spinner"></div>
                        Creating...
                      </div>
                    ) : (
                      'Report Issue'
                    )}
                  </button>
                </div>
              </form>
              {message && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm text-center">
                  {message}
                </div>
              )}
            </div>

            {/* Issues Heatmap Legend */}
            <div className="card-secondary p-6 max-w-4xl mx-auto">
              <h3 className="text-h3 mb-4 text-center">Priority Heatmap</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="status-critical p-3 rounded-lg text-center">
                  <div className="w-6 h-6 bg-red-500 rounded-full mx-auto mb-2"></div>
                  <div className="font-medium text-sm">Critical</div>
                  <div className="text-xs opacity-75">80-100</div>
                </div>
                <div className="status-high p-3 rounded-lg text-center">
                  <div className="w-6 h-6 bg-orange-500 rounded-full mx-auto mb-2"></div>
                  <div className="font-medium text-sm">High</div>
                  <div className="text-xs opacity-75">60-79</div>
                </div>
                <div className="status-medium p-3 rounded-lg text-center">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full mx-auto mb-2"></div>
                  <div className="font-medium text-sm">Medium</div>
                  <div className="text-xs opacity-75">40-59</div>
                </div>
                <div className="status-low p-3 rounded-lg text-center">
                  <div className="w-6 h-6 bg-green-500 rounded-full mx-auto mb-2"></div>
                  <div className="font-medium text-sm">Low</div>
                  <div className="text-xs opacity-75">0-39</div>
                </div>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {issues.length > 0 && (
              <div className="card-secondary p-4 max-w-4xl mx-auto mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIssues.size === issues.length && issues.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium">
                        {selectedIssues.size === 0
                          ? `Select All (${issues.length})`
                          : selectedIssues.size === issues.length
                            ? `All Selected (${issues.length})`
                            : `${selectedIssues.size} of ${issues.length} Selected`}
                      </span>
                    </label>

                    {selectedIssues.size > 0 && (
                      <button
                        onClick={() => setSelectedIssues(new Set())}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>

                  {selectedIssues.size > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-600">
                        {selectedIssues.size} issue{selectedIssues.size === 1 ? '' : 's'} selected
                      </div>
                      <button
                        onClick={handleCreateInitiativeFromSelected}
                        disabled={bulkActionLoading}
                        className="btn-primary text-sm flex items-center gap-2"
                      >
                        {bulkActionLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            Create Initiative from Selected
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Issues List */}
            <div>
              {issues.length === 0 ? (
                <div className="card-tertiary p-8 text-center max-w-2xl mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
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
                  <h3 className="text-h3 mb-2">No Issues Yet</h3>
                  <p className="text-caption">
                    Be the first to identify a problem that needs attention!
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-w-4xl mx-auto">
                  {issues.map((issue) => (
                    <div
                      key={issue.id}
                      className={`card-secondary p-6 hover:shadow-card-primary transition-all duration-200 ${
                        selectedIssues.has(issue.id) ? 'ring-2 ring-primary bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-6">
                        {/* Selection Checkbox */}
                        <div className="flex items-center pt-2">
                          <input
                            type="checkbox"
                            data-cy="issue-checkbox"
                            checked={selectedIssues.has(issue.id)}
                            onChange={(e) => handleSelectIssue(issue.id, e.target.checked)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </div>

                        {/* Voting Section */}
                        <div className="flex flex-col items-center gap-2 min-w-[80px]">
                          <button
                            onClick={() => handleVote(issue.id, true)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Upvote this issue"
                          >
                            <svg
                              className="w-4 h-4 text-gray-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 15l7-7 7 7"
                              />
                            </svg>
                          </button>
                          <span className="text-2xl font-bold text-gray-900">{issue.votes}</span>
                          <button
                            onClick={() => handleVote(issue.id, false)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-red-100 rounded-lg transition-colors"
                            title="Downvote this issue"
                          >
                            <svg
                              className="w-4 h-4 text-gray-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                          <div className="text-xs text-gray-500 text-center">votes</div>
                        </div>

                        {/* Issue Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <p className="text-body flex-1">{issue.description}</p>

                            {/* Heatmap Score Badge */}
                            <div
                              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                issue.heatmapScore >= 80
                                  ? 'status-critical'
                                  : issue.heatmapScore >= 60
                                    ? 'status-high'
                                    : issue.heatmapScore >= 40
                                      ? 'status-medium'
                                      : 'status-low'
                              }`}
                            >
                              {getHeatmapLabel(issue.heatmapScore)} ({issue.heatmapScore})
                            </div>
                          </div>

                          <div className="flex items-center justify-between mb-4">
                            <div className="text-caption">
                              Created{' '}
                              {new Date(issue.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleConvertToInitiative(issue)}
                                className="btn-success text-sm"
                              >
                                Convert to Initiative
                              </button>
                            </div>
                          </div>

                          {/* AI Summary Section */}
                          <div className="border-t pt-4">
                            <AISummary
                              itemId={issue.id}
                              itemType="issue"
                              summary={issue.aiSummary}
                              confidence={issue.aiConfidence}
                              generatedAt={issue.aiGeneratedAt}
                              version={issue.aiVersion}
                              onSummaryGenerated={(summary) => {
                                // Update the issue in the local state
                                setIssues((prev) =>
                                  prev.map((i) =>
                                    i.id === issue.id
                                      ? {
                                          ...i,
                                          aiSummary: summary,
                                          aiGeneratedAt: new Date().toISOString(),
                                        }
                                      : i
                                  )
                                );
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ai-analysis' && (
          <div className="space-y-8">
            <AIClusters
              onSelectAll={(ids) => {
                const next = new Set(selectedIssues);
                ids.forEach((id) => next.add(id));
                setSelectedIssues(next);
                setMessage(`${ids.length} issues added by AI grouping`);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
