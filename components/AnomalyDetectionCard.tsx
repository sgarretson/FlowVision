'use client';

import React, { useState } from 'react';
import {
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import type { AnomalyDetection } from '@/lib/predictive-analytics';

interface AnomalyDetectionCardProps {
  anomalies: AnomalyDetection[];
  loading?: boolean;
}

export default function AnomalyDetectionCard({ anomalies, loading }: AnomalyDetectionCardProps) {
  const [expandedAnomaly, setExpandedAnomaly] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="card-primary p-6 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="skeleton h-6 w-6 rounded"></div>
          <div className="skeleton h-6 w-40"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-16 w-full rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    const iconClass =
      severity === 'critical'
        ? 'text-red-600'
        : severity === 'high'
          ? 'text-orange-600'
          : severity === 'medium'
            ? 'text-yellow-600'
            : 'text-blue-600';
    return <ExclamationTriangleIcon className={`w-5 h-5 ${iconClass}`} />;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'issue_spike':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'initiative_delay':
        return <ClockIcon className="w-4 h-4" />;
      default:
        return <MagnifyingGlassIcon className="w-4 h-4" />;
    }
  };

  if (anomalies.length === 0) {
    return (
      <div className="card-secondary p-6 bg-green-50 border-2 border-green-200">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheckIcon className="w-6 h-6 text-green-600" />
          <h3 className="text-h3 text-gray-900">Anomaly Detection</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheckIcon className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-700 font-medium">No anomalies detected</p>
          <p className="text-sm text-gray-600 mt-1">
            All systems operating within normal parameters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-primary p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MagnifyingGlassIcon className="w-6 h-6 text-orange-600" />
          <h3 className="text-h3 text-gray-900">Anomaly Detection</h3>
        </div>
        <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium">
          {anomalies.length} Detected
        </div>
      </div>

      {/* Anomalies List */}
      <div className="space-y-3">
        {anomalies.map((anomaly) => (
          <div
            key={anomaly.id}
            className={`border-2 rounded-xl p-4 transition-all duration-200 cursor-pointer hover:shadow-md ${getSeverityColor(anomaly.severity)}`}
            onClick={() => setExpandedAnomaly(expandedAnomaly === anomaly.id ? null : anomaly.id)}
          >
            {/* Anomaly Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="flex items-center gap-2 mt-0.5">
                  {getSeverityIcon(anomaly.severity)}
                  {getTypeIcon(anomaly.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                    {anomaly.title}
                  </h4>
                  <p className="text-sm text-gray-700 line-clamp-2">{anomaly.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                    <span>Impact: {anomaly.impactArea}</span>
                    <span>Detected: {anomaly.detectedAt.toLocaleDateString()}</span>
                    <span className="font-medium">
                      Deviation: {anomaly.deviation > 0 ? '+' : ''}
                      {Math.round(anomaly.deviation)}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRightIcon
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 flex-shrink-0 ${
                  expandedAnomaly === anomaly.id ? 'rotate-90' : ''
                }`}
              />
            </div>

            {/* Expanded Details */}
            {expandedAnomaly === anomaly.id && (
              <div className="mt-4 pt-4 border-t border-current border-opacity-20 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Root Causes</h5>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {anomaly.rootCause.map((cause, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-current rounded-full mt-2 flex-shrink-0 opacity-60"></div>
                          <span>{cause}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Metrics</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expected:</span>
                        <span className="font-medium">{Math.round(anomaly.expectedValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Actual:</span>
                        <span className="font-medium">{Math.round(anomaly.actualValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Deviation:</span>
                        <span
                          className={`font-medium ${anomaly.deviation > 0 ? 'text-red-600' : 'text-green-600'}`}
                        >
                          {anomaly.deviation > 0 ? '+' : ''}
                          {Math.round(anomaly.deviation)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-current border-opacity-10">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Suggested Action</h5>
                  <p className="text-sm text-gray-700">{anomaly.suggestedAction}</p>
                </div>

                <div className="flex gap-2 pt-3">
                  <button className="btn-primary text-sm px-3 py-1">Investigate</button>
                  <button className="btn-secondary text-sm px-3 py-1">Mark Resolved</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-red-600">
              {anomalies.filter((a) => a.severity === 'critical').length}
            </div>
            <div className="text-xs text-gray-600">Critical</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-orange-600">
              {anomalies.filter((a) => a.severity === 'high').length}
            </div>
            <div className="text-xs text-gray-600">High</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-yellow-600">
              {anomalies.filter((a) => a.severity === 'medium').length}
            </div>
            <div className="text-xs text-gray-600">Medium</div>
          </div>
        </div>
      </div>
    </div>
  );
}
