'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Cog6ToothIcon,
  AdjustmentsHorizontalIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  EyeIcon,
  PencilIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { systemConfig } from '@/lib/system-config';

interface ConfigurationItem {
  id: string;
  category: string;
  key: string;
  value: any;
  dataType: string;
  description: string;
  environment: string;
  scope: string;
  isActive: boolean;
  version: number;
  tags: string[];
  updatedAt: string;
}

const CATEGORIES = [
  {
    id: 'scoring',
    name: 'Scoring & Thresholds',
    description: 'Issue priority and validation scoring configuration',
  },
  { id: 'ai', name: 'AI Configuration', description: 'AI model settings and parameters' },
  {
    id: 'performance',
    name: 'Performance Settings',
    description: 'Timeout values and performance tuning',
  },
  { id: 'ux', name: 'User Experience', description: 'UI timing and interaction settings' },
];

export default function SystemConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [configurations, setConfigurations] = useState<ConfigurationItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('scoring');
  const [editingConfig, setEditingConfig] = useState<ConfigurationItem | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check authentication and authorization
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth');
      return;
    }

    // Check if user has admin role
    if (session.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    loadConfigurations();
  }, [session, status, router]);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/system-config');
      if (response.ok) {
        const data = await response.json();
        setConfigurations(data);
      } else {
        setError('Failed to load configurations');
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
      setError('Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfiguration = async (config: ConfigurationItem) => {
    try {
      setSaveLoading(true);
      setError('');

      const response = await fetch('/api/admin/system-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: config.id,
          value: config.value,
          description: config.description,
          isActive: config.isActive,
        }),
      });

      if (response.ok) {
        setSuccess('Configuration updated successfully');
        setEditingConfig(null);
        await loadConfigurations();

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      setError('Failed to save configuration');
    } finally {
      setSaveLoading(false);
    }
  };

  const filteredConfigurations = configurations.filter(
    (config) => config.category === selectedCategory
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="mt-8 h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Cog6ToothIcon className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">System Configuration</h1>
          </div>
          <p className="text-gray-600">
            Manage business rules, scoring thresholds, and system settings
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
            <span className="text-green-700">{success}</span>
          </div>
        )}

        {/* Category Navigation */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-4 rounded-lg text-left transition-all duration-200 ${
                selectedCategory === category.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-purple-50 hover:text-purple-600'
              }`}
            >
              <h3 className="font-semibold mb-1">{category.name}</h3>
              <p className="text-sm opacity-80">{category.description}</p>
            </button>
          ))}
        </div>

        {/* Configuration List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {CATEGORIES.find((c) => c.id === selectedCategory)?.name} Configuration
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    previewMode
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <EyeIcon className="w-4 h-4 inline mr-1" />
                  Preview Mode
                </button>
                <button
                  onClick={loadConfigurations}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
                >
                  <ArrowPathIcon className="w-4 h-4 inline mr-1" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {filteredConfigurations.length === 0 ? (
              <div className="text-center py-12">
                <AdjustmentsHorizontalIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No configurations found</h3>
                <p className="text-gray-500">No configurations available for this category.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredConfigurations.map((config) => (
                  <ConfigurationCard
                    key={config.id}
                    config={config}
                    isEditing={editingConfig?.id === config.id}
                    isPreview={previewMode}
                    onEdit={setEditingConfig}
                    onSave={handleSaveConfiguration}
                    onCancel={() => setEditingConfig(null)}
                    saveLoading={saveLoading}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ConfigurationCardProps {
  config: ConfigurationItem;
  isEditing: boolean;
  isPreview: boolean;
  onEdit: (config: ConfigurationItem) => void;
  onSave: (config: ConfigurationItem) => void;
  onCancel: () => void;
  saveLoading: boolean;
}

function ConfigurationCard({
  config,
  isEditing,
  isPreview,
  onEdit,
  onSave,
  onCancel,
  saveLoading,
}: ConfigurationCardProps) {
  const [editedConfig, setEditedConfig] = useState<ConfigurationItem>(config);
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    setEditedConfig(config);
    setJsonError('');
  }, [config, isEditing]);

  const handleValueChange = (newValue: string) => {
    try {
      let parsedValue;
      if (config.dataType === 'json' || config.dataType === 'array') {
        parsedValue = JSON.parse(newValue);
      } else if (config.dataType === 'number') {
        parsedValue = Number(newValue);
      } else if (config.dataType === 'boolean') {
        parsedValue = newValue === 'true';
      } else {
        parsedValue = newValue;
      }

      setEditedConfig({ ...editedConfig, value: parsedValue });
      setJsonError('');
    } catch (error) {
      setJsonError('Invalid JSON format');
    }
  };

  const formatValue = (value: any, dataType: string): string => {
    if (dataType === 'json' || dataType === 'array') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-medium text-gray-900">{config.key}</h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                config.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {config.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              v{config.version}
            </span>
          </div>

          {isEditing ? (
            <input
              type="text"
              value={editedConfig.description}
              onChange={(e) => setEditedConfig({ ...editedConfig, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Configuration description"
            />
          ) : (
            <p className="text-gray-600 text-sm mb-3">{config.description}</p>
          )}
        </div>

        {!isPreview && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => onSave(editedConfig)}
                  disabled={saveLoading || !!jsonError}
                  className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  {saveLoading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={onCancel}
                  className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => onEdit(config)}
                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                <PencilIcon className="w-4 h-4 inline mr-1" />
                Edit
              </button>
            )}
          </div>
        )}
      </div>

      {/* Value Editor/Display */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Value ({config.dataType})
        </label>

        {isEditing ? (
          <div>
            {config.dataType === 'json' || config.dataType === 'array' ? (
              <textarea
                value={formatValue(editedConfig.value, config.dataType)}
                onChange={(e) => handleValueChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm font-mono ${
                  jsonError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                rows={6}
                placeholder="Enter JSON value"
              />
            ) : config.dataType === 'boolean' ? (
              <select
                value={String(editedConfig.value)}
                onChange={(e) => handleValueChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            ) : (
              <input
                type={config.dataType === 'number' ? 'number' : 'text'}
                value={formatValue(editedConfig.value, config.dataType)}
                onChange={(e) => handleValueChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Enter value"
              />
            )}

            {jsonError && <p className="mt-1 text-sm text-red-600">{jsonError}</p>}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto">
              {formatValue(config.value, config.dataType)}
            </pre>
          </div>
        )}
      </div>

      {/* Configuration Metadata */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500">
        <div>
          <span className="font-medium">Environment:</span> {config.environment}
        </div>
        <div>
          <span className="font-medium">Scope:</span> {config.scope}
        </div>
        <div>
          <span className="font-medium">Tags:</span> {config.tags.join(', ') || 'None'}
        </div>
        <div>
          <span className="font-medium">Updated:</span>{' '}
          {new Date(config.updatedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
