'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { ExclamationTriangleIcon, ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import ClusterDetailsModal from '@/components/ClusterDetailsModal';

interface Issue {
  id: string;
  description: string;
  heatmapScore: number;
  votes: number;
  department?: string;
  category?: string;
}

interface Cluster {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: string;
  theme: string;
  color: string;
  isActive: boolean;
  issues: Issue[];
  initiatives: any[];
  issueCount: number;
  initiativeCount: number;
  averageScore: number;
}

interface ClusteringData {
  success: boolean;
  stats: {
    totalClusters: number;
    activeClusters: number;
    totalIssues: number;
    clusteredIssues: number;
    clusteringRate: number;
    averageClusterSize: number;
  };
  clusters: Cluster[];
}

export default function ClusteringView() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [clusteringData, setClusteringData] = useState<ClusteringData | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [detailsModalCluster, setDetailsModalCluster] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modern severity indicators
  const SEVERITY_INDICATORS = useMemo(
    () => ({
      CRITICAL: {
        dot: 'bg-red-500',
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        label: 'Critical',
      },
      HIGH: {
        dot: 'bg-orange-500',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        label: 'High',
      },
      MEDIUM: {
        dot: 'bg-yellow-500',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-700',
        label: 'Medium',
      },
      LOW: {
        dot: 'bg-green-500',
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        label: 'Low',
      },
    }),
    []
  );

  useEffect(() => {
    if (!session) {
      setError('Please log in to view AI clustering data');
      setLoading(false);
      return;
    }
    loadClusteringData();
  }, [session]);

  async function loadClusteringData() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/ai/cluster-issues');

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required. Please log in.');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setClusteringData(data);
      } else {
        setError(data.error || 'Failed to load clustering data');
      }
    } catch (err) {
      setError('Failed to fetch clustering data');
      console.error('Clustering fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  function getSeverityColor(severity: string) {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function getCategoryIcon(category: string) {
    switch (category.toLowerCase()) {
      case 'coordination':
        return '🤝';
      case 'technology':
        return '⚙️';
      case 'process':
        return '📋';
      case 'management':
        return '📊';
      case 'knowledge':
        return '📚';
      default:
        return '📁';
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Modern Loading Header */}
        <div
          className="card-elevated p-8 animate-pulse"
          style={{
            backdropFilter: 'blur(20px)',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <div className="flex items-center mb-6">
            <div className="skeleton-modern h-6 w-6 rounded mr-3"></div>
            <div className="skeleton-modern h-8 w-80 rounded-lg"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                <div className="skeleton-modern h-10 w-16 mx-auto mb-2 rounded"></div>
                <div className="skeleton-modern h-4 w-20 mx-auto rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Modern Loading Clusters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="card-elevated p-6 space-y-4"
              style={{
                backdropFilter: 'blur(10px)',
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <div className="flex justify-between">
                <div className="skeleton-modern h-6 w-32 rounded"></div>
                <div className="skeleton-modern h-6 w-16 rounded-full"></div>
              </div>
              <div className="skeleton-modern h-4 w-full rounded"></div>
              <div className="skeleton-modern h-4 w-3/4 rounded"></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="skeleton-modern h-12 rounded-lg"></div>
                <div className="skeleton-modern h-12 rounded-lg"></div>
                <div className="skeleton-modern h-12 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="card-elevated p-8 text-center animate-fade-in"
        style={{
          backdropFilter: 'blur(20px)',
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
        }}
      >
        <div className="flex items-center justify-center mb-4">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
          <h3 className="text-h3 text-red-600">Error Loading Clusters</h3>
        </div>
        <p className="text-body text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
        <button
          onClick={loadClusteringData}
          className="btn-primary hover:scale-105 transition-transform duration-200"
        >
          <span className="flex items-center gap-2">
            <Cog6ToothIcon className="h-4 w-4" />
            Retry Loading
          </span>
        </button>
      </div>
    );
  }

  if (!clusteringData || clusteringData.clusters.length === 0) {
    return (
      <div
        className="card-elevated p-12 text-center animate-fade-in"
        style={{
          backdropFilter: 'blur(20px)',
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <div className="flex items-center justify-center mb-6">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mr-4" />
          <h3 className="text-h3 text-gray-500">No Issue Clusters Found</h3>
        </div>
        <p className="text-body text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
          AI clustering will automatically organize issues as they accumulate. Add more issues to
          see intelligent clustering patterns emerge.
        </p>
        <div className="flex items-center justify-center gap-6 text-body-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>{clusteringData?.stats.totalIssues || 0} total issues</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>{clusteringData?.stats.clusteringRate || 0}% clustered</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Clustering Intelligence Header */}
      <div
        className="card-elevated p-8 animate-fade-in"
        style={{
          backdropFilter: 'blur(20px)',
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <div className="flex items-center mb-6">
          <div className="icon-container mr-3">
            <ChartBarIcon className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-h3">AI Issue Clustering Intelligence</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="metric-card text-center p-4 rounded-lg bg-blue-50 border border-blue-100 hover:shadow-card-standard transition-all duration-200">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {clusteringData.stats.totalClusters}
            </div>
            <div className="text-body-sm text-blue-700 font-medium">Clusters</div>
          </div>
          <div className="metric-card text-center p-4 rounded-lg bg-green-50 border border-green-100 hover:shadow-card-standard transition-all duration-200">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {clusteringData.stats.clusteringRate}%
            </div>
            <div className="text-body-sm text-green-700 font-medium">Clustered</div>
          </div>
          <div className="metric-card text-center p-4 rounded-lg bg-purple-50 border border-purple-100 hover:shadow-card-standard transition-all duration-200">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {clusteringData.stats.clusteredIssues}
            </div>
            <div className="text-body-sm text-purple-700 font-medium">Issues</div>
          </div>
          <div className="metric-card text-center p-4 rounded-lg bg-orange-50 border border-orange-100 hover:shadow-card-standard transition-all duration-200">
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {clusteringData.stats.averageClusterSize}
            </div>
            <div className="text-body-sm text-orange-700 font-medium">Avg Size</div>
          </div>
        </div>
      </div>

      {/* Cluster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clusteringData.clusters.map((cluster) => {
          const severityIndicator =
            SEVERITY_INDICATORS[
              cluster.severity.toUpperCase() as keyof typeof SEVERITY_INDICATORS
            ] || SEVERITY_INDICATORS.MEDIUM;

          return (
            <div
              key={cluster.id}
              className={`card-elevated card-interactive hover:shadow-card-elevated-hover transform hover:-translate-y-1 transition-all duration-300 cursor-pointer animate-scale-in ${
                selectedCluster === cluster.id
                  ? 'ring-2 ring-blue-500 shadow-card-elevated-hover'
                  : ''
              }`}
              style={{
                backdropFilter: 'blur(10px)',
                background:
                  selectedCluster === cluster.id
                    ? 'rgba(59, 130, 246, 0.05)'
                    : 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
              onClick={() => setSelectedCluster(selectedCluster === cluster.id ? null : cluster.id)}
            >
              <div className="p-6">
                {/* Cluster Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="icon-container mr-3">
                      <span className="text-xl">{getCategoryIcon(cluster.category)}</span>
                    </div>
                    <h4 className="text-h4 text-gray-900 font-semibold">{cluster.name}</h4>
                  </div>
                  <div
                    className={`flex items-center px-3 py-1 rounded-full text-xs font-medium border ${severityIndicator.bg} ${severityIndicator.border} ${severityIndicator.text}`}
                  >
                    <div className={`w-2 h-2 rounded-full mr-2 ${severityIndicator.dot}`}></div>
                    {severityIndicator.label}
                  </div>
                </div>

                {/* Theme */}
                <p className="text-body-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                  {cluster.theme}
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="metric-card text-center p-3 rounded-lg bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors duration-200">
                    <div className="text-xl font-bold text-blue-600 mb-1">{cluster.issueCount}</div>
                    <div className="text-body-xs text-blue-700 font-medium">Issues</div>
                  </div>
                  <div className="metric-card text-center p-3 rounded-lg bg-green-50 border border-green-100 hover:bg-green-100 transition-colors duration-200">
                    <div className="text-xl font-bold text-green-600 mb-1">
                      {cluster.averageScore}
                    </div>
                    <div className="text-body-xs text-green-700 font-medium">Avg Score</div>
                  </div>
                  <div className="metric-card text-center p-3 rounded-lg bg-purple-50 border border-purple-100 hover:bg-purple-100 transition-colors duration-200">
                    <div className="text-xl font-bold text-purple-600 mb-1">
                      {cluster.initiativeCount}
                    </div>
                    <div className="text-body-xs text-purple-700 font-medium">Initiatives</div>
                  </div>
                </div>

                {/* Status & Category */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${cluster.isActive ? 'bg-green-500' : 'bg-gray-400'}`}
                    ></div>
                    <span
                      className={`text-body-xs font-medium ${cluster.isActive ? 'text-green-700' : 'text-gray-500'}`}
                    >
                      {cluster.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <span className="text-body-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {cluster.category}
                  </span>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedCluster === cluster.id && (
                <div className="border-t border-gray-100 p-4 bg-gradient-to-r from-gray-50 to-blue-50 animate-fade-in">
                  <div className="space-y-4">
                    {/* Description */}
                    <div>
                      <h5 className="text-body-sm font-semibold text-gray-900 mb-2">Description</h5>
                      <p className="text-body-sm text-gray-600 leading-relaxed">
                        {cluster.description}
                      </p>
                    </div>

                    {/* Issues in Cluster */}
                    {cluster.issues.length > 0 && (
                      <div>
                        <h5 className="text-body-sm font-semibold text-gray-900 mb-2">
                          Issues in Cluster ({cluster.issues.length})
                        </h5>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {cluster.issues.map((issue) => (
                            <div
                              key={issue.id}
                              className="bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors duration-200"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-body-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                                  {issue.department || 'General'}
                                </span>
                                <span className="text-blue-600 font-bold text-sm">
                                  {issue.heatmapScore}
                                </span>
                              </div>
                              <p className="text-body-xs text-gray-600 line-clamp-2 leading-relaxed">
                                {issue.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Modern Action Buttons */}
                    <div className="flex gap-3 pt-3">
                      <button
                        className="btn-secondary text-sm flex-1 hover:scale-105 transition-transform duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailsModalCluster(cluster.id);
                        }}
                      >
                        View Details
                      </button>
                      <button className="btn-primary text-sm flex-1 hover:scale-105 transition-transform duration-200">
                        Create Initiative
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Cluster Details Modal */}
      <ClusterDetailsModal
        clusterId={detailsModalCluster}
        onClose={() => setDetailsModalCluster(null)}
      />
    </div>
  );
}
