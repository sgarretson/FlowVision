'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Solution {
  id: string;
  title: string;
  description: string;
  type: 'TECHNOLOGY' | 'PROCESS' | 'TRAINING' | 'POLICY';
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: number;
  progress: number;
  estimatedCost?: number;
  estimatedHours?: number;
  actualCost?: number;
  actualHours?: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  tags: string[];
  notes?: string;
  isAIGenerated?: boolean;
  aiConfidence?: number;
  aiReasoning?: string;
  _count?: {
    tasks: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface SolutionsBoardProps {
  initiativeId: string;
  onGenerateWithAI?: () => void;
  aiLoading?: boolean;
}

const STATUS_CONFIG = {
  PLANNED: { label: 'Planned', color: 'bg-gray-100 text-gray-800', icon: '📋' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: '🔄' },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: '✅' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: '❌' },
};

const TYPE_CONFIG = {
  TECHNOLOGY: { label: 'Technology', color: 'bg-purple-100 text-purple-800', icon: '⚙️' },
  PROCESS: { label: 'Process', color: 'bg-orange-100 text-orange-800', icon: '🔄' },
  TRAINING: { label: 'Training', color: 'bg-yellow-100 text-yellow-800', icon: '📚' },
  POLICY: { label: 'Policy', color: 'bg-cyan-100 text-cyan-800', icon: '📜' },
};

export default function SolutionsBoard({
  initiativeId,
  onGenerateWithAI,
  aiLoading = false,
}: SolutionsBoardProps) {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSolution, setNewSolution] = useState({
    title: '',
    description: '',
    type: 'TECHNOLOGY' as const,
    priority: 5,
    estimatedCost: '',
    estimatedHours: '',
  });

  useEffect(() => {
    fetchSolutions();
  }, [initiativeId]);

  const fetchSolutions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/initiatives/${initiativeId}/solutions?includeTasks=true`);

      if (!response.ok) {
        throw new Error('Failed to fetch solutions');
      }

      const data = await response.json();
      setSolutions(data.solutions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSolution = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/initiatives/${initiativeId}/solutions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSolution,
          estimatedCost: newSolution.estimatedCost
            ? parseFloat(newSolution.estimatedCost)
            : undefined,
          estimatedHours: newSolution.estimatedHours
            ? parseInt(newSolution.estimatedHours)
            : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create solution');
      }

      setNewSolution({
        title: '',
        description: '',
        type: 'TECHNOLOGY',
        priority: 5,
        estimatedCost: '',
        estimatedHours: '',
      });
      setShowCreateForm(false);
      await fetchSolutions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create solution');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-red-600 text-sm">{error}</div>
          <button
            onClick={fetchSolutions}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Solutions & Implementation</h3>
            <p className="text-sm text-gray-600 mt-1">
              Detailed approaches and tasks to execute this initiative
            </p>
          </div>
          <div className="flex items-center gap-3">
            {onGenerateWithAI && (
              <button
                onClick={onGenerateWithAI}
                disabled={aiLoading}
                className="btn-secondary text-sm"
              >
                {aiLoading ? 'Generating...' : '✨ AI Generate'}
              </button>
            )}
            <button onClick={() => setShowCreateForm(true)} className="btn-primary text-sm">
              + Add Solution
            </button>
          </div>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <form onSubmit={handleCreateSolution} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Solution Title
                </label>
                <input
                  type="text"
                  value={newSolution.title}
                  onChange={(e) => setNewSolution({ ...newSolution, title: e.target.value })}
                  className="input-field"
                  placeholder="Enter solution title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newSolution.type}
                  onChange={(e) => setNewSolution({ ...newSolution, type: e.target.value as any })}
                  className="input-field"
                >
                  {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.icon} {config.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newSolution.description}
                onChange={(e) => setNewSolution({ ...newSolution, description: e.target.value })}
                className="input-field"
                rows={3}
                placeholder="Describe the solution approach"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newSolution.priority}
                  onChange={(e) =>
                    setNewSolution({ ...newSolution, priority: parseInt(e.target.value) })
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Cost ($)
                </label>
                <input
                  type="number"
                  value={newSolution.estimatedCost}
                  onChange={(e) =>
                    setNewSolution({ ...newSolution, estimatedCost: e.target.value })
                  }
                  className="input-field"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  value={newSolution.estimatedHours}
                  onChange={(e) =>
                    setNewSolution({ ...newSolution, estimatedHours: e.target.value })
                  }
                  className="input-field"
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" className="btn-primary text-sm">
                Create Solution
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Solutions List */}
      <div className="p-6">
        {solutions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-3">🔧</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Solutions Yet</h3>
            <p className="text-gray-600 mb-4">
              Create implementation solutions to break down this initiative into actionable
              approaches.
            </p>
            <button onClick={() => setShowCreateForm(true)} className="btn-primary text-sm">
              Create First Solution
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {solutions.map((solution) => (
              <div
                key={solution.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">{solution.title}</h4>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${TYPE_CONFIG[solution.type].color}`}
                      >
                        {TYPE_CONFIG[solution.type].icon} {TYPE_CONFIG[solution.type].label}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[solution.status].color}`}
                      >
                        {STATUS_CONFIG[solution.status].icon} {STATUS_CONFIG[solution.status].label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{solution.description}</p>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${solution.progress}%` }}
                      ></div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Priority: {solution.priority}/10</span>
                      {solution.estimatedCost && (
                        <span>Cost: {formatCurrency(solution.estimatedCost)}</span>
                      )}
                      {solution.estimatedHours && <span>Hours: {solution.estimatedHours}h</span>}
                      {solution._count?.tasks && <span>Tasks: {solution._count.tasks}</span>}
                      {solution.assignedTo && <span>Assigned: {solution.assignedTo.name}</span>}
                      {solution.isAIGenerated && solution.aiConfidence && (
                        <span className="text-purple-600">
                          🤖 AI Generated ({solution.aiConfidence}% confidence)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      href={`/solutions/${solution.id}/tasks`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Tasks →
                    </Link>
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
