'use client';

import React, { useEffect, useState } from 'react';

type Profile = {
  industry: string;
  size: number;
  metrics: Record<string, unknown>;
};

export default function ProfileForm() {
  const [profile, setProfile] = useState<Profile>({ industry: '', size: 0, metrics: {} });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        if (data)
          setProfile({
            industry: data.industry ?? '',
            size: data.size ?? 0,
            metrics: data.metrics ?? {},
          });
      }
      setLoading(false);
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (res.ok) setMessage('Saved');
    else setMessage('Failed to save');
  }

  if (loading) return <div>Loading...</div>;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 max-w-xl">
      <input
        className="border rounded px-3 py-2"
        placeholder="Industry"
        value={profile.industry}
        onChange={(e) => setProfile((p) => ({ ...p, industry: e.target.value }))}
      />
      <input
        className="border rounded px-3 py-2"
        placeholder="Company Size"
        type="number"
        value={profile.size}
        onChange={(e) => setProfile((p) => ({ ...p, size: Number(e.target.value) }))}
      />
      <textarea
        className="border rounded px-3 py-2"
        placeholder="Metrics (JSON)"
        value={JSON.stringify(profile.metrics, null, 2)}
        onChange={(e) => {
          try {
            const json = JSON.parse(e.target.value || '{}');
            setProfile((p) => ({ ...p, metrics: json }));
          } catch {
            // ignore JSON parse errors while typing
          }
        }}
        rows={6}
      />
      {message && <div className="text-sm text-gray-600">{message}</div>}
      <button className="px-3 py-2 rounded bg-primary text-white" type="submit">
        Save
      </button>
    </form>
  );
}
