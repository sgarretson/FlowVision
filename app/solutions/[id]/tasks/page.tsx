'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import TasksBoard from '@/components/TasksBoard';

interface Solution {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  initiative: {
    id: string;
    title: string;
  };
}

export default function SolutionTasksPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [solution, setSolution] = useState<Solution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!session) {
      router.push('/auth');
      return;
    }
    fetchSolution();
  }, [session, router, params.id]);

  const fetchSolution = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/solutions/${params.id}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Solution not found');
        } else {
          throw new Error('Failed to fetch solution');
        }
        return;
      }

      const data = await response.json();
      setSolution(data.solution);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTasksWithAI = async () => {
    setAiLoading(true);
    try {
      const response = await fetch(`/api/ai/solutions/${params.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solutionId: params.id,
          context: solution?.description || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate tasks with AI');
      }

      // Refresh the tasks board after AI generation
      window.location.reload();
    } catch (err) {
      console.error('AI task generation error:', err);
      // You might want to show a toast notification here
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-12">
          <div className="text-red-600 text-4xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex items-center justify-center gap-4">
            <button onClick={fetchSolution} className="btn-primary">
              Try Again
            </button>
            <Link href="/initiatives" className="btn-secondary">
              Back to Initiatives
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!solution) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Solution Not Found</h1>
          <p className="text-gray-600 mb-6">
            The solution you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link href="/initiatives" className="btn-primary">
            Back to Initiatives
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500">
        <Link href="/initiatives" className="hover:text-gray-700">
          Initiatives
        </Link>
        <span>›</span>
        <Link href={`/initiatives/${solution.initiative.id}`} className="hover:text-gray-700">
          {solution.initiative.title}
        </Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">{solution.title} - Tasks</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{solution.title}</h1>
            <p className="text-gray-600 mb-4">{solution.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {solution.type}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {solution.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/initiatives/${solution.initiative.id}`} className="btn-secondary">
              ← Back to Initiative
            </Link>
          </div>
        </div>
      </div>

      {/* Tasks Board */}
      <TasksBoard
        solutionId={params.id}
        solutionTitle={solution.title}
        onGenerateWithAI={handleGenerateTasksWithAI}
        aiLoading={aiLoading}
      />
    </div>
  );
}
