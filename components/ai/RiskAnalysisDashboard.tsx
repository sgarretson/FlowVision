'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  InformationCircleIcon,
  ClockIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';

interface RiskAlert {
  systemId: string;
  systemName: string;
  riskScore: number;
  alertLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  actionRequired: boolean;
}

interface SystemRiskAnalysis {
  systemId: string;
  systemName: string;
  systemType: string;
  currentMetrics: {
    totalIssues: number;
    criticalIssues: number;
    averageHeatScore: number;
    trendDirection: 'UP' | 'DOWN' | 'STABLE';
    velocityChange: number;
  };
  predictions: Array<{
    currentRiskScore: number;
    predictedRiskScore: number;
    riskTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
    confidence: number;
    timeframe: number;
    factors: Array<{
      factor: string;
      impact: 'HIGH' | 'MEDIUM' | 'LOW';
      likelihood: number;
      description: string;
    }>;
    recommendations: string[];
    reasoning: string;
  }>;
}

export default function RiskAnalysisDashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'alerts' | 'analysis'>('alerts');

  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [systemAnalyses, setSystemAnalyses] = useState<SystemRiskAnalysis[]>([]);
  const [timeframeDays, setTimeframeDays] = useState(30);
  const [riskThreshold, setRiskThreshold] = useState(75);

  useEffect(() => {
    if (session) {
      fetchRiskAlerts();
    }
  }, [session]);

  const fetchRiskAlerts = async () => {
    try {
      const response = await fetch('/api/ai/systems/risk-analysis?alertsOnly=true');
      if (response.ok) {
        const data = await response.json();
        setRiskAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching risk alerts:', error);
    }
  };

  const runRiskAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/systems/risk-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeframeDays,
          includeAlerts: true,
          riskThreshold,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSystemAnalyses(data.analysis.systemAnalyses || []);
        setRiskAlerts(data.analysis.riskAlerts || []);
        setActiveView('analysis');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to run risk analysis');
      }
    } catch (error) {
      setError('Network error running risk analysis');
    } finally {
      setLoading(false);
    }
  };

  const getAlertLevelColor = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'HIGH':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'MEDIUM':
        return <InformationCircleIcon className="h-5 w-5 text-yellow-500" />;
      case 'LOW':
        return <ShieldCheckIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'INCREASING':
      case 'UP':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-red-500" />;
      case 'DECREASING':
      case 'DOWN':
        return <ArrowTrendingDownIcon className="h-4 w-4 text-green-500" />;
      default:
        return <MinusIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    if (score >= 40) return 'text-blue-600 bg-blue-50';
    return 'text-green-600 bg-green-50';
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

  if (!session) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Authentication Required</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please sign in to access Risk Analysis Dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Risk Analysis Dashboard</h2>
              <p className="text-sm text-gray-500">
                AI-powered predictive risk assessment for systems
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {loading && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                <span>Analyzing Risks...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Forecast Period
              </label>
              <select
                value={timeframeDays}
                onChange={(e) => setTimeframeDays(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Risk Threshold</label>
              <select
                value={riskThreshold}
                onChange={(e) => setRiskThreshold(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm"
              >
                <option value={50}>50% - Low</option>
                <option value={75}>75% - Medium</option>
                <option value={85}>85% - High</option>
                <option value={95}>95% - Critical</option>
              </select>
            </div>
          </div>

          <button
            onClick={runRiskAnalysis}
            disabled={loading}
            className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
            Run Analysis
          </button>
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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          {[
            { id: 'alerts', name: 'Risk Alerts', count: riskAlerts.length },
            { id: 'analysis', name: 'System Analysis', count: systemAnalyses.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`${
                activeView === tab.id
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              {tab.name}
              {tab.count > 0 && (
                <span
                  className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeView === tab.id ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeView === 'alerts' && (
          <div>
            {riskAlerts.length === 0 ? (
              <div className="text-center py-12">
                <ShieldCheckIcon className="mx-auto h-12 w-12 text-green-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Active Risk Alerts</h3>
                <p className="mt-1 text-sm text-gray-500">
                  All systems are operating within acceptable risk parameters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {riskAlerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${getAlertLevelColor(alert.alertLevel)}`}
                  >
                    <div className="flex items-start space-x-3">
                      {getAlertIcon(alert.alertLevel)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{alert.systemName}</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold">{alert.riskScore}%</span>
                            {alert.actionRequired && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                Action Required
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm mt-1">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === 'analysis' && (
          <div>
            {systemAnalyses.length === 0 ? (
              <div className="text-center py-12">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Analysis Available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Click "Run Analysis" to generate AI-powered risk predictions for your systems.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {systemAnalyses.map((analysis, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {getSystemTypeIcon(analysis.systemType)}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {analysis.systemName}
                          </h3>
                          <p className="text-sm text-gray-500 capitalize">
                            {analysis.systemType.toLowerCase()} System
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          {getTrendIcon(analysis.currentMetrics.trendDirection)}
                          <span className="text-sm text-gray-500">
                            {analysis.currentMetrics.velocityChange >= 0 ? '+' : ''}
                            {analysis.currentMetrics.velocityChange}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Current Metrics */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {analysis.currentMetrics.totalIssues}
                        </div>
                        <div className="text-sm text-gray-500">Total Issues</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {analysis.currentMetrics.criticalIssues}
                        </div>
                        <div className="text-sm text-gray-500">Critical Issues</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {analysis.currentMetrics.averageHeatScore}
                        </div>
                        <div className="text-sm text-gray-500">Avg Heat Score</div>
                      </div>
                    </div>

                    {/* Predictions */}
                    {analysis.predictions.map((prediction, predIndex) => (
                      <div key={predIndex} className="border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <ClockIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">
                              {prediction.timeframe}-day Forecast
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getTrendIcon(prediction.riskTrend)}
                            <span className="text-sm text-gray-500 capitalize">
                              {prediction.riskTrend.toLowerCase()}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div
                            className={`text-center p-3 rounded-lg ${getRiskScoreColor(prediction.currentRiskScore)}`}
                          >
                            <div className="text-xl font-bold">{prediction.currentRiskScore}%</div>
                            <div className="text-sm">Current Risk</div>
                          </div>
                          <div
                            className={`text-center p-3 rounded-lg ${getRiskScoreColor(prediction.predictedRiskScore)}`}
                          >
                            <div className="text-xl font-bold">
                              {prediction.predictedRiskScore}%
                            </div>
                            <div className="text-sm">Predicted Risk</div>
                          </div>
                        </div>

                        {/* Risk Factors */}
                        {prediction.factors.length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Risk Factors</h5>
                            <div className="space-y-2">
                              {prediction.factors.slice(0, 3).map((factor, factorIndex) => (
                                <div
                                  key={factorIndex}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span className="text-gray-700">{factor.factor}</span>
                                  <div className="flex items-center space-x-2">
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-medium ${
                                        factor.impact === 'HIGH'
                                          ? 'bg-red-100 text-red-800'
                                          : factor.impact === 'MEDIUM'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-green-100 text-green-800'
                                      }`}
                                    >
                                      {factor.impact}
                                    </span>
                                    <span className="text-gray-500">{factor.likelihood}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommendations */}
                        {prediction.recommendations.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">
                              AI Recommendations
                            </h5>
                            <div className="space-y-1">
                              {prediction.recommendations.slice(0, 2).map((rec, recIndex) => (
                                <div key={recIndex} className="flex items-start space-x-2 text-sm">
                                  <ArrowTrendingUpIcon className="h-3 w-3 text-blue-500 mt-1 flex-shrink-0" />
                                  <span className="text-gray-700">{rec}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Confidence */}
                        <div className="mt-3 text-right">
                          <span className="text-xs text-gray-500">
                            Confidence: {prediction.confidence}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
