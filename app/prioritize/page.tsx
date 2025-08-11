'use client';

import React, { useEffect, useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  ChartBarIcon,
  ListBulletIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

interface Initiative {
  id: string;
  title: string;
  roi: number;
  difficulty: number;
  priorityScore: number;
  status: string;
  type: string;
  estimatedHours?: number;
  budget?: number;
  timelineStart?: string;
  timelineEnd?: string;
}

type ViewMode = 'matrix' | 'list';
type SortOption = 'priority' | 'roi' | 'difficulty' | 'impact';

const QUADRANT_COLORS = {
  'quick-wins': '#10B981', // High ROI, Low Difficulty
  'major-projects': '#F59E0B', // High ROI, High Difficulty
  'fill-ins': '#6B7280', // Low ROI, Low Difficulty
  'thankless-tasks': '#EF4444', // Low ROI, High Difficulty
};

export default function PrioritizePage() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('matrix');
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitiatives();
  }, []);

  const loadInitiatives = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/initiatives');
      if (response.ok) {
        const data = await response.json();
        setInitiatives(data);
      }
    } catch (error) {
      console.error('Failed to load initiatives:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQuadrant = (roi: number, difficulty: number): string => {
    const roiThreshold = 50;
    const difficultyThreshold = 50;

    if (roi >= roiThreshold && difficulty < difficultyThreshold) return 'quick-wins';
    if (roi >= roiThreshold && difficulty >= difficultyThreshold) return 'major-projects';
    if (roi < roiThreshold && difficulty < difficultyThreshold) return 'fill-ins';
    return 'thankless-tasks';
  };

  const getPriorityLabel = (quadrant: string): string => {
    switch (quadrant) {
      case 'quick-wins':
        return 'Quick Wins';
      case 'major-projects':
        return 'Major Projects';
      case 'fill-ins':
        return 'Fill-ins';
      case 'thankless-tasks':
        return 'Questionable';
      default:
        return 'Unknown';
    }
  };

  const chartData = initiatives.map((initiative) => ({
    ...initiative,
    x: initiative.difficulty || 0,
    y: initiative.roi || 0,
    quadrant: getQuadrant(initiative.roi || 0, initiative.difficulty || 0),
  }));

  const sortedInitiatives = [...initiatives].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        return (b.priorityScore || 0) - (a.priorityScore || 0);
      case 'roi':
        return (b.roi || 0) - (a.roi || 0);
      case 'difficulty':
        return (a.difficulty || 0) - (b.difficulty || 0);
      case 'impact':
        return (b.roi || 0) - (b.difficulty || 0) - ((a.roi || 0) - (a.difficulty || 0));
      default:
        return 0;
    }
  });

  const filteredInitiatives =
    filterType === 'all'
      ? sortedInitiatives
      : sortedInitiatives.filter((i) => i.type === filterType);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <h4 className="font-semibold text-gray-900 mb-2">{data.title}</h4>
          <div className="space-y-1 text-sm">
            <p>
              ROI: <span className="font-medium">{data.y}%</span>
            </p>
            <p>
              Difficulty: <span className="font-medium">{data.x}%</span>
            </p>
            <p>
              Category:{' '}
              <span className="font-medium text-blue-600">{getPriorityLabel(data.quadrant)}</span>
            </p>
            <p>
              Status: <span className="font-medium">{data.status}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-gray-600">Loading initiatives...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Initiative Prioritization</h1>
            <p className="text-gray-600 max-w-2xl">
              Visualize and prioritize your initiatives using the ROI vs Difficulty matrix. Focus on
              Quick Wins for immediate impact, then tackle Major Projects strategically.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="Process Improvement">Process Improvement</option>
              <option value="Technology">Technology</option>
              <option value="Strategic">Strategic</option>
              <option value="Operational">Operational</option>
            </select>

            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'matrix'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ChartBarIcon className="w-4 h-4 inline mr-1" />
                Matrix
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ListBulletIcon className="w-4 h-4 inline mr-1" />
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'matrix' ? (
        /* Priority Matrix View */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Matrix Legend */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(QUADRANT_COLORS).map(([key, color]) => (
                <div key={key} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                  <span className="text-sm font-medium text-gray-700">{getPriorityLabel(key)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scatter Chart */}
          <div className="p-6">
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Difficulty"
                    domain={[0, 100]}
                    label={{ value: 'Difficulty →', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="ROI"
                    domain={[0, 100]}
                    label={{ value: 'ROI →', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Scatter data={chartData}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={QUADRANT_COLORS[entry.quadrant as keyof typeof QUADRANT_COLORS]}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-gray-200">
          {/* List Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Prioritized Initiatives</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="priority">Priority Score</option>
                <option value="roi">ROI</option>
                <option value="difficulty">Difficulty</option>
                <option value="impact">Net Impact</option>
              </select>
            </div>
          </div>

          {/* Initiative List */}
          <div className="divide-y divide-gray-200">
            {filteredInitiatives.map((initiative, index) => {
              const quadrant = getQuadrant(initiative.roi || 0, initiative.difficulty || 0);
              const priorityColor = QUADRANT_COLORS[quadrant as keyof typeof QUADRANT_COLORS];

              return (
                <div key={initiative.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: priorityColor }}
                        ></div>
                      </div>

                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{initiative.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>ROI: {initiative.roi || 0}%</span>
                          <span>Difficulty: {initiative.difficulty || 0}%</span>
                          <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                            {getPriorityLabel(quadrant)}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {initiative.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {initiative.priorityScore || 0}
                      </div>
                      <div className="text-xs text-gray-500">Priority Score</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Panel */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Prioritization Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="font-medium text-gray-900">Quick Wins</span>
            </div>
            <p className="text-gray-600">
              {chartData.filter((i) => i.quadrant === 'quick-wins').length} initiatives with high
              ROI and low difficulty. Start here for immediate impact.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="font-medium text-gray-900">Major Projects</span>
            </div>
            <p className="text-gray-600">
              {chartData.filter((i) => i.quadrant === 'major-projects').length} high-value
              initiatives requiring significant investment. Plan carefully.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="font-medium text-gray-900">Questionable</span>
            </div>
            <p className="text-gray-600">
              {chartData.filter((i) => i.quadrant === 'thankless-tasks').length} initiatives with
              low ROI and high difficulty. Consider alternatives.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
