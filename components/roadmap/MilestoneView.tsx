'use client';

import React, { useState } from 'react';
import { format, isAfter, isBefore, isToday } from 'date-fns';

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: string;
  progress: number;
  initiative: {
    id: string;
    title: string;
    status: string;
  };
}

interface Initiative {
  id: string;
  title: string;
  problem: string;
  goal: string;
  status: string;
  progress: number;
  timelineStart: string | null;
  timelineEnd: string | null;
  priorityScore: number | null;
  phase: string | null;
  budget: number | null;
  assignments: Array<{
    team: {
      id: string;
      name: string;
      department: string;
    };
    role: string;
    hoursAllocated: number;
  }>;
  milestones: Array<{
    id: string;
    title: string;
    description: string | null;
    dueDate: string;
    status: string;
    progress: number;
  }>;
  dependencies: Array<{
    id: string;
    title: string;
    status: string;
  }>;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface MilestoneViewProps {
  initiatives: Initiative[];
  onMilestoneClick?: (milestone: Milestone) => void;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'delayed':
      return 'bg-red-100 text-red-800';
    case 'pending':
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityColor = (dueDate: string, status: string) => {
  if (status === 'completed') return 'border-green-400';

  const due = new Date(dueDate);
  const now = new Date();
  const daysDiff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff < 0) return 'border-red-400'; // Overdue
  if (daysDiff <= 7) return 'border-orange-400'; // Due soon
  if (daysDiff <= 30) return 'border-yellow-400'; // Due this month
  return 'border-gray-300'; // Future
};

const getMilestoneIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return (
        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'in_progress':
      return (
        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'delayed':
      return (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clipRule="evenodd"
          />
        </svg>
      );
  }
};

export default function MilestoneView({ initiatives, onMilestoneClick }: MilestoneViewProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'progress' | 'title'>('dueDate');

  // Flatten all milestones from all initiatives and add initiative info
  const allMilestones: Milestone[] = initiatives.flatMap((initiative) =>
    initiative.milestones.map((milestone) => ({
      ...milestone,
      initiative: {
        id: initiative.id,
        title: initiative.title,
        status: initiative.status,
      },
    }))
  );

  // Filter milestones
  const filteredMilestones = allMilestones.filter((milestone) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'overdue') {
      return milestone.status !== 'completed' && isBefore(new Date(milestone.dueDate), new Date());
    }
    if (filterStatus === 'upcoming') {
      const due = new Date(milestone.dueDate);
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return (
        milestone.status !== 'completed' && isAfter(due, new Date()) && isBefore(due, weekFromNow)
      );
    }
    return milestone.status === filterStatus;
  });

  // Sort milestones
  const sortedMilestones = [...filteredMilestones].sort((a, b) => {
    switch (sortBy) {
      case 'dueDate':
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case 'progress':
        return b.progress - a.progress;
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  // Calculate statistics
  const totalMilestones = allMilestones.length;
  const completedMilestones = allMilestones.filter((m) => m.status === 'completed').length;
  const overdueMilestones = allMilestones.filter(
    (m) => m.status !== 'completed' && isBefore(new Date(m.dueDate), new Date())
  ).length;
  const upcomingMilestones = allMilestones.filter((m) => {
    const due = new Date(m.dueDate);
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return m.status !== 'completed' && isAfter(due, new Date()) && isBefore(due, weekFromNow);
  }).length;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-secondary p-4">
          <div className="text-sm font-medium text-gray-600">Total Milestones</div>
          <div className="text-2xl font-bold text-gray-900">{totalMilestones}</div>
        </div>
        <div className="card-secondary p-4">
          <div className="text-sm font-medium text-gray-600">Completed</div>
          <div className="text-2xl font-bold text-green-600">{completedMilestones}</div>
          <div className="text-xs text-gray-500">
            {totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0}%
            complete
          </div>
        </div>
        <div className="card-secondary p-4">
          <div className="text-sm font-medium text-gray-600">Overdue</div>
          <div className="text-2xl font-bold text-red-600">{overdueMilestones}</div>
        </div>
        <div className="card-secondary p-4">
          <div className="text-sm font-medium text-gray-600">Due This Week</div>
          <div className="text-2xl font-bold text-orange-600">{upcomingMilestones}</div>
        </div>
      </div>

      {/* Milestone List */}
      <div className="card-primary">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-h3">Milestones</h3>
            <div className="flex items-center space-x-4">
              {/* Filter Controls */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="delayed">Delayed</option>
                <option value="overdue">Overdue</option>
                <option value="upcoming">Due This Week</option>
              </select>

              {/* Sort Controls */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'progress' | 'title')}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="dueDate">Sort by Due Date</option>
                <option value="progress">Sort by Progress</option>
                <option value="title">Sort by Title</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          {sortedMilestones.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-12 h-12 text-gray-400 mx-auto mb-4"
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No milestones found</h3>
              <p className="text-gray-600">No milestones match the current filter criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedMilestones.map((milestone) => {
                const isOverdue =
                  milestone.status !== 'completed' &&
                  isBefore(new Date(milestone.dueDate), new Date());
                const isDueToday = isToday(new Date(milestone.dueDate));
                const dueSoon =
                  !isOverdue &&
                  !isDueToday &&
                  isBefore(
                    new Date(milestone.dueDate),
                    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                  );

                return (
                  <div
                    key={milestone.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${getPriorityColor(milestone.dueDate, milestone.status)} border-l-4`}
                    onClick={() => onMilestoneClick?.(milestone)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="flex-shrink-0 mt-1">
                          {getMilestoneIcon(milestone.status)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-gray-900 truncate">
                              {milestone.title}
                            </h4>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(milestone.status)}`}
                            >
                              {milestone.status.replace('_', ' ')}
                            </span>
                          </div>

                          {milestone.description && (
                            <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                          )}

                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="font-medium text-gray-700">
                              {milestone.initiative.title}
                            </span>
                            <span>•</span>
                            <span
                              className={`font-medium ${
                                isOverdue
                                  ? 'text-red-600'
                                  : isDueToday
                                    ? 'text-orange-600'
                                    : dueSoon
                                      ? 'text-yellow-600'
                                      : 'text-gray-600'
                              }`}
                            >
                              Due {format(new Date(milestone.dueDate), 'MMM d, yyyy')}
                              {isOverdue && ' (Overdue)'}
                              {isDueToday && ' (Today)'}
                              {dueSoon && ' (Due Soon)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 flex-shrink-0">
                        {/* Progress */}
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {milestone.progress}%
                          </div>
                          <div className="w-16 h-2 bg-gray-200 rounded-full mt-1">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                milestone.status === 'completed'
                                  ? 'bg-green-500'
                                  : milestone.status === 'in_progress'
                                    ? 'bg-blue-500'
                                    : 'bg-gray-400'
                              }`}
                              style={{ width: `${milestone.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Initiative Status */}
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Initiative</div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(milestone.initiative.status)}`}
                          >
                            {milestone.initiative.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
