'use client';
import React, { useEffect, useState } from 'react';

type Cluster = { label: string; issueIds: string[]; rationale: string };

interface Props {
  onSelectAll: (issueIds: string[]) => void;
}

export default function AIClusters({ onSelectAll }: Props) {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="flex flex-wrap gap-3 animate-fade-in">
      {clusters.map((c) => (
        <div
          key={c.label}
          className="card-interactive hover:shadow-card-standard-hover transition-all duration-300 transform hover:-translate-y-0.5"
          style={{
            backdropFilter: 'blur(10px)',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
          }}
        >
          <div className="px-4 py-3 rounded-lg flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <span className="text-body-sm font-semibold text-indigo-700">{c.label}</span>
            </div>
            <button
              onClick={() => {
                onSelectAll(c.issueIds);
                track('issues_select_all_related', { label: c.label, count: c.issueIds.length });
              }}
              className="btn-primary text-xs hover:scale-105 transition-transform duration-200"
              title={c.rationale}
            >
              Select all ({c.issueIds.length})
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
