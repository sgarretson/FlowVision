'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AIAnalysis from './ai-analysis';

type Issue = {
  id: string;
  description: string;
  votes: number;
  heatmapScore: number;
  createdAt: string;
};

export default function IssuesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIssue, setNewIssue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      router.push('/auth');
      return;
    }
    fetchIssues();
  }, [session, router]);

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
        body: JSON.stringify({ description: newIssue })
      });

      if (res.ok) {
        setNewIssue('');
        fetchIssues(); // Refresh the list
        setMessage('Issue created successfully');
      } else {
        setMessage('Failed to create issue');
      }
    } catch (error) {
      setMessage('Failed to create issue');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVote(issueId: string, increment: boolean) {
    try {
      const res = await fetch(`/api/issues/${issueId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ increment })
      });

      if (res.ok) {
        fetchIssues(); // Refresh to show updated votes
      } else {
        setMessage('Failed to vote on issue');
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
      title: `Initiative: ${issue.description.substring(0, 50)}...`
    });
    router.push(`/initiatives?${params.toString()}`);
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
      <div className="text-center">
        <h1 className="text-h1 mb-4">Issue Identification</h1>
        <p className="text-body max-w-2xl mx-auto mb-6">
          Identify and prioritize problems that need attention. Vote on issues to help determine which ones should become initiatives.
        </p>
        <div className="inline-flex items-center gap-4 text-caption">
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            {issues.length} Total Issues
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 bg-danger rounded-full"></div>
            {issues.filter(i => i.heatmapScore >= 80).length} Critical
          </span>
        </div>
      </div>

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
              className={`btn-primary ${(submitting || !newIssue.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
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

      {/* Issues List */}
      <div>
        {issues.length === 0 ? (
          <div className="card-tertiary p-8 text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-h3 mb-2">No Issues Yet</h3>
            <p className="text-caption">Be the first to identify a problem that needs attention!</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {issues.map((issue) => (
              <div key={issue.id} className="card-secondary p-6 hover:shadow-card-primary transition-shadow duration-200">
                <div className="flex items-start gap-6">
                  {/* Voting Section */}
                  <div className="flex flex-col items-center gap-2 min-w-[80px]">
                    <button
                      onClick={() => handleVote(issue.id, true)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Upvote this issue"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">{issue.votes}</span>
                    <button
                      onClick={() => handleVote(issue.id, false)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-red-100 rounded-lg transition-colors"
                      title="Downvote this issue"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className="text-xs text-gray-500 text-center">votes</div>
                  </div>

                  {/* Issue Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <p className="text-body flex-1">{issue.description}</p>
                      
                      {/* Heatmap Score Badge */}
                      <div className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        issue.heatmapScore >= 80 ? 'status-critical' :
                        issue.heatmapScore >= 60 ? 'status-high' :
                        issue.heatmapScore >= 40 ? 'status-medium' : 'status-low'
                      }`}>
                        {getHeatmapLabel(issue.heatmapScore)} ({issue.heatmapScore})
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="text-caption">
                        Created {new Date(issue.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
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

                    {/* AI Analysis Section */}
                    <div className="border-t pt-4">
                      <AIAnalysis 
                        issueDescription={issue.description}
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
  );
}