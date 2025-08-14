'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Log = {
  id: string;
  action: string;
  timestamp: string;
  details: any;
  user?: {
    name: string | null;
    email: string;
  };
};

export default function AuditLogsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      router.push('/auth');
      return;
    }
    loadLogs();
  }, [session, router]);

  async function loadLogs() {
    try {
      setLoading(true);
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      } else {
        setError('Failed to load audit logs');
      }
    } catch (err) {
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }

  function getActionIcon(action: string) {
    if (action.includes('AI_')) {
      return (
        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-purple-600"
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
      );
    }
    if (action.includes('CREATE')) {
      return (
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-green-600"
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
        </div>
      );
    }
    if (action.includes('UPDATE')) {
      return (
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </div>
      );
    }
    if (action.includes('DELETE')) {
      return (
        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
    );
  }

  function formatAction(action: string) {
    return action
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="skeleton h-10 w-64"></div>
          <div className="skeleton h-10 w-32"></div>
        </div>

        {/* Logs Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card-secondary p-4">
              <div className="flex items-start space-x-4">
                <div className="skeleton w-8 h-8 rounded-full"></div>
                <div className="flex-1">
                  <div className="skeleton h-4 w-48 mb-2"></div>
                  <div className="skeleton h-3 w-32 mb-2"></div>
                  <div className="skeleton h-16 w-full"></div>
                </div>
              </div>
            </div>
          ))}
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
        <h2 className="text-h2 text-danger mb-2">Audit Logs Unavailable</h2>
        <p className="text-body mb-4">{error}</p>
        <button onClick={loadLogs} className="btn-primary">
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1">Audit Logs</h1>
          <p className="text-body text-gray-600 mt-1">
            Detailed system activity and user action history
          </p>
        </div>
        <Link href="/logs" className="btn-secondary text-sm" title="Back to Analytics Dashboard">
          ← Analytics
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-secondary p-4 text-center">
          <div className="text-2xl font-bold text-primary mb-1">{logs.length}</div>
          <div className="text-sm text-gray-600">Total Entries</div>
        </div>
        <div className="card-secondary p-4 text-center">
          <div className="text-2xl font-bold text-success mb-1">
            {logs.filter((l) => l.action.includes('AI_')).length}
          </div>
          <div className="text-sm text-gray-600">AI Actions</div>
        </div>
        <div className="card-secondary p-4 text-center">
          <div className="text-2xl font-bold text-warning mb-1">
            {logs.filter((l) => l.action.includes('CREATE')).length}
          </div>
          <div className="text-sm text-gray-600">Items Created</div>
        </div>
        <div className="card-secondary p-4 text-center">
          <div className="text-2xl font-bold text-gray-600 mb-1">
            {new Set(logs.map((l) => l.user?.email || 'System')).size}
          </div>
          <div className="text-sm text-gray-600">Active Users</div>
        </div>
      </div>

      {/* Audit Log Entries */}
      <div className="space-y-4">
        {logs.length === 0 ? (
          <div className="card-secondary p-8 text-center">
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
            <h3 className="text-h3 text-gray-500 mb-2">No Audit Logs</h3>
            <p className="text-sm text-gray-400">
              System activity will appear here as users interact with the platform
            </p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="card-secondary p-4">
              <div className="flex items-start space-x-4">
                {getActionIcon(log.action)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">
                      {formatAction(log.action)}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {log.user && (
                    <p className="text-xs text-gray-600 mb-2">
                      by {log.user.name || log.user.email}
                    </p>
                  )}

                  {/* Details */}
                  <div className="mt-2">
                    <details className="group">
                      <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800 select-none">
                        View Details
                        <span className="ml-1 group-open:rotate-90 transition-transform inline-block">
                          ▶
                        </span>
                      </summary>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-40">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Actions */}
      {logs.length > 0 && (
        <div className="flex justify-center">
          <button className="btn-secondary text-sm">Export Audit Log</button>
        </div>
      )}
    </div>
  );
}
