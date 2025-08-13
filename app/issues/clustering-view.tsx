'use client';

import React, { useState, useEffect } from 'react';
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
      <div className="space-y-4 animate-pulse">
        <div className="bg-gray-200 h-8 w-64 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 h-48 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-secondary p-6 text-center">
        <div className="text-red-600 text-lg mb-2">⚠️ Error Loading Clusters</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={loadClusteringData} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  if (!clusteringData || clusteringData.clusters.length === 0) {
    return (
      <div className="card-secondary p-8 text-center">
        <div className="text-gray-500 text-lg mb-2">🧠 No Issue Clusters Found</div>
        <p className="text-gray-400 mb-4">
          AI clustering will automatically organize issues as they accumulate.
        </p>
        <div className="text-sm text-gray-500">
          {clusteringData?.stats.totalIssues || 0} total issues • Clustering rate:{' '}
          {clusteringData?.stats.clusteringRate || 0}%
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clustering Statistics */}
      <div className="card-primary p-6">
        <h3 className="text-h3 mb-4 flex items-center">🧠 AI Issue Clustering Intelligence</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {clusteringData.stats.totalClusters}
            </div>
            <div className="text-sm text-gray-600">Clusters</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {clusteringData.stats.clusteringRate}%
            </div>
            <div className="text-sm text-gray-600">Clustered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {clusteringData.stats.clusteredIssues}
            </div>
            <div className="text-sm text-gray-600">Issues</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {clusteringData.stats.averageClusterSize}
            </div>
            <div className="text-sm text-gray-600">Avg Size</div>
          </div>
        </div>
      </div>

      {/* Cluster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clusteringData.clusters.map((cluster) => (
          <div
            key={cluster.id}
            className={`card-secondary cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedCluster === cluster.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => setSelectedCluster(selectedCluster === cluster.id ? null : cluster.id)}
          >
            <div className="p-6">
              {/* Cluster Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{getCategoryIcon(cluster.category)}</span>
                  <h4 className="text-h4 text-gray-900">{cluster.name}</h4>
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(cluster.severity)}`}
                >
                  {cluster.severity.toUpperCase()}
                </div>
              </div>

              {/* Theme */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{cluster.theme}</p>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">{cluster.issueCount}</div>
                  <div className="text-xs text-gray-500">Issues</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{cluster.averageScore}</div>
                  <div className="text-xs text-gray-500">Avg Score</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">
                    {cluster.initiativeCount}
                  </div>
                  <div className="text-xs text-gray-500">Initiatives</div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center justify-between">
                <div
                  className={`flex items-center text-xs ${cluster.isActive ? 'text-green-600' : 'text-gray-500'}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${cluster.isActive ? 'bg-green-500' : 'bg-gray-400'}`}
                  ></div>
                  {cluster.isActive ? 'Active' : 'Inactive'}
                </div>
                <div className="text-xs text-gray-400">{cluster.category}</div>
              </div>
            </div>

            {/* Expanded Details */}
            {selectedCluster === cluster.id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="space-y-4">
                  {/* Description */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Description</h5>
                    <p className="text-sm text-gray-600">{cluster.description}</p>
                  </div>

                  {/* Issues in Cluster */}
                  {cluster.issues.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">
                        Issues in Cluster ({cluster.issues.length})
                      </h5>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {cluster.issues.map((issue) => (
                          <div key={issue.id} className="bg-white p-2 rounded border text-xs">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-gray-700">
                                {issue.department || 'General'}
                              </span>
                              <span className="text-blue-600 font-medium">
                                {issue.heatmapScore}
                              </span>
                            </div>
                            <p className="text-gray-600 line-clamp-2">{issue.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      className="btn-secondary text-xs flex-1"
                      onClick={() => setDetailsModalCluster(cluster.id)}
                    >
                      View Details
                    </button>
                    <button className="btn-success text-xs flex-1">Create Initiative</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cluster Details Modal */}
      <ClusterDetailsModal
        clusterId={detailsModalCluster}
        onClose={() => setDetailsModalCluster(null)}
      />
    </div>
  );
}
