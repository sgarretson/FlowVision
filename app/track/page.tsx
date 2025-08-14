'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import {
  ChartBarIcon,
  ClockIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

// Enhanced types based on our database schema
interface InitiativeWithDetails {
  id: string;
  title: string;
  status: string;
  progress: number;
  phase: string;
  type: string;
  priorityScore: number;
  timelineStart: string | null;
  timelineEnd: string | null;
  budget: number | null;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  assignments: Array<{
    team: {
      id: string;
      name: string;
      department: string;
    };
    role: string;
    hoursAllocated: number;
  }>;
  solutions: Array<{
    id: string;
    title: string;
    description: string;
    type: 'TECHNOLOGY' | 'PROCESS' | 'TRAINING' | 'POLICY';
    status: 'DRAFT' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    priority: number;
    estimatedHours: number | null;
    actualHours: number | null;
    assignedTo: {
      id: string;
      name: string | null;
      email: string;
    } | null;
    tasks: Array<{
      id: string;
      title: string;
      description: string | null;
      status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
      priority: number;
      estimatedHours: number | null;
      actualHours: number | null;
      progress: number;
      assignedTo: {
        id: string;
        name: string | null;
        email: string;
      } | null;
    }>;
  }>;
  milestones: Array<{
    id: string;
    title: string;
    dueDate: string;
    status: string;
    progress: number;
  }>;
}

interface ViewMode {
  type: 'kanban' | 'progress' | 'timeline' | 'resource';
  label: string;
  icon: React.ElementType;
}

const VIEW_MODES: ViewMode[] = [
  { type: 'kanban', label: 'Kanban Board', icon: ChartBarIcon },
  { type: 'progress', label: 'Progress Dashboard', icon: ArrowTrendingUpIcon },
  { type: 'timeline', label: 'Timeline View', icon: ClockIcon },
  { type: 'resource', label: 'Resource Allocation', icon: UsersIcon },
];

const columns = ['Planning', 'In Progress', 'Review', 'Done'] as const;

// Map database status values to kanban columns
function mapStatusToColumn(dbStatus: string): (typeof columns)[number] {
  switch (dbStatus?.toUpperCase()) {
    case 'DRAFT':
    case 'PLANNING':
    case 'DEFINE':
      return 'Planning';
    case 'ACTIVE':
    case 'IN_PROGRESS':
    case 'EXECUTING':
    case 'RUNNING':
      return 'In Progress';
    case 'REVIEW':
    case 'TESTING':
    case 'PENDING':
      return 'Review';
    case 'COMPLETED':
    case 'DONE':
    case 'FINISHED':
      return 'Done';
    default:
      return 'Planning';
  }
}

// Map kanban column back to database status
function mapColumnToStatus(column: (typeof columns)[number]): string {
  switch (column) {
    case 'Planning':
      return 'PLANNING';
    case 'In Progress':
      return 'ACTIVE';
    case 'Review':
      return 'REVIEW';
    case 'Done':
      return 'COMPLETED';
    default:
      return 'PLANNING';
  }
}

// Get priority indicator styling
function getPriorityIndicator(priority: number) {
  if (priority >= 80)
    return { bg: 'bg-red-100', border: 'border-red-200', text: 'text-red-800', dot: 'bg-red-500' };
  if (priority >= 60)
    return {
      bg: 'bg-orange-100',
      border: 'border-orange-200',
      text: 'text-orange-800',
      dot: 'bg-orange-500',
    };
  if (priority >= 40)
    return {
      bg: 'bg-yellow-100',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      dot: 'bg-yellow-500',
    };
  return {
    bg: 'bg-green-100',
    border: 'border-green-200',
    text: 'text-green-800',
    dot: 'bg-green-500',
  };
}

// Get solution type icon
function getSolutionTypeIcon(type: string) {
  switch (type) {
    case 'TECHNOLOGY':
      return '⚙️';
    case 'PROCESS':
      return '🔄';
    case 'TRAINING':
      return '📚';
    case 'POLICY':
      return '📋';
    default:
      return '📁';
  }
}

export default function TrackPage() {
  const [initiatives, setInitiatives] = useState<InitiativeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode['type']>('kanban');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Calculate overall metrics
  const metrics = useMemo(() => {
    const totalInitiatives = initiatives.length;
    const completedInitiatives = initiatives.filter((i) => i.status === 'COMPLETED').length;
    const totalSolutions = initiatives.reduce((sum, i) => sum + (i.solutions?.length || 0), 0);
    const completedSolutions = initiatives.reduce(
      (sum, i) => sum + (i.solutions?.filter((s) => s.status === 'COMPLETED').length || 0),
      0
    );
    const totalTasks = initiatives.reduce(
      (sum, i) =>
        sum + (i.solutions?.reduce((taskSum, s) => taskSum + (s.tasks?.length || 0), 0) || 0),
      0
    );
    const completedTasks = initiatives.reduce(
      (sum, i) =>
        sum +
        (i.solutions?.reduce(
          (taskSum, s) => taskSum + (s.tasks?.filter((t) => t.status === 'COMPLETED').length || 0),
          0
        ) || 0),
      0
    );

    const averageProgress =
      totalInitiatives > 0
        ? Math.round(initiatives.reduce((sum, i) => sum + i.progress, 0) / totalInitiatives)
        : 0;

    const atRiskInitiatives = initiatives.filter((i) => {
      if (!i.timelineEnd) return false;
      const endDate = new Date(i.timelineEnd);
      const today = new Date();
      const daysUntilDue = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 7 && i.progress < 90;
    }).length;

    return {
      totalInitiatives,
      completedInitiatives,
      totalSolutions,
      completedSolutions,
      totalTasks,
      completedTasks,
      averageProgress,
      atRiskInitiatives,
      completionRate:
        totalInitiatives > 0 ? Math.round((completedInitiatives / totalInitiatives) * 100) : 0,
      solutionCompletionRate:
        totalSolutions > 0 ? Math.round((completedSolutions / totalSolutions) * 100) : 0,
      taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }, [initiatives]);

  async function loadInitiatives() {
    try {
      setLoading(true);
      const response = await fetch(
        '/api/initiatives?include=solutions,tasks,assignments,milestones'
      );
      const data = await response.json();
      setInitiatives(data || []);
    } catch (error) {
      console.error('Failed to load initiatives:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInitiatives();
  }, []);

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;

    const destCol = result.destination.droppableId as (typeof columns)[number];
    const initiativeId = result.draggableId;

    // Update local state optimistically
    setInitiatives((prev) =>
      prev.map((initiative) =>
        initiative.id === initiativeId
          ? { ...initiative, status: mapColumnToStatus(destCol) }
          : initiative
      )
    );

    // Update database
    const dbStatus = mapColumnToStatus(destCol);
    fetch('/api/track/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: initiativeId, status: dbStatus }),
    }).catch((error) => {
      console.error('Failed to update status:', error);
      // Revert on error
      loadInitiatives();
    });
  }

  function toggleCardExpansion(initiativeId: string) {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(initiativeId)) {
        newSet.delete(initiativeId);
      } else {
        newSet.add(initiativeId);
      }
      return newSet;
    });
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="text-center">
        <h1 className="text-h1 mb-4">Execute & Track</h1>
        <p className="text-body max-w-3xl mx-auto">
          Comprehensive execution management with solution and task tracking. Monitor initiative
          progress, manage resources, and track deliverables in real-time.
        </p>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="metric-card bg-blue-50 border-blue-100 hover:shadow-card-standard transition-all duration-200">
          <div className="flex items-center">
            <div className="icon-container mr-3">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{metrics.totalInitiatives}</div>
              <div className="text-body-sm text-blue-700">Active Initiatives</div>
            </div>
          </div>
        </div>

        <div className="metric-card bg-green-50 border-green-100 hover:shadow-card-standard transition-all duration-200">
          <div className="flex items-center">
            <div className="icon-container mr-3">
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{metrics.averageProgress}%</div>
              <div className="text-body-sm text-green-700">Avg Progress</div>
            </div>
          </div>
        </div>

        <div className="metric-card bg-purple-50 border-purple-100 hover:shadow-card-standard transition-all duration-200">
          <div className="flex items-center">
            <div className="icon-container mr-3">
              <BoltIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{metrics.totalTasks}</div>
              <div className="text-body-sm text-purple-700">Active Tasks</div>
            </div>
          </div>
        </div>

        <div className="metric-card bg-orange-50 border-orange-100 hover:shadow-card-standard transition-all duration-200">
          <div className="flex items-center">
            <div className="icon-container mr-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{metrics.atRiskInitiatives}</div>
              <div className="text-body-sm text-orange-700">At Risk</div>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="flex justify-center">
        <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode.type}
              onClick={() => setViewMode(mode.type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === mode.type
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <mode.icon className="h-4 w-4" />
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Enhanced Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <DragDropContext onDragEnd={onDragEnd}>
            {columns.map((col) => (
              <Droppable droppableId={col} key={col}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`card-secondary p-4 min-h-[500px] transition-colors ${
                      snapshot.isDraggingOver ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="font-semibold text-h4 mb-4 text-center border-b border-gray-200 pb-2">
                      {col}
                      <span className="ml-2 text-sm text-gray-500 font-normal">
                        ({initiatives.filter((i) => mapStatusToColumn(i.status) === col).length})
                      </span>
                    </div>

                    <div className="space-y-3">
                      {initiatives
                        .filter((i) => mapStatusToColumn(i.status) === col)
                        .map((initiative, idx) => {
                          const priorityIndicator = getPriorityIndicator(
                            initiative.priorityScore || 0
                          );
                          const isExpanded = expandedCards.has(initiative.id);

                          return (
                            <Draggable draggableId={initiative.id} index={idx} key={initiative.id}>
                              {(prov, dragSnapshot) => (
                                <div
                                  ref={prov.innerRef}
                                  {...prov.draggableProps}
                                  {...prov.dragHandleProps}
                                  className={`card-primary cursor-move transition-all duration-200 ${
                                    dragSnapshot.isDragging
                                      ? 'shadow-lg scale-105 rotate-1'
                                      : 'hover:shadow-md'
                                  }`}
                                >
                                  <div className="p-4">
                                    {/* Initiative Header */}
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                                          {initiative.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mb-2">
                                          <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityIndicator.bg} ${priorityIndicator.border} ${priorityIndicator.text}`}
                                          >
                                            <div
                                              className={`w-2 h-2 rounded-full mr-1 ${priorityIndicator.dot}`}
                                            ></div>
                                            Priority {initiative.priorityScore || 0}
                                          </span>
                                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                            {initiative.type}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-3">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-gray-600">Progress</span>
                                        <span className="text-xs font-medium text-gray-900">
                                          {initiative.progress}%
                                        </span>
                                      </div>
                                      <div className="bg-gray-200 rounded-full h-2">
                                        <div
                                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                          style={{ width: `${initiative.progress}%` }}
                                        ></div>
                                      </div>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                                      <div className="text-center p-2 bg-gray-50 rounded">
                                        <div className="font-medium text-blue-600">
                                          {initiative.solutions?.length || 0}
                                        </div>
                                        <div className="text-gray-600">Solutions</div>
                                      </div>
                                      <div className="text-center p-2 bg-gray-50 rounded">
                                        <div className="font-medium text-purple-600">
                                          {initiative.solutions?.reduce(
                                            (sum, s) => sum + (s.tasks?.length || 0),
                                            0
                                          ) || 0}
                                        </div>
                                        <div className="text-gray-600">Tasks</div>
                                      </div>
                                      <div className="text-center p-2 bg-gray-50 rounded">
                                        <div className="font-medium text-green-600">
                                          {initiative.assignments?.length || 0}
                                        </div>
                                        <div className="text-gray-600">Teams</div>
                                      </div>
                                    </div>

                                    {/* Expand/Collapse Button */}
                                    {(initiative.solutions?.length ||
                                      initiative.assignments?.length) && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleCardExpansion(initiative.id);
                                        }}
                                        className="w-full btn-secondary text-xs hover:scale-105 transition-transform duration-200"
                                      >
                                        {isExpanded ? 'Hide Details' : 'Show Details'}
                                      </button>
                                    )}

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                      <div className="mt-3 pt-3 border-t border-gray-200 space-y-3 animate-fade-in">
                                        {/* Solutions */}
                                        {initiative.solutions &&
                                          initiative.solutions.length > 0 && (
                                            <div>
                                              <h4 className="text-xs font-medium text-gray-700 mb-2">
                                                Solutions
                                              </h4>
                                              <div className="space-y-2">
                                                {initiative.solutions
                                                  .slice(0, 3)
                                                  .map((solution) => (
                                                    <div
                                                      key={solution.id}
                                                      className="bg-white p-2 rounded border border-gray-100"
                                                    >
                                                      <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-1">
                                                          <span className="text-xs">
                                                            {getSolutionTypeIcon(solution.type)}
                                                          </span>
                                                          <span className="text-xs font-medium text-gray-800">
                                                            {solution.title}
                                                          </span>
                                                        </div>
                                                        <span
                                                          className={`text-xs px-1.5 py-0.5 rounded ${
                                                            solution.status === 'COMPLETED'
                                                              ? 'bg-green-100 text-green-700'
                                                              : solution.status === 'IN_PROGRESS'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                          }`}
                                                        >
                                                          {solution.status}
                                                        </span>
                                                      </div>
                                                      <div className="text-xs text-gray-600">
                                                        {solution.tasks?.length || 0} tasks •{' '}
                                                        {solution.tasks?.filter(
                                                          (t) => t.status === 'COMPLETED'
                                                        ).length || 0}{' '}
                                                        completed
                                                      </div>
                                                    </div>
                                                  ))}
                                                {initiative.solutions.length > 3 && (
                                                  <div className="text-xs text-gray-500 text-center">
                                                    +{initiative.solutions.length - 3} more
                                                    solutions
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )}

                                        {/* Assignments */}
                                        {initiative.assignments &&
                                          initiative.assignments.length > 0 && (
                                            <div>
                                              <h4 className="text-xs font-medium text-gray-700 mb-2">
                                                Assigned Teams
                                              </h4>
                                              <div className="flex flex-wrap gap-1">
                                                {initiative.assignments.map((assignment) => (
                                                  <span
                                                    key={assignment.team.id}
                                                    className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full"
                                                  >
                                                    {assignment.team.name}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                        {/* Timeline */}
                                        {(initiative.timelineStart || initiative.timelineEnd) && (
                                          <div>
                                            <h4 className="text-xs font-medium text-gray-700 mb-1">
                                              Timeline
                                            </h4>
                                            <div className="text-xs text-gray-600">
                                              {initiative.timelineStart &&
                                                new Date(
                                                  initiative.timelineStart
                                                ).toLocaleDateString()}
                                              {initiative.timelineStart &&
                                                initiative.timelineEnd &&
                                                ' - '}
                                              {initiative.timelineEnd &&
                                                new Date(
                                                  initiative.timelineEnd
                                                ).toLocaleDateString()}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </DragDropContext>
        </div>
      )}

      {/* Progress Dashboard Placeholder */}
      {viewMode === 'progress' && (
        <div className="card-elevated p-8 text-center">
          <ArrowTrendingUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-h3 text-gray-600 mb-2">Progress Dashboard</h3>
          <p className="text-gray-500">
            Coming soon: Comprehensive progress analytics, completion rates, and performance
            metrics.
          </p>
        </div>
      )}

      {/* Timeline View Placeholder */}
      {viewMode === 'timeline' && (
        <div className="card-elevated p-8 text-center">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-h3 text-gray-600 mb-2">Timeline View</h3>
          <p className="text-gray-500">
            Coming soon: Interactive timeline showing initiative schedules, milestones, and
            dependencies.
          </p>
        </div>
      )}

      {/* Resource View Placeholder */}
      {viewMode === 'resource' && (
        <div className="card-elevated p-8 text-center">
          <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-h3 text-gray-600 mb-2">Resource Allocation</h3>
          <p className="text-gray-500">
            Coming soon: Team workload analysis, capacity planning, and resource optimization
            insights.
          </p>
        </div>
      )}

      {/* Empty State */}
      {initiatives.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">No initiatives found</div>
          <p className="text-gray-400 mb-6">
            Create some initiatives in the Plan section to track them here.
          </p>
          <a href="/initiatives" className="btn-primary inline-flex items-center">
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Initiative
          </a>
        </div>
      )}
    </div>
  );
}
