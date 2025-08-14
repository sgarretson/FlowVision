'use client';
import React, { useEffect, useState } from 'react';

type Cluster = {
  label: string;
  issueIds: string[];
  rationale: string;
  id?: string;
  analysis?: {
    summary: string;
    crossIssuePatterns: string[];
    strategicPriority: string;
    initiativeRecommendations: string[];
    confidence: number;
  };
};

interface Props {
  onSelectAll: (issueIds: string[]) => void;
}

export default function AIClusters({ onSelectAll }: Props) {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);
  const [generatingAnalysis, setGeneratingAnalysis] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/issues/clusterize');
        if (res.ok) {
          const data = await res.json();
          if (mounted) setClusters(data.clusters || []);
        } else setError('Failed to load clusters');
      } catch {
        setError('Failed to load clusters');
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading)
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="skeleton-modern h-4 w-4 rounded-full"></div>
        <div className="text-body-sm text-gray-600">Analyzing issues with AI...</div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <div className="text-body-sm text-red-700">{error}</div>
      </div>
    );

  if (!clusters.length) return null;

  async function track(event: string, metadata?: any) {
    try {
      await fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, metadata }),
      });
    } catch {}
  }

  async function generateDetailedAnalysis(cluster: Cluster) {
    if (!cluster.id || cluster.analysis) return;

    try {
      setGeneratingAnalysis(cluster.label);
      const response = await fetch(`/api/clusters/${cluster.id}/generate-summary`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();

        // Update the cluster with new analysis
        setClusters((prev) =>
          prev.map((c) =>
            c.label === cluster.label
              ? {
                  ...c,
                  analysis: {
                    summary: data.consolidatedSummary || 'AI analysis generated',
                    crossIssuePatterns: data.crossIssuePatterns || [],
                    strategicPriority: data.strategicPriority || 'MEDIUM',
                    initiativeRecommendations: data.initiativeRecommendations || [],
                    confidence: data.confidence || 75,
                  },
                }
              : c
          )
        );

        track('ai_cluster_analysis_generated', {
          cluster: cluster.label,
          confidence: data.confidence,
        });
      }
    } catch (error) {
      console.error('Failed to generate analysis:', error);
    } finally {
      setGeneratingAnalysis(null);
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {clusters.map((c) => (
        <div
          key={c.label}
          className={`card-interactive hover:shadow-card-standard-hover transition-all duration-300 ${
            expandedCluster === c.label ? 'shadow-card-elevated' : ''
          }`}
          style={{
            backdropFilter: 'blur(10px)',
            background:
              expandedCluster === c.label ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
          }}
        >
          {/* Cluster Header */}
          <div className="px-4 py-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <span className="text-body-sm font-semibold text-indigo-700">{c.label}</span>
                  {c.analysis?.confidence && (
                    <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                      {c.analysis.confidence}% confidence
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    onSelectAll(c.issueIds);
                    track('issues_select_all_related', {
                      label: c.label,
                      count: c.issueIds.length,
                    });
                  }}
                  className="btn-primary text-xs hover:scale-105 transition-transform duration-200"
                  title={c.rationale}
                >
                  Select all ({c.issueIds.length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Generate Analysis Button */}
                {c.id && !c.analysis && (
                  <button
                    onClick={() => generateDetailedAnalysis(c)}
                    disabled={generatingAnalysis === c.label}
                    className="btn-secondary text-xs hover:scale-105 transition-transform duration-200 disabled:opacity-50"
                  >
                    {generatingAnalysis === c.label ? (
                      <div className="flex items-center gap-1">
                        <div className="animate-spin w-3 h-3 border border-indigo-300 border-t-indigo-600 rounded-full"></div>
                        Analyzing...
                      </div>
                    ) : (
                      '🧠 AI Analysis'
                    )}
                  </button>
                )}

                {/* Expand/Collapse Button */}
                {(c.analysis || c.rationale) && (
                  <button
                    onClick={() => setExpandedCluster(expandedCluster === c.label ? null : c.label)}
                    className="text-indigo-600 hover:text-indigo-700 transition-colors duration-200"
                  >
                    {expandedCluster === c.label ? '👁️ Hide Details' : '👁️ Show Details'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          {expandedCluster === c.label && (
            <div className="border-t border-indigo-200 px-4 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 animate-fade-in">
              <div className="space-y-4">
                {/* Basic Rationale */}
                {c.rationale && (
                  <div>
                    <h5 className="text-body-sm font-semibold text-indigo-900 mb-2">
                      Clustering Rationale
                    </h5>
                    <p className="text-body-sm text-indigo-800 leading-relaxed bg-white/50 p-3 rounded-lg">
                      {c.rationale}
                    </p>
                  </div>
                )}

                {/* AI Analysis Details */}
                {c.analysis && (
                  <>
                    {/* Summary */}
                    <div>
                      <h5 className="text-body-sm font-semibold text-indigo-900 mb-2">
                        AI Analysis Summary
                      </h5>
                      <p className="text-body-sm text-indigo-800 leading-relaxed bg-white/50 p-3 rounded-lg">
                        {c.analysis.summary}
                      </p>
                    </div>

                    {/* Strategic Priority */}
                    <div>
                      <h5 className="text-body-sm font-semibold text-indigo-900 mb-2">
                        Strategic Priority
                      </h5>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          c.analysis.strategicPriority === 'HIGH'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : c.analysis.strategicPriority === 'MEDIUM'
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                              : 'bg-green-100 text-green-800 border border-green-200'
                        }`}
                      >
                        {c.analysis.strategicPriority} Priority
                      </span>
                    </div>

                    {/* Cross-Issue Patterns */}
                    {c.analysis.crossIssuePatterns.length > 0 && (
                      <div>
                        <h5 className="text-body-sm font-semibold text-indigo-900 mb-2">
                          Cross-Issue Patterns
                        </h5>
                        <div className="space-y-2">
                          {c.analysis.crossIssuePatterns.map((pattern, index) => (
                            <div
                              key={index}
                              className="bg-white/50 p-2 rounded text-body-xs text-indigo-700"
                            >
                              • {pattern}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Initiative Recommendations */}
                    {c.analysis.initiativeRecommendations.length > 0 && (
                      <div>
                        <h5 className="text-body-sm font-semibold text-indigo-900 mb-2">
                          Strategic Recommendations
                        </h5>
                        <div className="space-y-2">
                          {c.analysis.initiativeRecommendations.map((rec, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-2 bg-white/50 p-2 rounded"
                            >
                              <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-medium mt-0.5 flex-shrink-0">
                                {index + 1}
                              </div>
                              <p className="text-body-xs text-indigo-700">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
