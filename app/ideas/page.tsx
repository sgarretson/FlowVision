'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Idea {
  id: string;
  title: string;
  description: string;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  category: string;
  priority: string;
  status: string;
  votes: number;
  tags: string[];
  initiative?: {
    id: string;
    title: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export default function IdeasPage() {
  const { data: session } = useSession();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [newIdea, setNewIdea] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
    tags: '',
  });

  const [filters, setFilters] = useState({
    category: '',
    priority: '',
    status: '',
    sortBy: 'newest',
  });

  useEffect(() => {
    fetchIdeas();
  }, [filters]);

  async function fetchIdeas() {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const response = await fetch(`/api/ideas?${params}`);
      if (response.ok) {
        const data = await response.json();
        setIdeas(data);
      }
    } catch (error) {
      console.error('Failed to fetch ideas:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newIdea.title.trim() || !newIdea.description.trim()) return;

    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newIdea,
          tags: newIdea.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        setNewIdea({ title: '', description: '', category: 'general', priority: 'medium', tags: '' });
        setShowForm(false);
        setMessage('Idea submitted successfully!');
        fetchIdeas();
      } else {
        setMessage('Failed to submit idea');
      }
    } catch (error) {
      setMessage('Failed to submit idea');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVote(ideaId: string, type: 'up' | 'down') {
    try {
      const response = await fetch(`/api/ideas/${ideaId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        fetchIdeas(); // Refresh to show updated vote count
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technology': return 'bg-blue-100 text-blue-800';
      case 'process': return 'bg-green-100 text-green-800';
      case 'strategy': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'reviewing': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'implemented': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h1">Innovation Ideas</h1>
            <p className="text-body text-gray-600 mt-2">
              Capture, discuss, and develop strategic ideas from your leadership team
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            {showForm ? 'Cancel' : 'Add New Idea'}
          </button>
        </div>

        {/* Success Message */}
        {message && (
          <div className="card-secondary p-4 border-l-4 border-blue-400 bg-blue-50">
            <p className="text-blue-800">{message}</p>
          </div>
        )}

        {/* New Idea Form */}
        {showForm && (
          <div className="card-primary">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-h2">Submit New Idea</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={newIdea.title}
                  onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                  placeholder="Brief, descriptive title for your idea"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  className="textarea-field"
                  rows={4}
                  value={newIdea.description}
                  onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
                  placeholder="Detailed description of the idea, its benefits, and potential implementation approach"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    className="input-field"
                    value={newIdea.category}
                    onChange={(e) => setNewIdea({ ...newIdea, category: e.target.value })}
                  >
                    <option value="general">General</option>
                    <option value="technology">Technology</option>
                    <option value="process">Process</option>
                    <option value="strategy">Strategy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    className="input-field"
                    value={newIdea.priority}
                    onChange={(e) => setNewIdea({ ...newIdea, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={newIdea.tags}
                  onChange={(e) => setNewIdea({ ...newIdea, tags: e.target.value })}
                  placeholder="innovation, automation, client-experience"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting || !newIdea.title.trim() || !newIdea.description.trim()}
                >
                  {submitting ? 'Submitting...' : 'Submit Idea'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="card-secondary p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              className="input-field"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">All Categories</option>
              <option value="general">General</option>
              <option value="technology">Technology</option>
              <option value="process">Process</option>
              <option value="strategy">Strategy</option>
            </select>

            <select
              className="input-field"
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            >
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              className="input-field"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="idea">New Ideas</option>
              <option value="reviewing">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="implemented">Implemented</option>
            </select>

            <select
              className="input-field"
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="votes">Most Voted</option>
              <option value="priority">High Priority</option>
            </select>
          </div>
        </div>

        {/* Ideas Grid */}
        {ideas.length === 0 ? (
          <div className="card-tertiary p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="text-h3 text-gray-900 mb-2">No Ideas Yet</h3>
            <p className="text-body text-gray-600 mb-6">
              Start capturing innovative ideas from your leadership team.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              Submit First Idea
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ideas.map((idea) => (
              <Link key={idea.id} href={`/ideas/${idea.id}`} className="card-secondary hover:shadow-lg transition-shadow duration-200 block">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(idea.category)}`}>
                        {idea.category}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(idea.priority)}`}>
                        {idea.priority}
                      </span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(idea.status)}`}>
                      {idea.status}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="text-h3 mb-2">{idea.title}</h3>
                  <p className="text-body text-gray-600 mb-4 line-clamp-3">{idea.description}</p>

                  {/* Tags */}
                  {idea.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {idea.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Initiative Link */}
                  {idea.initiative && (
                    <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-600 mb-1">Linked to Initiative:</p>
                      <Link href={`/initiatives/${idea.initiative.id}`} className="text-sm font-medium text-blue-700 hover:text-blue-900">
                        {idea.initiative.title}
                      </Link>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      <div>{idea.author.name || idea.author.email}</div>
                      <div>{new Date(idea.createdAt).toLocaleDateString()}</div>
                    </div>

                    {/* Voting */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleVote(idea.id, 'up')}
                        className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <span>{idea.votes}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}