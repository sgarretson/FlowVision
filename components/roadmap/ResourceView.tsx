'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';

interface Team {
  id: string;
  name: string;
  department: string;
  capacity: number;
  skills: string[];
  totalAllocated: number;
  utilizationPercent: number;
  isOverallocated: boolean;
  assignments: Array<{
    id: string;
    hoursAllocated: number;
    role: string;
    initiative: {
      id: string;
      title: string;
      status: string;
      timelineStart: string | null;
      timelineEnd: string | null;
    };
  }>;
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

interface ResourceViewProps {
  teamUtilization: Team[];
  initiatives: Initiative[];
  onTeamClick?: (team: Team) => void;
}

const getUtilizationColor = (percent: number) => {
  if (percent > 100) return 'bg-red-500';
  if (percent > 80) return 'bg-yellow-500';
  if (percent > 60) return 'bg-blue-500';
  return 'bg-green-500';
};

const getUtilizationTextColor = (percent: number) => {
  if (percent > 100) return 'text-red-700';
  if (percent > 80) return 'text-yellow-700';
  if (percent > 60) return 'text-blue-700';
  return 'text-green-700';
};

const getStatusBadgeColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'done':
      return 'bg-green-100 text-green-800';
    case 'in progress':
      return 'bg-blue-100 text-blue-800';
    case 'prioritize':
      return 'bg-yellow-100 text-yellow-800';
    case 'define':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function ResourceView({
  teamUtilization,
  initiatives,
  onTeamClick,
}: ResourceViewProps) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'utilization' | 'allocation'>('utilization');

  const handleTeamClick = (team: Team) => {
    setSelectedTeam(selectedTeam === team.id ? null : team.id);
    onTeamClick?.(team);
  };

  const overallocatedTeams = teamUtilization.filter((team) => team.isOverallocated);
  const totalCapacity = teamUtilization.reduce((acc, team) => acc + team.capacity, 0);
  const totalAllocated = teamUtilization.reduce((acc, team) => acc + team.totalAllocated, 0);
  const averageUtilization =
    totalCapacity > 0 ? Math.round((totalAllocated / (totalCapacity * 4)) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-secondary p-4">
          <div className="text-sm font-medium text-gray-600">Total Teams</div>
          <div className="text-2xl font-bold text-gray-900">{teamUtilization.length}</div>
        </div>
        <div className="card-secondary p-4">
          <div className="text-sm font-medium text-gray-600">Average Utilization</div>
          <div className={`text-2xl font-bold ${getUtilizationTextColor(averageUtilization)}`}>
            {averageUtilization}%
          </div>
        </div>
        <div className="card-secondary p-4">
          <div className="text-sm font-medium text-gray-600">Overallocated Teams</div>
          <div className="text-2xl font-bold text-red-600">{overallocatedTeams.length}</div>
        </div>
        <div className="card-secondary p-4">
          <div className="text-sm font-medium text-gray-600">Total Capacity</div>
          <div className="text-2xl font-bold text-gray-900">{totalCapacity}h/week</div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="card-primary">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-h3">Resource Allocation</h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('utilization')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'utilization'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Utilization
              </button>
              <button
                onClick={() => setViewMode('allocation')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'allocation'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Assignments
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'utilization' ? (
          /* Utilization View */
          <div className="p-6">
            <div className="space-y-4">
              {teamUtilization.map((team) => (
                <div
                  key={team.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedTeam === team.id ? 'ring-2 ring-primary' : ''
                  } ${team.isOverallocated ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
                  onClick={() => handleTeamClick(team)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{team.name}</h4>
                        <p className="text-sm text-gray-600">{team.department}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {team.skills.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {team.skills.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                            +{team.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Capacity</div>
                        <div className="font-medium">{team.capacity}h/week</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Allocated</div>
                        <div className="font-medium">{team.totalAllocated}h</div>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <div
                          className={`text-lg font-bold ${getUtilizationTextColor(team.utilizationPercent)}`}
                        >
                          {team.utilizationPercent}%
                        </div>
                        <div className="w-20 h-2 bg-gray-200 rounded-full mt-1">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${getUtilizationColor(team.utilizationPercent)}`}
                            style={{ width: `${Math.min(100, team.utilizationPercent)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Assignment Details */}
                  {selectedTeam === team.id && team.assignments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h5 className="font-medium text-gray-900 mb-3">Current Assignments</h5>
                      <div className="space-y-2">
                        {team.assignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(assignment.initiative.status)}`}
                              >
                                {assignment.initiative.status}
                              </span>
                              <span className="font-medium text-gray-900">
                                {assignment.initiative.title}
                              </span>
                              <span className="text-sm text-gray-600">({assignment.role})</span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              {assignment.initiative.timelineStart &&
                                assignment.initiative.timelineEnd && (
                                  <span>
                                    {format(new Date(assignment.initiative.timelineStart), 'MMM d')}{' '}
                                    -{format(new Date(assignment.initiative.timelineEnd), 'MMM d')}
                                  </span>
                                )}
                              <span className="font-medium">{assignment.hoursAllocated}h</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Assignment View */
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Initiative
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teams Assigned
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Hours
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {initiatives.map((initiative) => (
                    <tr key={initiative.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{initiative.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(initiative.status)}`}
                        >
                          {initiative.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {initiative.assignments.map((assignment, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-1 bg-gray-100 rounded-full px-3 py-1"
                            >
                              <span className="text-sm font-medium text-gray-900">
                                {assignment.team.name}
                              </span>
                              <span className="text-xs text-gray-600">({assignment.role})</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {initiative.assignments.reduce(
                            (acc, assignment) => acc + assignment.hoursAllocated,
                            0
                          )}
                          h
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Resource Conflicts Alert */}
      {overallocatedTeams.length > 0 && (
        <div className="card-secondary border-l-4 border-red-400 bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Resource Allocation Warning</h3>
              <p className="mt-1 text-sm text-red-700">
                {overallocatedTeams.length} team{overallocatedTeams.length !== 1 ? 's' : ''}
                {overallocatedTeams.length === 1 ? ' is' : ' are'} overallocated. Consider
                redistributing workload or adjusting timelines.
              </p>
              <div className="mt-2">
                <div className="flex flex-wrap gap-2">
                  {overallocatedTeams.map((team) => (
                    <span
                      key={team.id}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                    >
                      {team.name} ({team.utilizationPercent}%)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
