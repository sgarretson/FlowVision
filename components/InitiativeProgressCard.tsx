'use client';

import React from 'react';
import {
  RocketLaunchIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import type { InitiativeProgress } from '@/lib/strategic-health';

interface InitiativeProgressCardProps {
  progress?: InitiativeProgress;
  loading?: boolean;
}

export default function InitiativeProgressCard({ progress, loading }: InitiativeProgressCardProps) {
  if (loading || !progress) {
    return (
      <div className="card-primary p-6 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="skeleton h-6 w-6 rounded"></div>
          <div className="skeleton h-6 w-48"></div>
        </div>
        <div className="skeleton h-12 w-24 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-16 w-full rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBgColor = (percentage: number) => {
    if (percentage >= 80) return 'from-green-50 to-green-100 border-green-200';
    if (percentage >= 60) return 'from-blue-50 to-blue-100 border-blue-200';
    if (percentage >= 40) return 'from-yellow-50 to-yellow-100 border-yellow-200';
    return 'from-red-50 to-red-100 border-red-200';
  };

  return (
    <div
      className={`card-elevated p-6 bg-gradient-to-br ${getProgressBgColor(progress.avgProgress)} border-2 group hover:shadow-card-elevated-hover transition-all duration-300`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <RocketLaunchIcon className="w-6 h-6 text-primary" />
        <h3 className="text-h3 text-gray-900">Initiative Progress</h3>
      </div>

      {/* Main Progress */}
      <div className="mb-6">
        <div
          className={`text-4xl font-bold ${getProgressColor(progress.avgProgress)} mb-2 group-hover:scale-105 transition-transform duration-200`}
        >
          {progress.avgProgress}%
        </div>
        <div className="text-sm text-gray-600 bg-white bg-opacity-50 px-3 py-1 rounded-full inline-block">
          Average Progress
        </div>
      </div>

      {/* Progress Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* On Track */}
        <div className="bg-white bg-opacity-60 rounded-xl p-3 text-center border border-gray-200">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-xl font-semibold text-gray-900 mb-1">{progress.onTrackCount}</div>
          <div className="text-xs text-gray-600 font-medium">On Track</div>
        </div>

        {/* At Risk */}
        <div className="bg-white bg-opacity-60 rounded-xl p-3 text-center border border-gray-200">
          <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-xl font-semibold text-gray-900 mb-1">{progress.atRiskCount}</div>
          <div className="text-xs text-gray-600 font-medium">At Risk</div>
        </div>

        {/* Overdue */}
        <div className="bg-white bg-opacity-60 rounded-xl p-3 text-center border border-gray-200">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <ClockIcon className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-xl font-semibold text-gray-900 mb-1">{progress.overDueCount}</div>
          <div className="text-xs text-gray-600 font-medium">Overdue</div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white bg-opacity-60 rounded-xl p-3 text-center border border-gray-200">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <ChartBarIcon className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-xl font-semibold text-gray-900 mb-1">{progress.completionRate}%</div>
          <div className="text-xs text-gray-600 font-medium">Complete</div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-700 font-medium">Total Initiatives</span>
          <span className="text-gray-900 font-semibold">{progress.totalInitiatives}</span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-700 font-medium">Upcoming Milestones</span>
          <span className="text-gray-900 font-semibold">{progress.keyMilestones.upcoming}</span>
        </div>

        {progress.keyMilestones.overdue > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-red-700 font-medium">Overdue Milestones</span>
            <span className="text-red-800 font-semibold">{progress.keyMilestones.overdue}</span>
          </div>
        )}
      </div>
    </div>
  );
}
