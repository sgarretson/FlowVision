'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  SparklesIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  Squares2X2Icon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import {
  AISolutionsDashboard,
  RiskAnalysisDashboard,
  InitiativePrioritizationDashboard,
  SystemImpactVisualization,
} from '@/components/ai';

const dashboardTabs = [
  {
    id: 'solutions',
    name: 'AI Solutions',
    icon: SparklesIcon,
    description: 'Generate intelligent solution recommendations',
    component: AISolutionsDashboard,
  },
  {
    id: 'risk',
    name: 'Risk Analysis',
    icon: ExclamationTriangleIcon,
    description: 'Predictive system risk assessment',
    component: RiskAnalysisDashboard,
  },
  {
    id: 'prioritization',
    name: 'Prioritization',
    icon: ChartBarIcon,
    description: 'AI-powered initiative priority optimization',
    component: InitiativePrioritizationDashboard,
  },
  {
    id: 'visualization',
    name: 'System Impact',
    icon: Squares2X2Icon,
    description: 'Interactive system impact visualization',
    component: SystemImpactVisualization,
  },
];

export default function AIDashboardPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('solutions');

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading AI Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Authentication Required</h2>
            <p className="mt-2 text-gray-600">
              Please sign in to access the AI Intelligence Dashboard.
            </p>
            <a
              href="/auth"
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  const ActiveComponent =
    dashboardTabs.find((tab) => tab.id === activeTab)?.component || AISolutionsDashboard;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Cog6ToothIcon className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Intelligence Dashboard</h1>
                <p className="text-sm text-gray-500">
                  Advanced AI capabilities for operational excellence
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {session.user?.name}</span>
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {session.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            {dashboardTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    isActive
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Icon className="h-5 w-5" />
                  <div className="text-left">
                    <div>{tab.name}</div>
                    <div className="text-xs text-gray-400 hidden lg:block">{tab.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900">
            {dashboardTabs.find((tab) => tab.id === activeTab)?.name}
          </h2>
          <p className="text-sm text-gray-600">
            {dashboardTabs.find((tab) => tab.id === activeTab)?.description}
          </p>
        </div>

        {/* Dynamic Component */}
        <ActiveComponent />
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              FlowVision AI Intelligence Dashboard - Powered by Advanced Machine Learning
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>Sprint 4: Frontend Integration</span>
              <span>•</span>
              <span>Systems Enhancement v2.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
