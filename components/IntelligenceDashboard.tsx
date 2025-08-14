'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CpuChipIcon,
  ChartBarIcon,
  BellIcon,
  Cog6ToothIcon,
  PlayIcon,
  PauseIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BoltIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';

interface Prediction {
  id: string;
  targetEntity: {
    id: string;
    type: string;
    title: string;
  };
  prediction: {
    outcome: string;
    probability: number;
    timeframe: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  confidence: {
    score: number;
    reasoning: string[];
  };
  recommendations: any[];
}

interface MonitoringMetric {
  id: string;
  name: string;
  type: string;
  category: string;
  currentValue: number;
  previousValue: number;
  threshold: {
    warning: number;
    critical: number;
    direction: 'above' | 'below';
  };
  trend: {
    direction: 'increasing' | 'decreasing' | 'stable';
    velocity: number;
  };
  lastUpdated: string;
}

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  type: string;
  title: string;
  description: string;
  createdAt: string;
  acknowledgement: {
    acknowledged: boolean;
  };
  resolution: {
    resolved: boolean;
  };
}

interface IntelligenceDashboardProps {
  className?: string;
}

export default function IntelligenceDashboard({ className = '' }: IntelligenceDashboardProps) {
  const [activeTab, setActiveTab] = useState<'predictions' | 'monitoring' | 'automation'>(
    'predictions'
  );
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [metrics, setMetrics] = useState<MonitoringMetric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [automationStats, setAutomationStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadDashboardData();
    if (realTimeEnabled) {
      const interval = setInterval(loadDashboardData, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [realTimeEnabled]);

  const loadDashboardData = async () => {
    try {
      // Load predictions
      const predictionsResponse = await fetch('/api/intelligence/predictions');
      if (predictionsResponse.ok) {
        const predictionsData = await predictionsResponse.json();
        setPredictions(predictionsData.predictions || []);
      }

      // Load monitoring data
      const monitoringResponse = await fetch('/api/intelligence/monitoring');
      if (monitoringResponse.ok) {
        const monitoringData = await monitoringResponse.json();
        setMetrics(monitoringData.metrics || []);
        setAlerts(monitoringData.alerts?.active || []);
      }

      // Load automation stats
      const automationResponse = await fetch('/api/intelligence/automation');
      if (automationResponse.ok) {
        const automationData = await automationResponse.json();
        setAutomationStats(automationData.automation || null);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'emergency':
        return 'text-red-600 bg-red-100';
      case 'high':
      case 'warning':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
      case 'info':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (direction: string, velocity: number) => {
    if (direction === 'stable' || Math.abs(velocity) < 0.1) {
      return <MinusIcon className="h-4 w-4 text-gray-500" />;
    } else if (direction === 'increasing') {
      return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
    } else {
      return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />;
    }
  };

  const getMetricStatus = (metric: MonitoringMetric) => {
    const { currentValue, threshold } = metric;
    if (threshold.direction === 'above') {
      if (currentValue >= threshold.critical) return 'critical';
      if (currentValue >= threshold.warning) return 'warning';
    } else {
      if (currentValue <= threshold.critical) return 'critical';
      if (currentValue <= threshold.warning) return 'warning';
    }
    return 'normal';
  };

  if (loading) {
    return (
      <div className={`card-elevated p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gray-300 rounded"></div>
            <div className="h-6 bg-gray-300 rounded w-64"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <CpuChipIcon className="h-8 w-8 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">AI Intelligence Center</h2>
              <p className="text-gray-600">
                Predictive analytics, automated decisions, and real-time monitoring
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
            <button
              onClick={() => setRealTimeEnabled(!realTimeEnabled)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                realTimeEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {realTimeEnabled ? (
                <PlayIcon className="h-4 w-4" />
              ) : (
                <PauseIcon className="h-4 w-4" />
              )}
              <span>{realTimeEnabled ? 'Live' : 'Paused'}</span>
            </button>
          </div>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <BoltIcon className="h-6 w-6 text-blue-600" />
              <div>
                <div className="text-sm text-blue-700">Predictions</div>
                <div className="text-2xl font-bold text-blue-900">{predictions.length}</div>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <ChartBarIcon className="h-6 w-6 text-green-600" />
              <div>
                <div className="text-sm text-green-700">Metrics</div>
                <div className="text-2xl font-bold text-green-900">{metrics.length}</div>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <BellIcon className="h-6 w-6 text-orange-600" />
              <div>
                <div className="text-sm text-orange-700">Active Alerts</div>
                <div className="text-2xl font-bold text-orange-900">
                  {alerts.filter((a) => !a.resolution.resolved).length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
              <div>
                <div className="text-sm text-purple-700">Automation</div>
                <div className="text-2xl font-bold text-purple-900">
                  {automationStats?.stats?.totalRules || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card-elevated">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'predictions', name: 'Predictions', icon: BoltIcon },
              { id: 'monitoring', name: 'Monitoring', icon: ChartBarIcon },
              { id: 'automation', name: 'Automation', icon: Cog6ToothIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'predictions' && (
              <motion.div
                key="predictions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900">AI Predictions</h3>
                {predictions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <BoltIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No predictions available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {predictions.slice(0, 10).map((prediction) => (
                      <div
                        key={prediction.id}
                        className="card-interactive p-4 border border-gray-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(prediction.prediction.severity)}`}
                              >
                                {prediction.prediction.severity}
                              </span>
                              <span className="text-sm text-gray-500 capitalize">
                                {prediction.prediction.outcome}
                              </span>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">
                              {prediction.targetEntity.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {Math.round(prediction.prediction.probability * 100)}% probability in{' '}
                              {prediction.prediction.timeframe} days
                            </p>
                            <div className="text-xs text-gray-500">
                              AI Confidence: {prediction.confidence.score}%
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              {Math.round(prediction.prediction.probability * 100)}%
                            </div>
                            <div className="text-sm text-gray-500">
                              {prediction.prediction.timeframe}d
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'monitoring' && (
              <motion.div
                key="monitoring"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900">Real-time Monitoring</h3>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {metrics.map((metric) => {
                    const status = getMetricStatus(metric);
                    const statusColor =
                      status === 'critical'
                        ? 'border-red-500 bg-red-50'
                        : status === 'warning'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-green-500 bg-green-50';

                    return (
                      <div
                        key={metric.id}
                        className={`card-secondary p-4 border-l-4 ${statusColor}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{metric.name}</h4>
                          {getTrendIcon(metric.trend.direction, metric.trend.velocity)}
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {metric.type === 'gauge' && metric.category === 'performance'
                            ? `${metric.currentValue}%`
                            : metric.currentValue}
                        </div>
                        <div className="text-sm text-gray-600">
                          {metric.trend.direction === 'stable'
                            ? 'Stable'
                            : metric.trend.direction === 'increasing'
                              ? '↗ Increasing'
                              : '↘ Decreasing'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Active Alerts */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Active Alerts</h4>
                  {alerts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircleIcon className="h-12 w-12 mx-auto mb-2 text-green-400" />
                      <p>No active alerts</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {alerts.slice(0, 5).map((alert) => (
                        <div key={alert.id} className="card-secondary p-4">
                          <div className="flex items-start space-x-3">
                            <div className={`p-1 rounded-full ${getSeverityColor(alert.severity)}`}>
                              {alert.severity === 'critical' || alert.severity === 'emergency' ? (
                                <ExclamationTriangleIcon className="h-4 w-4" />
                              ) : (
                                <BellIcon className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{alert.title}</h5>
                              <p className="text-sm text-gray-600">{alert.description}</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                <span>{new Date(alert.createdAt).toLocaleTimeString()}</span>
                                <span className="capitalize">{alert.type}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'automation' && (
              <motion.div
                key="automation"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900">Automated Decision Engine</h3>

                {automationStats ? (
                  <div className="space-y-6">
                    {/* Automation Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-sm text-blue-700">Total Rules</div>
                        <div className="text-2xl font-bold text-blue-900">
                          {automationStats.stats?.totalRules || 0}
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-sm text-green-700">Active Rules</div>
                        <div className="text-2xl font-bold text-green-900">
                          {automationStats.stats?.activeRules || 0}
                        </div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-sm text-purple-700">Success Rate</div>
                        <div className="text-2xl font-bold text-purple-900">
                          {Math.round((automationStats.stats?.successRate || 0) * 100)}%
                        </div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-sm text-orange-700">Avg Impact</div>
                        <div className="text-2xl font-bold text-orange-900">
                          {Math.round((automationStats.stats?.averageImpact || 0) * 100)}%
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="card-secondary p-4">
                      <h4 className="font-semibold text-gray-900 mb-4">Performance Metrics</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="text-sm text-gray-600 mb-2">Response Time</div>
                          <div className="text-lg font-bold text-gray-900">
                            {automationStats.performance?.averageResponseTime || 0}ms
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-2">Decisions/Hour</div>
                          <div className="text-lg font-bold text-gray-900">
                            {automationStats.performance?.decisionsPerHour || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-2">Uptime</div>
                          <div className="text-lg font-bold text-gray-900">
                            {automationStats.performance?.uptime || 0}%
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-2">Automation Rate</div>
                          <div className="text-lg font-bold text-gray-900">
                            {automationStats.performance?.automationRate || 0}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Capabilities */}
                    <div className="card-secondary p-4">
                      <h4 className="font-semibold text-gray-900 mb-4">Capabilities</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(automationStats.capabilities || {}).map(
                          ([key, enabled]) => (
                            <div key={key} className="flex items-center space-x-2">
                              {enabled ? (
                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                              ) : (
                                <ClockIcon className="h-5 w-5 text-gray-400" />
                              )}
                              <span className="text-sm text-gray-700 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Cog6ToothIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Automation data not available</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
