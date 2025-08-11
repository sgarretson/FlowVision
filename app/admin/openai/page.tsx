'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type OpenAIConfig = {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  enabled?: boolean;
  hasApiKey?: boolean;
};

type UsageStats = {
  totalRequests: number;
  totalTokens: number;
  lastUsed: string;
  costEstimate: number;
};

export default function OpenAISettings() {
  const { data: session } = useSession();
  const router = useRouter();
  const [config, setConfig] = useState<OpenAIConfig | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    error?: string;
    model?: string;
  } | null>(null);

  // Form states
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [maxTokens, setMaxTokens] = useState(500);
  const [temperature, setTemperature] = useState(0.7);
  const [enabled, setEnabled] = useState(true);

  // Check admin access
  useEffect(() => {
    if (session && (session.user as any)?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [session, router]);

  useEffect(() => {
    if (session && (session.user as any)?.role === 'ADMIN') {
      loadOpenAIConfig();
    }
  }, [session]);

  async function loadOpenAIConfig() {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/openai');

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        setUsageStats(data.usageStats);

        if (data.config) {
          setModel(data.config.model || 'gpt-3.5-turbo');
          setMaxTokens(data.config.maxTokens || 500);
          setTemperature(data.config.temperature || 0.7);
          setEnabled(data.config.enabled !== false);
        }
      } else {
        setError('Failed to load OpenAI configuration');
      }
    } catch (err) {
      console.error('Failed to load OpenAI config:', err);
      setError('Failed to load OpenAI configuration');
    } finally {
      setLoading(false);
    }
  }

  async function saveConfiguration() {
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/admin/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          model,
          maxTokens,
          temperature,
          enabled,
        }),
      });

      if (response.ok) {
        setSuccess('OpenAI configuration saved successfully');
        await loadOpenAIConfig();
        setApiKey(''); // Clear the API key field for security
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save configuration');
      }
    } catch (err) {
      console.error('Failed to save config:', err);
      setError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    if (!apiKey.trim() && !config?.hasApiKey) {
      setError('API key is required for testing');
      return;
    }

    try {
      setTesting(true);
      setError(null);
      setTestResult(null);

      const response = await fetch('/api/admin/openai', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim() || undefined,
          model,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setTestResult(result);
      } else {
        const errorData = await response.json();
        setTestResult({
          success: false,
          error: errorData.error || 'Failed to test connection',
        });
      }
    } catch (err) {
      console.error('Failed to test connection:', err);
      setTestResult({
        success: false,
        error: 'Failed to test connection',
      });
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 mb-2">OpenAI Configuration</h1>
          <p className="text-body-secondary">
            Configure OpenAI API integration for AI-powered features
          </p>
        </div>
        <Link href="/admin" className="btn-secondary">
          Back to Admin
        </Link>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-secondary p-6">
          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-3 ${
                config?.hasApiKey ? 'bg-green-500' : 'bg-red-500'
              }`}
            ></div>
            <div>
              <h3 className="text-h3">API Status</h3>
              <p className="text-caption">{config?.hasApiKey ? 'Connected' : 'Not Configured'}</p>
            </div>
          </div>
        </div>

        <div className="card-secondary p-6">
          <h3 className="text-h3">Current Model</h3>
          <p className="text-caption">{config?.model || 'Not configured'}</p>
        </div>

        <div className="card-secondary p-6">
          <h3 className="text-h3">AI Features</h3>
          <p className="text-caption">{config?.enabled ? 'Enabled' : 'Disabled'}</p>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="card-secondary">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-h2">API Configuration</h2>
          <p className="text-body-secondary mt-1">
            Configure your OpenAI API key and model parameters
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* API Key */}
          <div>
            <label htmlFor="apiKey" className="label">
              OpenAI API Key
            </label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={config?.hasApiKey ? '••••••••••••••••••••••••••••••••' : 'sk-...'}
              className="input-primary"
            />
            <p className="text-caption mt-1">
              Your API key will be encrypted and stored securely. Get your key from{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                OpenAI Platform
              </a>
            </p>
          </div>

          {/* Model Selection */}
          <div>
            <label htmlFor="model" className="label">
              Model
            </label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="input-primary"
            >
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Recommended)</option>
              <option value="gpt-3.5-turbo-16k">GPT-3.5 Turbo 16K</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
            </select>
            <p className="text-caption mt-1">GPT-3.5 Turbo is recommended for most use cases</p>
          </div>

          {/* Advanced Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="maxTokens" className="label">
                Max Tokens
              </label>
              <input
                type="number"
                id="maxTokens"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                min="1"
                max="4000"
                className="input-primary"
              />
              <p className="text-caption mt-1">Maximum tokens per response (1-4000)</p>
            </div>

            <div>
              <label htmlFor="temperature" className="label">
                Temperature
              </label>
              <input
                type="number"
                id="temperature"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                min="0"
                max="2"
                step="0.1"
                className="input-primary"
              />
              <p className="text-caption mt-1">Creativity level (0 = focused, 2 = creative)</p>
            </div>
          </div>

          {/* Enable/Disable */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="checkbox-primary"
            />
            <label htmlFor="enabled" className="label ml-2">
              Enable AI Features
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button onClick={testConnection} disabled={testing} className="btn-secondary">
              {testing ? 'Testing...' : 'Test Connection'}
            </button>

            <button onClick={saveConfiguration} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>

      {/* Test Results */}
      {testResult && (
        <div
          className={`card-secondary border-l-4 ${
            testResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
          }`}
        >
          <div className="p-6">
            <div className="flex items-center">
              <div
                className={`w-5 h-5 rounded-full mr-3 ${
                  testResult.success ? 'bg-green-500' : 'bg-red-500'
                }`}
              ></div>
              <div>
                <h3 className={`text-h3 ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  Connection Test {testResult.success ? 'Successful' : 'Failed'}
                </h3>
                {testResult.success && testResult.model && (
                  <p className="text-green-700">Connected to {testResult.model}</p>
                )}
                {!testResult.success && testResult.error && (
                  <p className="text-red-700">{testResult.error}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Statistics */}
      {usageStats && (
        <div className="card-secondary">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-h2">Usage Statistics</h2>
            <p className="text-body-secondary mt-1">Monitor your OpenAI API usage and costs</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <h3 className="text-h3">{usageStats.totalRequests}</h3>
                <p className="text-caption">Total Requests</p>
              </div>
              <div>
                <h3 className="text-h3">{usageStats.totalTokens.toLocaleString()}</h3>
                <p className="text-caption">Total Tokens</p>
              </div>
              <div>
                <h3 className="text-h3">${usageStats.costEstimate.toFixed(2)}</h3>
                <p className="text-caption">Estimated Cost</p>
              </div>
              <div>
                <h3 className="text-h3">
                  {usageStats.lastUsed
                    ? new Date(usageStats.lastUsed).toLocaleDateString()
                    : 'Never'}
                </h3>
                <p className="text-caption">Last Used</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-sm text-green-700">{success}</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
    </div>
  );
}
