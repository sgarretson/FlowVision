'use client';

import React from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body className="min-h-screen bg-red-50 text-red-800">
        <div className="mx-auto max-w-2xl p-6">
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <pre className="bg-white border rounded p-3 overflow-auto text-xs">{error.message}</pre>
          <button className="mt-4 px-3 py-2 rounded bg-primary text-white" onClick={() => reset()}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
