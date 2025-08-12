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

  if (loading) return <div className="text-caption">Analyzing issues…</div>;
  if (error) return <div className="text-caption text-red-600">{error}</div>;
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
    <div className="flex flex-wrap gap-2">
      {clusters.map((c) => (
        <div
          key={c.label}
          className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm flex items-center gap-2"
        >
          <span className="font-medium">{c.label}</span>
          <button
            onClick={() => {
              onSelectAll(c.issueIds);
              track('issues_select_all_related', { label: c.label, count: c.issueIds.length });
            }}
            className="underline text-indigo-700 hover:text-indigo-900"
            title={c.rationale}
          >
            Select all related ({c.issueIds.length})
          </button>
        </div>
      ))}
    </div>
  );
}
