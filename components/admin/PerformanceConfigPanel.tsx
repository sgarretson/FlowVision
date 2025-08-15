'use client';

import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  CpuChipIcon,
  CircleStackIcon,
  GlobeAltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { systemConfig } from '@/lib/system-config';
import type {
  APIResponseThresholds,
  DatabaseConfiguration,
  CachingStrategy,
  RateLimiting,
  MemoryManagement,
} from '@/lib/system-config';

interface PerformanceConfigPanelProps {
  onConfigUpdate?: () => void;
}

export default function PerformanceConfigPanel({ onConfigUpdate }: PerformanceConfigPanelProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'api' | 'database' | 'caching' | 'rate-limiting' | 'memory'
  >('api');

  // Configuration states
  const [apiThresholds, setApiThresholds] = useState<APIResponseThresholds | null>(null);
  const [dbConfig, setDbConfig] = useState<DatabaseConfiguration | null>(null);
  const [cachingStrategy, setCachingStrategy] = useState<CachingStrategy | null>(null);
  const [rateLimiting, setRateLimiting] = useState<RateLimiting | null>(null);
  const [memoryManagement, setMemoryManagement] = useState<MemoryManagement | null>(null);

  useEffect(() => {
    loadPerformanceConfigurations();
  }, []);

  const loadPerformanceConfigurations = async () => {
    try {
      setLoading(true);
      const [api, db, caching, rate, memory] = await Promise.all([
        systemConfig.getAPIResponseThresholds(),
        systemConfig.getDatabaseConfiguration(),
        systemConfig.getCachingStrategy(),
        systemConfig.getRateLimiting(),
        systemConfig.getMemoryManagement(),
      ]);

      setApiThresholds(api);
      setDbConfig(db);
      setCachingStrategy(caching);
      setRateLimiting(rate);
      setMemoryManagement(memory);
    } catch (error) {
      console.error('Failed to load performance configurations:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async (category: string, key: string, value: any) => {
    try {
      setSaving(`${category}-${key}`);

      const response = await fetch('/api/admin/system-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'performance',
          key,
          value,
          description: `Updated ${category} configuration`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      // Reload configurations to get latest values
      await loadPerformanceConfigurations();
      onConfigUpdate?.();
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('Failed to save configuration. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  const tabs = [
    { id: 'api' as const, name: 'API Response', icon: GlobeAltIcon, color: 'blue' },
    { id: 'database' as const, name: 'Database', icon: CircleStackIcon, color: 'green' },
    { id: 'caching' as const, name: 'Caching', icon: CpuChipIcon, color: 'purple' },
    { id: 'rate-limiting' as const, name: 'Rate Limiting', icon: ClockIcon, color: 'orange' },
    { id: 'memory' as const, name: 'Memory', icon: ChartBarIcon, color: 'red' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex space-x-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-10 w-32"></div>
          ))}
        </div>
        <div className="card-secondary p-6">
          <div className="skeleton h-4 w-48 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-16 w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? `bg-${tab.color}-600 text-white shadow-sm`
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Configuration Panels */}
      <div className="card-secondary">
        {/* API Response Thresholds */}
        {activeTab === 'api' && apiThresholds && (
          <APIThresholdsPanel
            config={apiThresholds}
            onSave={(value) => saveConfiguration('api', 'api_response_thresholds', value)}
            saving={saving === 'api-api_response_thresholds'}
          />
        )}

        {/* Database Configuration */}
        {activeTab === 'database' && dbConfig && (
          <DatabaseConfigPanel
            config={dbConfig}
            onSave={(value) => saveConfiguration('database', 'database_configuration', value)}
            saving={saving === 'database-database_configuration'}
          />
        )}

        {/* Caching Strategy */}
        {activeTab === 'caching' && cachingStrategy && (
          <CachingConfigPanel
            config={cachingStrategy}
            onSave={(value) => saveConfiguration('caching', 'caching_strategy', value)}
            saving={saving === 'caching-caching_strategy'}
          />
        )}

        {/* Rate Limiting */}
        {activeTab === 'rate-limiting' && rateLimiting && (
          <RateLimitingPanel
            config={rateLimiting}
            onSave={(value) => saveConfiguration('rate-limiting', 'rate_limiting', value)}
            saving={saving === 'rate-limiting-rate_limiting'}
          />
        )}

        {/* Memory Management */}
        {activeTab === 'memory' && memoryManagement && (
          <MemoryManagementPanel
            config={memoryManagement}
            onSave={(value) => saveConfiguration('memory', 'memory_management', value)}
            saving={saving === 'memory-memory_management'}
          />
        )}
      </div>
    </div>
  );
}

// API Response Thresholds Panel
function APIThresholdsPanel({
  config,
  onSave,
  saving,
}: {
  config: APIResponseThresholds;
  onSave: (config: APIResponseThresholds) => void;
  saving: boolean;
}) {
  const [editedConfig, setEditedConfig] = useState(config);

  const handleSave = () => {
    onSave(editedConfig);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">API Response Thresholds</h3>
          <p className="text-sm text-gray-600">
            Configure response time monitoring and alerting thresholds
          </p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warning Threshold (ms)
            </label>
            <input
              type="number"
              value={editedConfig.warning}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  warning: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="100"
              max="5000"
            />
            <p className="text-xs text-gray-500 mt-1">Log warning if response takes longer</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Critical Threshold (ms)
            </label>
            <input
              type="number"
              value={editedConfig.critical}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  critical: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              min="500"
              max="10000"
            />
            <p className="text-xs text-gray-500 mt-1">Log error if response takes longer</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timeout (ms)</label>
            <input
              type="number"
              value={editedConfig.timeout}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  timeout: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              min="5000"
              max="60000"
            />
            <p className="text-xs text-gray-500 mt-1">Hard timeout for API requests</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Health Check Threshold (ms)
            </label>
            <input
              type="number"
              value={editedConfig.healthCheck}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  healthCheck: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              min="50"
              max="1000"
            />
            <p className="text-xs text-gray-500 mt-1">Health check endpoint threshold</p>
          </div>
        </div>
      </div>

      {/* Visual Threshold Indicator */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Response Time Visualization</h4>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span className="text-xs text-gray-600">0-{editedConfig.warning}ms (Good)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
            <span className="text-xs text-gray-600">
              {editedConfig.warning}-{editedConfig.critical}ms (Warning)
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span className="text-xs text-gray-600">{editedConfig.critical}+ms (Critical)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Database Configuration Panel
function DatabaseConfigPanel({
  config,
  onSave,
  saving,
}: {
  config: DatabaseConfiguration;
  onSave: (config: DatabaseConfiguration) => void;
  saving: boolean;
}) {
  const [editedConfig, setEditedConfig] = useState(config);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Database Configuration</h3>
          <p className="text-sm text-gray-600">
            Optimize database connections and query performance
          </p>
        </div>
        <button
          onClick={() => onSave(editedConfig)}
          disabled={saving}
          className="btn-primary disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Query Timeout (ms)
            </label>
            <input
              type="number"
              value={editedConfig.queryTimeout}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  queryTimeout: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="1000"
              max="30000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Pool Connections
            </label>
            <input
              type="number"
              value={editedConfig.connectionPoolMin}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  connectionPoolMin: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="1"
              max="10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Pool Connections
            </label>
            <input
              type="number"
              value={editedConfig.connectionPoolMax}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  connectionPoolMax: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="5"
              max="50"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slow Query Threshold (ms)
            </label>
            <input
              type="number"
              value={editedConfig.slowQueryThreshold}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  slowQueryThreshold: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="100"
              max="5000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Retry Attempts</label>
            <input
              type="number"
              value={editedConfig.retryAttempts}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  retryAttempts: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="1"
              max="5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Retry Delay (ms)</label>
            <input
              type="number"
              value={editedConfig.retryDelay}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  retryDelay: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="100"
              max="5000"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Caching Configuration Panel
function CachingConfigPanel({
  config,
  onSave,
  saving,
}: {
  config: CachingStrategy;
  onSave: (config: CachingStrategy) => void;
  saving: boolean;
}) {
  const [editedConfig, setEditedConfig] = useState(config);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Caching Strategy</h3>
          <p className="text-sm text-gray-600">Configure cache TTL and eviction policies</p>
        </div>
        <button
          onClick={() => onSave(editedConfig)}
          disabled={saving}
          className="btn-primary disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default TTL (seconds)
            </label>
            <input
              type="number"
              value={editedConfig.defaultTTL}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  defaultTTL: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="60"
              max="86400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              System Config TTL (seconds)
            </label>
            <input
              type="number"
              value={editedConfig.systemConfigTTL}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  systemConfigTTL: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="300"
              max="86400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Response TTL (seconds)
            </label>
            <input
              type="number"
              value={editedConfig.aiResponseTTL}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  aiResponseTTL: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="300"
              max="7200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Session TTL (seconds)
            </label>
            <input
              type="number"
              value={editedConfig.userSessionTTL}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  userSessionTTL: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="3600"
              max="604800"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Cache Size</label>
            <input
              type="number"
              value={editedConfig.maxCacheSize}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  maxCacheSize: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="100"
              max="10000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Eviction Policy</label>
            <select
              value={editedConfig.evictionPolicy}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  evictionPolicy: e.target.value as 'LRU' | 'LFU' | 'FIFO',
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="LRU">LRU (Least Recently Used)</option>
              <option value="LFU">LFU (Least Frequently Used)</option>
              <option value="FIFO">FIFO (First In, First Out)</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={editedConfig.enableCompression}
                onChange={(e) =>
                  setEditedConfig({
                    ...editedConfig,
                    enableCompression: e.target.checked,
                  })
                }
                className="rounded border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Enable Compression</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={editedConfig.cacheWarming}
                onChange={(e) =>
                  setEditedConfig({
                    ...editedConfig,
                    cacheWarming: e.target.checked,
                  })
                }
                className="rounded border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Enable Cache Warming</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// Rate Limiting Panel
function RateLimitingPanel({
  config,
  onSave,
  saving,
}: {
  config: RateLimiting;
  onSave: (config: RateLimiting) => void;
  saving: boolean;
}) {
  const [editedConfig, setEditedConfig] = useState(config);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Rate Limiting</h3>
          <p className="text-sm text-gray-600">Configure API rate limits and throttling policies</p>
        </div>
        <button
          onClick={() => onSave(editedConfig)}
          disabled={saving}
          className="btn-primary disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Calls Per Minute
            </label>
            <input
              type="number"
              value={editedConfig.apiCallsPerMinute}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  apiCallsPerMinute: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="10"
              max="1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Calls Per Hour
            </label>
            <input
              type="number"
              value={editedConfig.apiCallsPerHour}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  apiCallsPerHour: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="100"
              max="10000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">AI Burst Limit</label>
            <input
              type="number"
              value={editedConfig.aiBurstLimit}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  aiBurstLimit: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="1"
              max="20"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Cooldown Period (ms)
            </label>
            <input
              type="number"
              value={editedConfig.aiCooldownPeriod}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  aiCooldownPeriod: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="30000"
              max="300000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Rate Multiplier
            </label>
            <input
              type="number"
              value={editedConfig.adminRateMultiplier}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  adminRateMultiplier: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="2"
              max="10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Block Duration (ms)
            </label>
            <input
              type="number"
              value={editedConfig.blockDuration}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  blockDuration: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="60000"
              max="3600000"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={editedConfig.enableRateLimiting}
            onChange={(e) =>
              setEditedConfig({
                ...editedConfig,
                enableRateLimiting: e.target.checked,
              })
            }
            className="rounded border-gray-300"
          />
          <span className="ml-2 text-sm font-medium text-gray-700">Enable Rate Limiting</span>
        </label>
      </div>
    </div>
  );
}

// Memory Management Panel
function MemoryManagementPanel({
  config,
  onSave,
  saving,
}: {
  config: MemoryManagement;
  onSave: (config: MemoryManagement) => void;
  saving: boolean;
}) {
  const [editedConfig, setEditedConfig] = useState(config);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Memory Management</h3>
          <p className="text-sm text-gray-600">
            Configure memory usage monitoring and garbage collection
          </p>
        </div>
        <button
          onClick={() => onSave(editedConfig)}
          disabled={saving}
          className="btn-primary disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Heap Warning Threshold (%)
            </label>
            <input
              type="number"
              value={editedConfig.heapWarningThreshold}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  heapWarningThreshold: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="50"
              max="95"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Heap Critical Threshold (%)
            </label>
            <input
              type="number"
              value={editedConfig.heapCriticalThreshold}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  heapCriticalThreshold: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="70"
              max="98"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GC Trigger Threshold (%)
            </label>
            <input
              type="number"
              value={editedConfig.garbageCollectionTrigger}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  garbageCollectionTrigger: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="60"
              max="95"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Request Size (bytes)
            </label>
            <input
              type="number"
              value={editedConfig.maxRequestSize}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  maxRequestSize: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="1048576"
              max="104857600"
            />
            <p className="text-xs text-gray-500 mt-1">
              {(editedConfig.maxRequestSize / (1024 * 1024)).toFixed(1)} MB
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Response Size (bytes)
            </label>
            <input
              type="number"
              value={editedConfig.maxResponseSize}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  maxResponseSize: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="1048576"
              max="104857600"
            />
            <p className="text-xs text-gray-500 mt-1">
              {(editedConfig.maxResponseSize / (1024 * 1024)).toFixed(1)} MB
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={editedConfig.enableMemoryProfiling}
                onChange={(e) =>
                  setEditedConfig({
                    ...editedConfig,
                    enableMemoryProfiling: e.target.checked,
                  })
                }
                className="rounded border-gray-300"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Enable Memory Profiling
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1">Only enable in development environments</p>
          </div>
        </div>
      </div>
    </div>
  );
}
