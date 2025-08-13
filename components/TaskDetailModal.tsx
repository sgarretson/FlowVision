'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: number;
  progress: number;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
  completedAt?: string;
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
  createdAt: string;
  updatedAt: string;
}

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (taskData: Partial<Task>) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
  task?: Task | null;
  isReadOnly?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'To Do', color: 'bg-gray-100' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-green-100' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100' },
];

const PRIORITY_LABELS = {
  1: 'Lowest',
  2: 'Very Low',
  3: 'Low',
  4: 'Low-Medium',
  5: 'Medium',
  6: 'Medium-High',
  7: 'High',
  8: 'Very High',
  9: 'Highest',
  10: 'Critical',
};

export default function TaskDetailModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  task,
  isReadOnly = false,
}: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    status: Task['status'];
    priority: number;
    progress: number;
    estimatedHours: string;
    actualHours: string;
    dueDate: string;
    assignedToId: string;
    tags: string;
    notes: string;
  }>({
    title: '',
    description: '',
    status: 'TODO',
    priority: 5,
    progress: 0,
    estimatedHours: '',
    actualHours: '',
    dueDate: '',
    assignedToId: '',
    tags: '',
    notes: '',
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        progress: task.progress,
        estimatedHours: task.estimatedHours?.toString() || '',
        actualHours: task.actualHours?.toString() || '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        assignedToId: task.assignedTo?.id || '',
        tags: task.tags.join(', ') || '',
        notes: task.notes || '',
      });
    }
  }, [task]);

  useEffect(() => {
    if (isOpen && !isReadOnly) {
      loadUsers();
    }
  }, [isOpen, isReadOnly]);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleSave = async () => {
    if (!onSave || !task) return;

    setSaving(true);
    setError(null);

    try {
      const updateData: Partial<Task> = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        progress: formData.progress,
        estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : undefined,
        actualHours: formData.actualHours ? parseInt(formData.actualHours) : undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        tags: formData.tags
          ? formData.tags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
        notes: formData.notes,
      };

      await onSave(updateData);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !task) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this task? This action cannot be undone.'
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    try {
      await onDelete(task.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'text-red-600 bg-red-50';
    if (priority >= 6) return 'text-orange-600 bg-orange-50';
    if (priority >= 4) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className="w-full max-w-4xl bg-white rounded-xl shadow-card-elevated max-h-[90vh] overflow-hidden animate-scale-in border border-white/20"
          style={{
            backdropFilter: 'blur(10px)',
            background: 'rgba(255, 255, 255, 0.98)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                Task Details
              </Dialog.Title>
              {task.isAIGenerated && (
                <span className="px-3 py-1.5 bg-purple-100 text-purple-800 text-xs font-medium rounded-full border border-purple-200 flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  AI Generated
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!isReadOnly && !isEditing && (
                <button onClick={() => setIsEditing(true)} className="btn-secondary text-sm">
                  Edit Task
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <h2 className="text-lg font-semibold text-gray-900">{task.title}</h2>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Task description..."
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {task.description || 'No description provided.'}
                    </p>
                  )}
                </div>

                {/* Progress (if in progress) */}
                {(task.status === 'IN_PROGRESS' || isEditing) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Progress ({isEditing ? formData.progress : task.progress}%)
                    </label>
                    {isEditing ? (
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.progress}
                        onChange={(e) => handleChange('progress', parseInt(e.target.value))}
                        className="w-full"
                      />
                    ) : (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  {isEditing ? (
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Additional notes..."
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {task.notes || 'No notes added.'}
                    </p>
                  )}
                </div>

                {/* AI Information */}
                {task.isAIGenerated && task.aiReasoning && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">AI Reasoning</h4>
                    <p className="text-purple-800 text-sm">{task.aiReasoning}</p>
                    {task.aiConfidence && (
                      <p className="text-purple-600 text-xs mt-2">
                        Confidence: {(task.aiConfidence * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  {isEditing ? (
                    <select
                      value={formData.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                        STATUS_OPTIONS.find((s) => s.value === task.status)?.color || 'bg-gray-100'
                      } text-gray-800`}
                    >
                      {STATUS_OPTIONS.find((s) => s.value === task.status)?.label}
                    </span>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  {isEditing ? (
                    <select
                      value={formData.priority}
                      onChange={(e) => handleChange('priority', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {value} - {label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}
                    >
                      P{task.priority} -{' '}
                      {PRIORITY_LABELS[task.priority as keyof typeof PRIORITY_LABELS]}
                    </span>
                  )}
                </div>

                {/* Assigned To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned To
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.assignedToId}
                      onChange={(e) => handleChange('assignedToId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Unassigned</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name || user.email}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-700">
                      {task.assignedTo
                        ? task.assignedTo.name || task.assignedTo.email
                        : 'Unassigned'}
                    </p>
                  )}
                </div>

                {/* Time Tracking */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Hours
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.estimatedHours}
                        onChange={(e) => handleChange('estimatedHours', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    ) : (
                      <p className="text-gray-700">{task.estimatedHours || 'Not set'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Actual Hours
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.actualHours}
                        onChange={(e) => handleChange('actualHours', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    ) : (
                      <p className="text-gray-700">{task.actualHours || 'Not logged'}</p>
                    )}
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => handleChange('dueDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-700">{formatDate(task.dueDate)}</p>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => handleChange('tags', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="tag1, tag2, tag3"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {task.tags.length > 0 ? (
                        task.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No tags</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Timestamps */}
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Created: {formatDate(task.createdAt)}</p>
                  <p>Updated: {formatDate(task.updatedAt)}</p>
                  {task.completedAt && <p>Completed: {formatDate(task.completedAt)}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          {(isEditing || !isReadOnly) && (
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div>
                {!isReadOnly && onDelete && !isEditing && (
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Delete Task'}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving || !formData.title.trim()}
                      className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
