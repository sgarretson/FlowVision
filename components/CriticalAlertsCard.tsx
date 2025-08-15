'use client';

import React, { useState } from 'react';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  BuildingOfficeIcon,
  ChevronRightIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import type { CriticalAlert } from '@/lib/strategic-health';

interface CriticalAlertsCardProps {
  alerts: CriticalAlert[];
  loading?: boolean;
}

export default function CriticalAlertsCard({ alerts, loading }: CriticalAlertsCardProps) {
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

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
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    const iconClass =
      severity === 'critical'
        ? 'text-red-600'
        : severity === 'high'
          ? 'text-orange-600'
          : 'text-yellow-600';
    return <ExclamationTriangleIcon className={`w-5 h-5 ${iconClass}`} />;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'issue':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'initiative':
        return <ClockIcon className="w-4 h-4" />;
      default:
        return <BuildingOfficeIcon className="w-4 h-4" />;
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="card-secondary p-6 bg-green-50 border-2 border-green-200">
        <div className="flex items-center gap-2 mb-4">
          <ExclamationTriangleIcon className="w-6 h-6 text-green-600" />
          <h3 className="text-h3 text-gray-900">Critical Attention Required</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <EyeIcon className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-700 font-medium">No critical alerts at this time</p>
          <p className="text-sm text-gray-600 mt-1">Your organization is operating smoothly</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-primary p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
          <h3 className="text-h3 text-gray-900">Critical Attention Required</h3>
        </div>
        <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
          {alerts.length} Alert{alerts.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`border-2 rounded-xl p-4 transition-all duration-200 cursor-pointer hover:shadow-md ${getSeverityColor(alert.severity)}`}
            onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
          >
            {/* Alert Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="flex items-center gap-2 mt-0.5">
                  {getSeverityIcon(alert.severity)}
                  {getTypeIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                    {alert.title}
                  </h4>
                  <p className="text-sm text-gray-700 line-clamp-2">{alert.description}</p>
                  {alert.department && (
                    <div className="flex items-center gap-1 mt-2">
                      <BuildingOfficeIcon className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-600">{alert.department}</span>
                    </div>
                  )}
                </div>
              </div>
              <ChevronRightIcon
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 flex-shrink-0 ${
                  expandedAlert === alert.id ? 'rotate-90' : ''
                }`}
              />
            </div>

            {/* Expanded Details */}
            {expandedAlert === alert.id && (
              <div className="mt-4 pt-4 border-t border-current border-opacity-20 animate-fade-in">
                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-1">Action Required</h5>
                    <p className="text-sm text-gray-700">{alert.actionRequired}</p>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-1">Estimated Impact</h5>
                    <p className="text-sm text-gray-700">{alert.estimatedImpact}</p>
                  </div>

                  {alert.deadline && (
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        Deadline: {alert.deadline.toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button className="btn-primary text-sm px-3 py-1">Take Action</button>
                    <button className="btn-secondary text-sm px-3 py-1">View Details</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* View All Link */}
      <div className="mt-4 pt-4 border-t">
        <button className="text-sm text-primary hover:underline font-medium">
          View All Alerts & Issues →
        </button>
      </div>
    </div>
  );
}
