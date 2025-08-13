'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import TaskDetailModal from './TaskDetailModal';

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
  TODO: {
    label: 'To Do',
    color: 'bg-gray-50/50 border-gray-200/50',
    dotColor: 'bg-gray-400',
    textColor: 'text-gray-700',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'bg-blue-50/50 border-blue-200/50',
    dotColor: 'bg-blue-500',
    textColor: 'text-blue-700',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-green-50/50 border-green-200/50',
    dotColor: 'bg-green-500',
    textColor: 'text-green-700',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-red-50/50 border-red-200/50',
    dotColor: 'bg-red-500',
    textColor: 'text-red-700',
  },
};

const PRIORITY_INDICATORS = {
  high: {
    dotColor: 'bg-red-500',
    bgColor: 'bg-red-50/50',
    borderColor: 'border-red-200',
    label: 'High',
    textColor: 'text-red-700',
  },
  medium: {
    dotColor: 'bg-orange-500',
    bgColor: 'bg-orange-50/50',
    borderColor: 'border-orange-200',
    label: 'Medium',
    textColor: 'text-orange-700',
  },
  low: {
    dotColor: 'bg-green-500',
    bgColor: 'bg-green-50/50',
    borderColor: 'border-green-200',
    label: 'Low',
    textColor: 'text-green-700',
  },
  default: {
    dotColor: 'bg-gray-400',
    bgColor: 'bg-white',
    borderColor: 'border-gray-200',
    label: 'Normal',
    textColor: 'text-gray-700',
  },
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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
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

  const getPriorityIndicator = (priority: number) => {
    if (priority >= 8) return PRIORITY_INDICATORS.high;
    if (priority >= 5) return PRIORITY_INDICATORS.medium;
    if (priority >= 3) return PRIORITY_INDICATORS.low;
    return PRIORITY_INDICATORS.default;
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

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleTaskSave = async (taskData: Partial<Task>) => {
    if (!selectedTask) return;

    try {
      const response = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      await fetchTasks();
      setShowTaskModal(false);
      setSelectedTask(null);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      await fetchTasks();
      setShowTaskModal(false);
      setSelectedTask(null);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete task');
    }
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
                className="btn-secondary text-sm flex items-center gap-2"
              >
                {aiLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 bg-purple-100 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    </div>
                    AI Generate
                  </>
                )}
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
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-gray-300 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-gray-500 rounded"></div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tasks Yet</h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              Break down this solution into specific, actionable tasks to track progress
              effectively.
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
                  <div
                    className={`rounded-xl border ${config.color} backdrop-blur-sm min-h-[500px] shadow-card-subtle`}
                  >
                    <div className="p-4 border-b border-gray-200/50">
                      <h4 className={`font-semibold ${config.textColor} flex items-center gap-3`}>
                        <div className={`w-3 h-3 rounded-full ${config.dotColor}`}></div>
                        {config.label}
                        <span className="bg-white/80 backdrop-blur-sm text-gray-600 px-2.5 py-1 rounded-full text-xs font-medium">
                          {tasksByStatus[status as Task['status']]?.length || 0}
                        </span>
                      </h4>
                    </div>

                    <Droppable droppableId={status}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`p-4 min-h-[400px] ${snapshot.isDraggingOver ? 'bg-blue-50/30 backdrop-blur-sm' : ''}`}
                        >
                          {tasksByStatus[status as Task['status']]?.map((task, index) => {
                            const priorityIndicator = getPriorityIndicator(task.priority);
                            return (
                              <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={(e) => {
                                      // Prevent click when dragging
                                      if (!snapshot.isDragging) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleTaskClick(task);
                                      }
                                    }}
                                    className={`mb-4 card-interactive border ${priorityIndicator.borderColor} ${
                                      snapshot.isDragging
                                        ? 'shadow-card-elevated rotate-2 scale-105'
                                        : ''
                                    } ${priorityIndicator.bgColor}`}
                                  >
                                    <div className="p-4">
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2 mb-2">
                                          <div
                                            className={`w-2 h-2 rounded-full ${priorityIndicator.dotColor}`}
                                          ></div>
                                          <span
                                            className={`text-xs font-medium uppercase tracking-wide ${priorityIndicator.textColor}`}
                                          >
                                            {priorityIndicator.label}
                                          </span>
                                          {task.isAIGenerated && (
                                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                                              AI
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-xs text-gray-500 font-mono">
                                          P{task.priority}
                                        </span>
                                      </div>
                                      <h5 className="font-semibold text-gray-900 text-sm mb-3 line-clamp-2">
                                        {task.title}
                                      </h5>
                                    </div>

                                    {task.description && (
                                      <div className="px-4 pb-3">
                                        <p className="text-xs text-gray-600 line-clamp-2">
                                          {task.description}
                                        </p>
                                      </div>
                                    )}

                                    {task.status === 'IN_PROGRESS' && (
                                      <div className="px-4 pb-3">
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                          <div
                                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                            style={{ width: `${task.progress}%` }}
                                          ></div>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1 text-center">
                                          {task.progress}% complete
                                        </div>
                                      </div>
                                    )}

                                    <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                                      <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-3">
                                          {task.estimatedHours && (
                                            <span className="flex items-center gap-1 text-gray-500">
                                              <div className="w-3 h-3 rounded-full bg-gray-300 flex items-center justify-center">
                                                <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                                              </div>
                                              {task.estimatedHours}h
                                            </span>
                                          )}
                                          {task.assignedTo && (
                                            <span className="flex items-center gap-1.5 text-gray-700">
                                              <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                                              </div>
                                              {task.assignedTo.name.split(' ')[0]}
                                            </span>
                                          )}
                                        </div>
                                        {task.dueDate && (
                                          <span
                                            className={`flex items-center gap-1 ${
                                              isOverdue(task.dueDate)
                                                ? 'text-red-600 font-medium'
                                                : 'text-gray-500'
                                            }`}
                                          >
                                            <div
                                              className={`w-3 h-3 rounded-full flex items-center justify-center ${
                                                isOverdue(task.dueDate)
                                                  ? 'bg-red-100'
                                                  : 'bg-gray-200'
                                              }`}
                                            >
                                              <div
                                                className={`w-1 h-1 rounded-full ${
                                                  isOverdue(task.dueDate)
                                                    ? 'bg-red-600'
                                                    : 'bg-gray-600'
                                                }`}
                                              ></div>
                                            </div>
                                            {formatDate(task.dueDate)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
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

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedTask(null);
        }}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
        task={selectedTask}
      />
    </div>
  );
}
