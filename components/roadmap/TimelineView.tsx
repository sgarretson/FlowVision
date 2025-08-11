'use client';

import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, isSameMonth } from 'date-fns';

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

interface TimelineViewProps {
  initiatives: Initiative[];
  onInitiativeClick: (initiative: Initiative) => void;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'done':
      return 'bg-green-500';
    case 'in progress':
      return 'bg-blue-500';
    case 'prioritize':
      return 'bg-yellow-500';
    case 'define':
      return 'bg-gray-500';
    default:
      return 'bg-gray-400';
  }
};

const getPhaseColor = (phase: string | null) => {
  switch (phase) {
    case 'completed':
      return 'border-green-400';
    case 'development':
      return 'border-blue-400';
    case 'planning':
      return 'border-yellow-400';
    default:
      return 'border-gray-400';
  }
};

const calculatePosition = (
  startDate: string,
  endDate: string,
  timelineStart: Date,
  timelineEnd: Date
) => {
  const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
  const itemStart = new Date(startDate).getTime();
  const itemEnd = new Date(endDate).getTime();

  const leftPercent = ((itemStart - timelineStart.getTime()) / totalDuration) * 100;
  const widthPercent = ((itemEnd - itemStart) / totalDuration) * 100;

  return {
    left: Math.max(0, leftPercent),
    width: Math.max(2, widthPercent), // Minimum 2% width for visibility
  };
};

export default function TimelineView({ initiatives, onInitiativeClick }: TimelineViewProps) {
  const [selectedView, setSelectedView] = useState<'year' | 'quarter'>('year');
  const [hoveredInitiative, setHoveredInitiative] = useState<string | null>(null);

  // Calculate timeline bounds
  const timelineBounds = useMemo(() => {
    const validInitiatives = initiatives.filter((init) => init.timelineStart && init.timelineEnd);
    if (validInitiatives.length === 0) {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31),
      };
    }

    const starts = validInitiatives.map((init) => new Date(init.timelineStart!));
    const ends = validInitiatives.map((init) => new Date(init.timelineEnd!));

    const earliestStart = new Date(Math.min(...starts.map((d) => d.getTime())));
    const latestEnd = new Date(Math.max(...ends.map((d) => d.getTime())));

    return {
      start: startOfMonth(earliestStart),
      end: endOfMonth(latestEnd),
    };
  }, [initiatives]);

  // Generate time periods for the header
  const timePeriods = useMemo(() => {
    return eachMonthOfInterval({
      start: timelineBounds.start,
      end: timelineBounds.end,
    });
  }, [timelineBounds]);

  // Group initiatives by swim lanes (departments)
  const swimLanes = useMemo(() => {
    const lanes: { [key: string]: Initiative[] } = {};

    initiatives.forEach((initiative) => {
      if (!initiative.timelineStart || !initiative.timelineEnd) return;

      // Group by primary team department
      const primaryTeam = initiative.assignments.find((a) => a.role === 'lead');
      const department = primaryTeam?.team.department || 'Unassigned';

      if (!lanes[department]) {
        lanes[department] = [];
      }
      lanes[department].push(initiative);
    });

    return lanes;
  }, [initiatives]);

  return (
    <div className="bg-white rounded-lg card-primary">
      {/* Header Controls */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-h3">Timeline View</h3>
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSelectedView('quarter')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  selectedView === 'quarter'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Quarterly
              </button>
              <button
                onClick={() => setSelectedView('year')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  selectedView === 'year'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Annual
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Time Header */}
          <div className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
            <div className="flex">
              <div className="w-48 px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">
                Department
              </div>
              <div className="flex-1 flex">
                {timePeriods.map((month, index) => (
                  <div
                    key={index}
                    className="flex-1 px-2 py-3 text-xs font-medium text-gray-600 text-center border-r border-gray-200 last:border-r-0"
                  >
                    {format(month, selectedView === 'quarter' ? 'MMM' : 'MMM yyyy')}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Swim Lanes */}
          <div className="relative">
            {Object.entries(swimLanes).map(([department, deptInitiatives], laneIndex) => (
              <div key={department} className="flex border-b border-gray-100 last:border-b-0">
                {/* Department Label */}
                <div className="w-48 px-4 py-6 border-r border-gray-200 bg-gray-50">
                  <div className="text-sm font-medium text-gray-900">{department}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {deptInitiatives.length} initiative{deptInitiatives.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Timeline Content */}
                <div className="flex-1 relative min-h-[80px] py-2">
                  {/* Grid Lines */}
                  {timePeriods.map((month, index) => (
                    <div
                      key={index}
                      className="absolute top-0 bottom-0 border-r border-gray-100 last:border-r-0"
                      style={{ left: `${(index / timePeriods.length) * 100}%` }}
                    />
                  ))}

                  {/* Initiative Bars */}
                  {deptInitiatives.map((initiative, initIndex) => {
                    if (!initiative.timelineStart || !initiative.timelineEnd) return null;

                    const position = calculatePosition(
                      initiative.timelineStart,
                      initiative.timelineEnd,
                      timelineBounds.start,
                      timelineBounds.end
                    );

                    const isHovered = hoveredInitiative === initiative.id;

                    return (
                      <div
                        key={initiative.id}
                        className={`absolute h-6 rounded-md cursor-pointer transition-all duration-200 transform ${
                          isHovered ? 'scale-105 z-20' : 'z-10'
                        } ${getPhaseColor(initiative.phase)} border-2`}
                        style={{
                          left: `${position.left}%`,
                          width: `${position.width}%`,
                          top: `${8 + initIndex * 32}px`,
                        }}
                        onMouseEnter={() => setHoveredInitiative(initiative.id)}
                        onMouseLeave={() => setHoveredInitiative(null)}
                        onClick={() => onInitiativeClick(initiative)}
                      >
                        <div
                          className={`h-full rounded-sm ${getStatusColor(initiative.status)} flex items-center px-2`}
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <div className="text-xs font-medium text-white truncate">
                              {initiative.title}
                            </div>
                            <div className="text-xs text-white/80">{initiative.progress}%</div>
                          </div>

                          {/* Progress Bar */}
                          <div className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-b-sm">
                            <div
                              className="h-full bg-white rounded-b-sm transition-all duration-300"
                              style={{ width: `${initiative.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Hover Tooltip */}
                        {isHovered && (
                          <div className="absolute top-8 left-0 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl z-30 min-w-64">
                            <div className="font-medium">{initiative.title}</div>
                            <div className="text-gray-300 mt-1">
                              {format(new Date(initiative.timelineStart), 'MMM d')} -{' '}
                              {format(new Date(initiative.timelineEnd), 'MMM d, yyyy')}
                            </div>
                            <div className="text-gray-300 mt-1">
                              Status: {initiative.status} • Progress: {initiative.progress}%
                            </div>
                            {initiative.budget && (
                              <div className="text-gray-300">
                                Budget: ${initiative.budget.toLocaleString()}
                              </div>
                            )}
                            {initiative.dependencies.length > 0 && (
                              <div className="text-yellow-300 mt-1">
                                ⚠ {initiative.dependencies.length} dependencies
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center space-x-6 text-xs">
              <div className="font-medium text-gray-700">Status:</div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Done</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>In Progress</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Prioritize</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-gray-500 rounded"></div>
                <span>Define</span>
              </div>

              <div className="border-l border-gray-300 pl-6 ml-6">
                <div className="font-medium text-gray-700 mb-1">Phase:</div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 border-2 border-green-400 rounded"></div>
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 border-2 border-blue-400 rounded"></div>
                    <span>Development</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 border-2 border-yellow-400 rounded"></div>
                    <span>Planning</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
