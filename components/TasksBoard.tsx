'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

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

interface TasksBoardProps {
  solutionId: string;
  solutionTitle?: string;
  onGenerateWithAI?: () => void;
  aiLoading?: boolean;
}

const STATUS_COLUMNS = {
  TODO: { label: 'To Do', color: 'bg-gray-50 border-gray-200', icon: '📋' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-50 border-blue-200', icon: '🔄' },
  COMPLETED: { label: 'Completed', color: 'bg-green-50 border-green-200', icon: '✅' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-50 border-red-200', icon: '❌' },
};

const PRIORITY_COLORS = {
  high: 'border-l-red-500 bg-red-50',
  medium: 'border-l-yellow-500 bg-yellow-50',
  low: 'border-l-green-500 bg-green-50',
  default: 'border-l-gray-300 bg-white',
};

export default function TasksBoard({
  solutionId,
  solutionTitle,
  onGenerateWithAI,
  aiLoading = false,
}: TasksBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 5,
    estimatedHours: '',
    dueDate: '',
  });

  useEffect(() => {
    fetchTasks();
  }, [solutionId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/solutions/${solutionId}/tasks`);

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/solutions/${solutionId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          estimatedHours: newTask.estimatedHours ? parseInt(newTask.estimatedHours) : undefined,
          dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      setNewTask({
        title: '',
        description: '',
        priority: 5,
        estimatedHours: '',
        dueDate: '',
      });
      setShowCreateForm(false);
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index)
      return;

    const newStatus = destination.droppableId as Task['status'];

    try {
      const response = await fetch(`/api/tasks/${draggableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return PRIORITY_COLORS.high;
    if (priority >= 5) return PRIORITY_COLORS.medium;
    if (priority >= 3) return PRIORITY_COLORS.low;
    return PRIORITY_COLORS.default;
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                {[1, 2].map((j) => (
                  <div key={j} className="h-20 bg-gray-100 rounded"></div>
                ))}
              </div>
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
          <button onClick={fetchTasks} className="mt-2 text-blue-600 hover:text-blue-800 text-sm">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const tasksByStatus = Object.keys(STATUS_COLUMNS).reduce(
    (acc, status) => {
      acc[status as Task['status']] = tasks.filter((task) => task.status === status);
      return acc;
    },
    {} as Record<Task['status'], Task[]>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
            {solutionTitle && (
              <p className="text-sm text-gray-600 mt-1">
                Implementation tasks for: {solutionTitle}
              </p>
            )}
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
              + Add Task
            </button>
          </div>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="input-field"
                  placeholder="Enter task title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: parseInt(e.target.value) })}
                  className="input-field"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="input-field"
                rows={2}
                placeholder="Describe the task"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  value={newTask.estimatedHours}
                  onChange={(e) => setNewTask({ ...newTask, estimatedHours: e.target.value })}
                  className="input-field"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" className="btn-primary text-sm">
                Create Task
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

      {/* Kanban Board */}
      <div className="p-6">
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-3">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks Yet</h3>
            <p className="text-gray-600 mb-4">
              Break down this solution into specific, actionable tasks.
            </p>
            <button onClick={() => setShowCreateForm(true)} className="btn-primary text-sm">
              Create First Task
            </button>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {Object.entries(STATUS_COLUMNS).map(([status, config]) => (
                <div key={status} className="flex flex-col">
                  <div className={`rounded-lg border-2 ${config.color} min-h-[400px]`}>
                    <div className="p-3 border-b border-gray-200">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <span>{config.icon}</span>
                        {config.label}
                        <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
                          {tasksByStatus[status as Task['status']]?.length || 0}
                        </span>
                      </h4>
                    </div>

                    <Droppable droppableId={status}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`p-3 min-h-[350px] ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
                        >
                          {tasksByStatus[status as Task['status']]?.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`mb-3 p-3 rounded-lg border-l-4 shadow-sm cursor-grab ${
                                    snapshot.isDragging ? 'shadow-lg rotate-2' : 'hover:shadow-md'
                                  } ${getPriorityColor(task.priority)}`}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <h5 className="font-medium text-gray-900 text-sm">
                                      {task.title}
                                    </h5>
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-gray-500">
                                        P{task.priority}
                                      </span>
                                      {task.isAIGenerated && (
                                        <span className="text-purple-600 text-xs">🤖</span>
                                      )}
                                    </div>
                                  </div>

                                  {task.description && (
                                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}

                                  {task.status === 'IN_PROGRESS' && (
                                    <div className="w-full bg-gray-200 rounded-full h-1 mb-2">
                                      <div
                                        className="bg-blue-600 h-1 rounded-full"
                                        style={{ width: `${task.progress}%` }}
                                      ></div>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center gap-2">
                                      {task.estimatedHours && (
                                        <span>🕒 {task.estimatedHours}h</span>
                                      )}
                                      {task.assignedTo && (
                                        <span>👤 {task.assignedTo.name.split(' ')[0]}</span>
                                      )}
                                    </div>
                                    {task.dueDate && (
                                      <span
                                        className={
                                          isOverdue(task.dueDate) ? 'text-red-600 font-medium' : ''
                                        }
                                      >
                                        📅 {formatDate(task.dueDate)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                </div>
              ))}
            </div>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}
