'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function TestAPIPage() {
  const { data: session } = useSession();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testInitiativesList = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/initiatives');
      const data = await res.json();
      setResults({
        endpoint: '/api/initiatives',
        status: res.status,
        data: data,
      });
    } catch (error) {
      setResults({
        endpoint: '/api/initiatives',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  const testSpecificInitiative = async () => {
    setLoading(true);
    try {
      const testId = 'cmebjyqr9001qcbz50s1cikt4';
      const res = await fetch(`/api/initiatives/${testId}?include=addressedIssues`);
      const data = await res.json();
      setResults({
        endpoint: `/api/initiatives/${testId}`,
        status: res.status,
        data: data,
      });
    } catch (error) {
      setResults({
        endpoint: '/api/initiatives/[id]',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">API Test Page</h1>

      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Session Status</h2>
        {session ? (
          <div>
            <p>✅ Logged in as: {session.user?.email}</p>
            <p>Role: {(session.user as any)?.role}</p>
          </div>
        ) : (
          <p>❌ Not logged in</p>
        )}
      </div>

      <div className="space-y-4 mb-6">
        <button
          onClick={testInitiativesList}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test /api/initiatives'}
        </button>

        <button
          onClick={testSpecificInitiative}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-4"
        >
          {loading ? 'Testing...' : 'Test /api/initiatives/[id]'}
        </button>
      </div>

      {results && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">API Test Results</h3>
          <div className="space-y-2">
            <p>
              <strong>Endpoint:</strong> {results.endpoint}
            </p>
            {results.status && (
              <p>
                <strong>Status:</strong> {results.status}
              </p>
            )}
            {results.error && (
              <p className="text-red-600">
                <strong>Error:</strong> {results.error}
              </p>
            )}
            {results.data && (
              <div>
                <p>
                  <strong>Data:</strong>
                </p>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(results.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
