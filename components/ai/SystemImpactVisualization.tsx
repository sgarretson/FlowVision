'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  CpuChipIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChartBarIcon,
  ArrowPathIcon,
  FunnelIcon,
  EyeIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

interface SystemImpact {
  systemCategoryId: string;
  systemName: string;
  systemType: 'TECHNOLOGY' | 'PROCESS' | 'PEOPLE';
  totalImpacts: number;
  criticalImpacts: number;
  highImpacts: number;
  mediumImpacts: number;
  lowImpacts: number;
  averageHeatScore: number;
  affectedIssues: Array<{
    id: string;
    description: string;
    heatmapScore: number;
    votes: number;
    impactLevel: string;
  }>;
}

interface SystemAnalytics {
  totalSystems: number;
  systemsWithIssues: number;
  totalImpacts: number;
  impactDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  systemTypeBreakdown: Record<
    string,
    {
      total: number;
      withIssues: number;
      totalImpacts: number;
    }
  >;
  topRiskSystems: Array<{
    name: string;
    riskScore: number;
    totalImpacts: number;
  }>;
}

export default function SystemImpactVisualization() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'chart' | 'network'>('grid');

  const [systemImpacts, setSystemImpacts] = useState<SystemImpact[]>([]);
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);
  const [selectedSystemType, setSelectedSystemType] = useState<string>('ALL');
  const [impactLevelFilter, setImpactLevelFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'impacts' | 'risk'>('impacts');

  useEffect(() => {
    if (session) {
      fetchSystemAnalytics();
    }
  }, [session]);

  const fetchSystemAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/systems/analytics');
      if (response.ok) {
        const data = await response.json();

        // Transform the data to match our interface
        const transformedImpacts: SystemImpact[] =
          data.systemsWithImpacts?.map((system: any) => ({
            systemCategoryId: system.id,
            systemName: system.name,
            systemType: system.type,
            totalImpacts: system.issueImpacts?.length || 0,
            criticalImpacts:
              system.issueImpacts?.filter((i: any) => i.impactLevel === 'CRITICAL').length || 0,
            highImpacts:
              system.issueImpacts?.filter((i: any) => i.impactLevel === 'HIGH').length || 0,
            mediumImpacts:
              system.issueImpacts?.filter((i: any) => i.impactLevel === 'MEDIUM').length || 0,
            lowImpacts:
              system.issueImpacts?.filter((i: any) => i.impactLevel === 'LOW').length || 0,
            averageHeatScore: system.averageHeatScore || 0,
            affectedIssues:
              system.issueImpacts?.map((impact: any) => ({
                id: impact.issue.id,
                description: impact.issue.description,
                heatmapScore: impact.issue.heatmapScore,
                votes: impact.issue.votes,
                impactLevel: impact.impactLevel,
              })) || [],
          })) || [];

        setSystemImpacts(transformedImpacts);
        setAnalytics({
          totalSystems: data.totalSystems || 0,
          systemsWithIssues: data.systemsWithIssues || 0,
          totalImpacts: data.totalImpacts || 0,
          impactDistribution: data.impactDistribution || {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
          },
          systemTypeBreakdown: data.systemTypeBreakdown || {},
          topRiskSystems: data.topRiskSystems || [],
        });
      } else {
        setError('Failed to fetch system analytics');
      }
    } catch (error) {
      setError('Network error fetching system analytics');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredSystems = () => {
    let filtered = systemImpacts;

    if (selectedSystemType !== 'ALL') {
      filtered = filtered.filter((system) => system.systemType === selectedSystemType);
    }

    if (impactLevelFilter !== 'ALL') {
      filtered = filtered.filter((system) => {
        switch (impactLevelFilter) {
          case 'CRITICAL':
            return system.criticalImpacts > 0;
          case 'HIGH':
            return system.highImpacts > 0;
          case 'MEDIUM':
            return system.mediumImpacts > 0;
          case 'LOW':
            return system.lowImpacts > 0;
          default:
            return true;
        }
      });
    }

    // Sort systems
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.systemName.localeCompare(b.systemName);
        case 'impacts':
          return b.totalImpacts - a.totalImpacts;
        case 'risk':
          return (
            b.criticalImpacts * 3 +
            b.highImpacts * 2 +
            b.mediumImpacts -
            (a.criticalImpacts * 3 + a.highImpacts * 2 + a.mediumImpacts)
          );
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getSystemTypeIcon = (type: string) => {
    switch (type) {
      case 'TECHNOLOGY':
        return <CpuChipIcon className="h-5 w-5" />;
      case 'PROCESS':
        return <ChartBarIcon className="h-5 w-5" />;
      case 'PEOPLE':
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
          </svg>
        );
      default:
        return <InformationCircleIcon className="h-5 w-5" />;
    }
  };

  const getSystemTypeColor = (type: string) => {
    switch (type) {
      case 'TECHNOLOGY':
        return 'bg-blue-100 text-blue-800';
      case 'PROCESS':
        return 'bg-green-100 text-green-800';
      case 'PEOPLE':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-500';
      case 'HIGH':
        return 'bg-orange-500';
      case 'MEDIUM':
        return 'bg-yellow-500';
      case 'LOW':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRiskScore = (system: SystemImpact) => {
    return Math.min(
      100,
      system.criticalImpacts * 25 +
        system.highImpacts * 15 +
        system.mediumImpacts * 10 +
        system.lowImpacts * 5
    );
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-50';
    if (score >= 60) return 'text-orange-600 bg-orange-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (!session) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Authentication Required</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please sign in to access System Impact Visualization.
          </p>
        </div>
      </div>
    );
  }

  const filteredSystems = getFilteredSystems();

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Squares2X2Icon className="h-8 w-8 text-purple-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">System Impact Visualization</h2>
              <p className="text-sm text-gray-500">
                Interactive analysis of system impacts and relationships
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {loading && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                <span>Loading...</span>
              </div>
            )}
            <button
              onClick={fetchSystemAnalytics}
              disabled={loading}
              className="flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{analytics.totalSystems}</div>
              <div className="text-sm text-gray-500">Total Systems</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {analytics.systemsWithIssues}
              </div>
              <div className="text-sm text-gray-500">Systems with Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{analytics.totalImpacts}</div>
              <div className="text-sm text-gray-500">Total Impacts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{filteredSystems.length}</div>
              <div className="text-sm text-gray-500">Filtered Results</div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          {/* View Mode */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">View:</span>
            <div className="flex rounded-md border border-gray-300">
              {[
                { id: 'grid', name: 'Grid', icon: Squares2X2Icon },
                { id: 'chart', name: 'Chart', icon: ChartBarIcon },
                { id: 'network', name: 'Network', icon: ArrowPathIcon },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id as any)}
                  className={`flex items-center px-3 py-2 text-sm font-medium ${
                    viewMode === mode.id
                      ? 'bg-purple-100 text-purple-700 border-purple-300'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } ${mode.id === 'grid' ? 'rounded-l-md' : mode.id === 'network' ? 'rounded-r-md' : ''}`}
                >
                  <mode.icon className="h-4 w-4 mr-1" />
                  {mode.name}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
            <select
              value={selectedSystemType}
              onChange={(e) => setSelectedSystemType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="ALL">All Types</option>
              <option value="TECHNOLOGY">Technology</option>
              <option value="PROCESS">Process</option>
              <option value="PEOPLE">People</option>
            </select>

            <select
              value={impactLevelFilter}
              onChange={(e) => setImpactLevelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="ALL">All Impact Levels</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Only</option>
              <option value="MEDIUM">Medium Only</option>
              <option value="LOW">Low Only</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="impacts">Sort by Impacts</option>
              <option value="risk">Sort by Risk</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {viewMode === 'grid' && (
          <div>
            {filteredSystems.length === 0 ? (
              <div className="text-center py-12">
                <InformationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Systems Found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No systems match your current filter criteria.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSystems.map((system) => {
                  const riskScore = getRiskScore(system);

                  return (
                    <div
                      key={system.systemCategoryId}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`p-2 rounded-lg ${getSystemTypeColor(system.systemType)}`}
                          >
                            {getSystemTypeIcon(system.systemType)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{system.systemName}</h4>
                            <p className="text-sm text-gray-500 capitalize">
                              {system.systemType.toLowerCase()}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`text-center p-2 rounded-lg ${getRiskScoreColor(riskScore)}`}
                        >
                          <div className="text-lg font-bold">{riskScore}</div>
                          <div className="text-xs">Risk</div>
                        </div>
                      </div>

                      {/* Impact Summary */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                          <span>Total Impacts: {system.totalImpacts}</span>
                          <span>Heat Score: {Math.round(system.averageHeatScore)}</span>
                        </div>

                        {/* Impact Distribution */}
                        <div className="flex space-x-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          {system.criticalImpacts > 0 && (
                            <div
                              className={getImpactLevelColor('CRITICAL')}
                              style={{
                                width: `${(system.criticalImpacts / system.totalImpacts) * 100}%`,
                              }}
                            />
                          )}
                          {system.highImpacts > 0 && (
                            <div
                              className={getImpactLevelColor('HIGH')}
                              style={{
                                width: `${(system.highImpacts / system.totalImpacts) * 100}%`,
                              }}
                            />
                          )}
                          {system.mediumImpacts > 0 && (
                            <div
                              className={getImpactLevelColor('MEDIUM')}
                              style={{
                                width: `${(system.mediumImpacts / system.totalImpacts) * 100}%`,
                              }}
                            />
                          )}
                          {system.lowImpacts > 0 && (
                            <div
                              className={getImpactLevelColor('LOW')}
                              style={{
                                width: `${(system.lowImpacts / system.totalImpacts) * 100}%`,
                              }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Impact Counts */}
                      <div className="grid grid-cols-4 gap-1 text-center text-xs">
                        <div className="text-red-600">
                          <div className="font-semibold">{system.criticalImpacts}</div>
                          <div>Critical</div>
                        </div>
                        <div className="text-orange-600">
                          <div className="font-semibold">{system.highImpacts}</div>
                          <div>High</div>
                        </div>
                        <div className="text-yellow-600">
                          <div className="font-semibold">{system.mediumImpacts}</div>
                          <div>Medium</div>
                        </div>
                        <div className="text-green-600">
                          <div className="font-semibold">{system.lowImpacts}</div>
                          <div>Low</div>
                        </div>
                      </div>

                      {/* Top Issues */}
                      {system.affectedIssues.length > 0 && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm font-medium text-purple-600 hover:text-purple-500 flex items-center">
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View Issues ({system.affectedIssues.length})
                          </summary>
                          <div className="mt-2 space-y-1">
                            {system.affectedIssues.slice(0, 3).map((issue) => (
                              <div key={issue.id} className="text-xs bg-gray-50 p-2 rounded">
                                <div className="flex items-center justify-between mb-1">
                                  <span
                                    className={`px-1 py-0.5 rounded text-xs font-medium ${
                                      issue.impactLevel === 'CRITICAL'
                                        ? 'bg-red-100 text-red-800'
                                        : issue.impactLevel === 'HIGH'
                                          ? 'bg-orange-100 text-orange-800'
                                          : issue.impactLevel === 'MEDIUM'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-green-100 text-green-800'
                                    }`}
                                  >
                                    {issue.impactLevel}
                                  </span>
                                  <span className="text-gray-500">Heat: {issue.heatmapScore}</span>
                                </div>
                                <p className="text-gray-700 truncate">{issue.description}</p>
                              </div>
                            ))}
                            {system.affectedIssues.length > 3 && (
                              <div className="text-xs text-gray-500 text-center">
                                +{system.affectedIssues.length - 3} more issues
                              </div>
                            )}
                          </div>
                        </details>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {viewMode === 'chart' && analytics && (
          <div className="space-y-6">
            {/* Impact Distribution Chart */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Impact Distribution</h4>
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(analytics.impactDistribution).map(([level, count]) => (
                  <div key={level} className="text-center">
                    <div
                      className={`h-16 rounded-lg flex items-center justify-center text-white text-2xl font-bold ${getImpactLevelColor(level.toUpperCase())}`}
                    >
                      {count}
                    </div>
                    <div className="mt-2 text-sm font-medium text-gray-700 capitalize">{level}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Type Breakdown */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">System Type Breakdown</h4>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(analytics.systemTypeBreakdown).map(([type, data]) => (
                  <div key={type} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className={`p-2 rounded-lg ${getSystemTypeColor(type.toUpperCase())}`}>
                        {getSystemTypeIcon(type.toUpperCase())}
                      </div>
                      <span className="font-medium text-gray-900 capitalize">{type}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-medium">{data.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">With Issues:</span>
                        <span className="font-medium text-orange-600">{data.withIssues}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Impacts:</span>
                        <span className="font-medium text-red-600">{data.totalImpacts}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'network' && (
          <div className="text-center py-12">
            <ArrowPathIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Network View Coming Soon</h3>
            <p className="mt-1 text-sm text-gray-500">
              Interactive network visualization of system relationships will be available in a
              future update.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
