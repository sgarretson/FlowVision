'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  mentions: string[];
  parentId: string | null;
  replies: Comment[];
  createdAt: string;
}

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
  assignedTo: string | null;
  dueDate: string | null;
  initiative?: {
    id: string;
    title: string;
  } | null;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

export default function IdeaDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: '',
    status: '',
    tags: '',
    assignedTo: '',
    dueDate: '',
  });

  // Comment form state
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchIdea();
      fetchUsers();
    }
  }, [params.id]);

  async function fetchIdea() {
    try {
      const response = await fetch(`/api/ideas/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setIdea(data);
        setEditForm({
          title: data.title,
          description: data.description,
          category: data.category,
          priority: data.priority,
          status: data.status,
          tags: data.tags.join(', '),
          assignedTo: data.assignedTo || '',
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : '',
        });
      } else if (response.status === 404) {
        router.push('/ideas');
      }
    } catch (error) {
      console.error('Failed to fetch idea:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }

  async function handleSave() {
    if (!editForm.title.trim() || !editForm.description.trim()) {
      setMessage('Title and description are required');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetch(`/api/ideas/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          tags: editForm.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
          assignedTo: editForm.assignedTo || null,
          dueDate: editForm.dueDate || null,
        }),
      });

      if (response.ok) {
        setEditing(false);
        setMessage('Idea updated successfully!');
        fetchIdea();
      } else {
        setMessage('Failed to update idea');
      }
    } catch (error) {
      setMessage('Failed to update idea');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    try {
      const response = await fetch(`/api/ideas/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchIdea();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }

  async function handleVote(type: 'up' | 'down') {
    try {
      const response = await fetch(`/api/ideas/${params.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        fetchIdea();
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  }

  async function handleCommentSubmit() {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`/api/ideas/${params.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          parentId: replyingTo,
        }),
      });

      if (response.ok) {
        setNewComment('');
        setReplyingTo(null);
        fetchIdea();
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  }

  async function convertToInitiative() {
    if (!idea) return;

    const params = new URLSearchParams({
      fromIdea: 'true',
      title: idea.title,
      problem: `Based on idea: ${idea.description}`,
      ideaId: idea.id,
    });
    router.push(`/initiatives?${params.toString()}`);
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technology':
        return 'bg-blue-100 text-blue-800';
      case 'process':
        return 'bg-green-100 text-green-800';
      case 'strategy':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'reviewing':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'implemented':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.name || user.email : 'Unknown User';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-h1 mb-4">Idea Not Found</h1>
          <Link href="/ideas" className="btn-primary">
            Back to Ideas
          </Link>
        </div>
      </div>
    );
  }

  const canEdit = session?.user?.id === idea.author.id || session?.user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/ideas" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Ideas
          </Link>
          <div className="flex items-center space-x-3">
            {canEdit && (
              <button
                onClick={() => setEditing(!editing)}
                className="btn-secondary"
                disabled={submitting}
              >
                {editing ? 'Cancel' : 'Edit Idea'}
              </button>
            )}
            {idea.status === 'approved' && (
              <button onClick={convertToInitiative} className="btn-primary">
                Convert to Initiative
              </button>
            )}
          </div>
        </div>

        {/* Success Message */}
        {message && (
          <div className="card-secondary p-4 border-l-4 border-blue-400 bg-blue-50">
            <p className="text-blue-800">{message}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Idea Details */}
            <div className="card-primary">
              <div className="p-6">
                {editing ? (
                  /* Edit Form */
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                      <input
                        type="text"
                        className="input-field"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        className="textarea-field"
                        rows={6}
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category
                        </label>
                        <select
                          className="input-field"
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
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
                          value={editForm.priority}
                          onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assigned To
                        </label>
                        <select
                          className="input-field"
                          value={editForm.assignedTo}
                          onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
                        >
                          <option value="">Unassigned</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name || user.email}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Due Date
                        </label>
                        <input
                          type="date"
                          className="input-field"
                          value={editForm.dueDate}
                          onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        value={editForm.tags}
                        onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                        placeholder="innovation, client-experience, automation"
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setEditing(false)}
                        className="btn-secondary"
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="btn-primary"
                        disabled={
                          submitting || !editForm.title.trim() || !editForm.description.trim()
                        }
                      >
                        {submitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-h1 mb-4">{idea.title}</h1>
                      <div className="prose prose-gray max-w-none">
                        <p className="text-body whitespace-pre-wrap">{idea.description}</p>
                      </div>
                    </div>

                    {/* Tags */}
                    {idea.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {idea.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Initiative Link */}
                    {idea.initiative && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-600 mb-2">Converted to Initiative:</p>
                        <Link
                          href={`/initiatives/${idea.initiative.id}`}
                          className="text-lg font-medium text-blue-700 hover:text-blue-900"
                        >
                          {idea.initiative.title}
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="card-secondary">
              <div className="p-6">
                <h3 className="text-h3 mb-6">Discussion</h3>

                {/* Add Comment */}
                <div className="mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {session?.user?.name?.[0] || session?.user?.email?.[0] || 'U'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <textarea
                        className="textarea-field"
                        rows={3}
                        placeholder={replyingTo ? 'Write a reply...' : 'Add a comment...'}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <div className="flex justify-between items-center mt-3">
                        {replyingTo && (
                          <button
                            onClick={() => setReplyingTo(null)}
                            className="text-sm text-gray-500 hover:text-gray-700"
                          >
                            Cancel Reply
                          </button>
                        )}
                        <button
                          onClick={handleCommentSubmit}
                          className="btn-primary ml-auto"
                          disabled={!newComment.trim()}
                        >
                          {replyingTo ? 'Reply' : 'Comment'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {idea.comments
                    .filter((c) => !c.parentId)
                    .map((comment) => (
                      <div key={comment.id} className="space-y-3">
                        {/* Main Comment */}
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {comment.author.name?.[0] || comment.author.email[0]}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">
                                  {comment.author.name || comment.author.email}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-900">{comment.content}</p>
                            </div>
                            <button
                              onClick={() => setReplyingTo(comment.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                            >
                              Reply
                            </button>
                          </div>
                        </div>

                        {/* Replies */}
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="ml-11 flex items-start space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-700">
                                {reply.author.name?.[0] || reply.author.email[0]}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-sm">
                                    {reply.author.name || reply.author.email}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(reply.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-900">{reply.content}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}

                  {idea.comments.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No comments yet. Start the discussion!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Status & Actions */}
            <div className="card-secondary p-6">
              <h3 className="text-h3 mb-4">Status & Actions</h3>

              {/* Current Status */}
              <div className="mb-4">
                <span
                  className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(idea.status)}`}
                >
                  {idea.status.charAt(0).toUpperCase() + idea.status.slice(1)}
                </span>
              </div>

              {/* Status Change Buttons */}
              {canEdit && (
                <div className="space-y-2 mb-6">
                  {idea.status === 'idea' && (
                    <button
                      onClick={() => handleStatusChange('reviewing')}
                      className="w-full btn-secondary text-sm"
                    >
                      Send for Review
                    </button>
                  )}
                  {idea.status === 'reviewing' && (
                    <>
                      <button
                        onClick={() => handleStatusChange('approved')}
                        className="w-full btn-success text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusChange('rejected')}
                        className="w-full btn-danger text-sm"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Voting */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Community Support</span>
                  <span className="text-lg font-bold text-gray-900">{idea.votes}</span>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => handleVote('up')} className="flex-1 btn-secondary text-sm">
                    👍 Support
                  </button>
                  <button
                    onClick={() => handleVote('down')}
                    className="flex-1 btn-secondary text-sm"
                  >
                    👎 Oppose
                  </button>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="card-secondary p-6">
              <h3 className="text-h3 mb-4">Details</h3>

              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Category</span>
                  <div className="mt-1">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(idea.category)}`}
                    >
                      {idea.category}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-500">Priority</span>
                  <div className="mt-1">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(idea.priority)}`}
                    >
                      {idea.priority}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-500">Author</span>
                  <p className="text-sm text-gray-900 mt-1">
                    {idea.author.name || idea.author.email}
                  </p>
                </div>

                {idea.assignedTo && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Assigned To</span>
                    <p className="text-sm text-gray-900 mt-1">{getUserName(idea.assignedTo)}</p>
                  </div>
                )}

                {idea.dueDate && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Due Date</span>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date(idea.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-sm font-medium text-gray-500">Created</span>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(idea.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-500">Last Updated</span>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(idea.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
