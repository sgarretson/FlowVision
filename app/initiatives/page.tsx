'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';

export default function InitiativesPage() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [problem, setProblem] = useState('');
  const [goal, setGoal] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);

  async function load() {
    const res = await fetch('/api/initiatives');
    const data = await res.json();
    setItems(data);
  }

  useEffect(() => {
    load();

    // Check for pre-filled data from issues
    const fromIssue = searchParams.get('fromIssue');
    const prefilledTitle = searchParams.get('title');
    const prefilledProblem = searchParams.get('problem');

    if (fromIssue === 'true') {
      if (prefilledTitle) setTitle(prefilledTitle);
      if (prefilledProblem) setProblem(prefilledProblem);
      setMessage('Initiative pre-filled from issue. Add goal and KPIs to complete.');
    }
  }, [searchParams]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/initiatives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, problem, goal, kpis: [] }),
    });
    setTitle('');
    setProblem('');
    setGoal('');
    setMessage(null);
    setAiRecommendations(null);
    setShowAiPanel(false);
    await load();
  }

  async function generateAIRecommendations() {
    if (!title.trim() || !problem.trim()) {
      setMessage('Please fill in title and problem first to get AI recommendations');
      return;
    }

    setAiLoading(true);
    setAiRecommendations(null);

    try {
      const response = await fetch('/api/ai/generate-initiative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          problem: problem.trim(),
          mode: 'recommendations',
        }),
      });

      const data = await response.json();

      if (response.ok && data.result) {
        setAiRecommendations(
          data.result.recommendations || 'No specific recommendations generated'
        );
        setShowAiPanel(true);

        // Auto-populate fields if AI provides them
        if (data.result.suggestedKPIs?.length > 0) {
          // We'll implement KPI suggestions in the detail page
        }
      } else {
        setMessage(data.fallback || data.error || 'AI recommendations not available');
      }
    } catch (error) {
      setMessage('Failed to generate AI recommendations');
    } finally {
      setAiLoading(false);
    }
  }

  async function generateFromDescription() {
    if (!problem.trim()) {
      setMessage('Please provide a description to generate requirements');
      return;
    }

    setAiLoading(true);

    try {
      const response = await fetch('/api/ai/generate-initiative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: problem.trim(),
          mode: 'requirements',
        }),
      });

      const data = await response.json();

      if (response.ok && data.result) {
        if (data.result.title) setTitle(data.result.title);
        if (data.result.goal) setGoal(data.result.goal);
        setMessage('Initiative fields generated from description!');
      } else {
        setMessage(data.fallback || data.error || 'AI generation not available');
      }
    } catch (error) {
      setMessage('Failed to generate initiative requirements');
    } finally {
      setAiLoading(false);
    }
  }

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const newItems = Array.from(items);
    const [removed] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, removed);
    setItems(newItems);
    fetch('/api/initiatives/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: newItems.map((i) => i.id) }),
    });
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h1 className="text-h1 mb-4">Initiatives</h1>
        <p className="text-body max-w-2xl mx-auto">
          Create and manage strategic initiatives. Drag to reorder by priority, or click to view
          details.
        </p>
      </div>

      {message && (
        <div className="max-w-2xl mx-auto">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-center">
            {message}
          </div>
        </div>
      )}

      {/* Create Initiative Form */}
      <div className="card-primary p-6 max-w-4xl mx-auto">
        <h2 className="text-h2 mb-6 text-center">Create New Initiative</h2>

        {/* AI Tools */}
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="text-h3 mb-3 text-purple-800">AI-Powered Tools</h3>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={generateFromDescription}
              disabled={aiLoading || !problem.trim()}
              className="btn-secondary text-sm"
            >
              {aiLoading ? 'Generating...' : '✨ Generate from Description'}
            </button>
            <button
              type="button"
              onClick={generateAIRecommendations}
              disabled={aiLoading || !title.trim() || !problem.trim()}
              className="btn-secondary text-sm"
            >
              {aiLoading ? 'Loading...' : '🤖 Get AI Recommendations'}
            </button>
          </div>
          <p className="text-sm text-purple-600 mt-2">
            Fill in the problem statement to generate requirements, or add title + problem for AI
            recommendations
          </p>
        </div>

        <form onSubmit={onCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              className="input-field"
              placeholder="Initiative Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <input
              className="input-field"
              placeholder="Problem Statement"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              required
            />
            <input
              className="input-field"
              placeholder="Goal/Outcome"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-center">
            <button className="btn-primary" type="submit">
              Create Initiative
            </button>
          </div>
        </form>

        {/* AI Recommendations Panel */}
        {showAiPanel && aiRecommendations && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-h3 text-blue-800">AI Recommendations</h3>
              <button
                onClick={() => setShowAiPanel(false)}
                className="text-blue-600 hover:text-blue-800"
              >
                ✕
              </button>
            </div>
            <div className="text-sm text-blue-700 whitespace-pre-wrap">{aiRecommendations}</div>
          </div>
        )}
      </div>
      {/* Initiatives List */}
      <div className="max-w-4xl mx-auto">
        {items.length === 0 ? (
          <div className="card-tertiary p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-h3 mb-2">No Initiatives Yet</h3>
            <p className="text-caption">Create your first initiative above to get started!</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-h2">Your Initiatives</h2>
              <div className="text-caption">Drag to reorder • {items.length} total</div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="initiatives">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                    {items.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(prov, snapshot) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            className={`card-secondary p-6 transition-all duration-200 ${
                              snapshot.isDragging
                                ? 'rotate-2 shadow-card-primary'
                                : 'hover:shadow-card-secondary'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              {/* Drag Handle */}
                              <div
                                {...prov.dragHandleProps}
                                className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 8h16M4 16h16"
                                  />
                                </svg>
                              </div>

                              {/* Content */}
                              <div className="flex-1">
                                <Link href={`/initiatives/${item.id}`} className="block group">
                                  <h3 className="text-h3 group-hover:text-primary transition-colors mb-2">
                                    {item.title}
                                  </h3>
                                  <p className="text-body mb-3 line-clamp-2">{item.problem}</p>

                                  {/* Scores */}
                                  <div className="flex items-center gap-4 text-caption">
                                    <span className="flex items-center gap-1">
                                      <span className="font-medium">Priority:</span>
                                      <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          (item.priorityScore ?? 0) >= 70
                                            ? 'bg-green-100 text-green-800'
                                            : (item.priorityScore ?? 0) >= 40
                                              ? 'bg-yellow-100 text-yellow-800'
                                              : 'bg-red-100 text-red-800'
                                        }`}
                                      >
                                        {item.priorityScore ?? 0}
                                      </span>
                                    </span>
                                    <span>Difficulty: {item.difficulty ?? 0}</span>
                                    <span>ROI: {item.roi ?? 0}</span>
                                  </div>
                                </Link>
                              </div>

                              {/* Status Badge */}
                              <div
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  item.status === 'Done'
                                    ? 'bg-green-100 text-green-800'
                                    : item.status === 'In Progress'
                                      ? 'bg-blue-100 text-blue-800'
                                      : item.status === 'Prioritize'
                                        ? 'bg-orange-100 text-orange-800'
                                        : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {item.status}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}
      </div>
    </div>
  );
}
