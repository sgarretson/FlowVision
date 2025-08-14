import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  UserIcon,
  LockClosedIcon,
  ServerIcon,
  GlobeAltIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

interface SecurityAuditResult {
  score: number;
  issues: SecurityIssue[];
  recommendations: SecurityRecommendation[];
  summary: SecuritySummary;
  auditedAt: string;
  auditedBy: {
    id: string;
    email: string;
    name: string;
  };
}

interface SecurityIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  impact: string;
  remediation: string;
  affectedEndpoints?: string[];
}

interface SecurityRecommendation {
  id: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  implementation: string;
  estimatedEffort: string;
}

interface SecuritySummary {
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  authenticationScore: number;
  authorizationScore: number;
  dataProtectionScore: number;
  apiSecurityScore: number;
  sessionManagementScore: number;
}

export default function SecurityDashboard() {
  const { data: session } = useSession();
  const [auditResult, setAuditResult] = useState<SecurityAuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  const runSecurityAudit = async () => {
    if (!isAdmin) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/security-audit');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run security audit');
      }

      const data = await response.json();
      setAuditResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      runSecurityAudit();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="card-secondary p-8 text-center">
        <ShieldExclamationIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">
          You need administrator privileges to access the security dashboard.
        </p>
      </div>
    );
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      case 'high':
        return <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />;
      case 'medium':
        return <InformationCircleIcon className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <InformationCircleIcon className="w-5 h-5 text-blue-600" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication':
        return <KeyIcon className="w-5 h-5" />;
      case 'authorization':
        return <UserIcon className="w-5 h-5" />;
      case 'data':
        return <ServerIcon className="w-5 h-5" />;
      case 'api':
        return <GlobeAltIcon className="w-5 h-5" />;
      case 'session':
        return <LockClosedIcon className="w-5 h-5" />;
      default:
        return <ShieldCheckIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ShieldCheckIcon className="w-8 h-8 mr-3" />
            Security Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive security analysis and recommendations for FlowVision
          </p>
        </div>
        <button
          onClick={runSecurityAudit}
          disabled={loading}
          className="btn-primary flex items-center disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Running Audit...
            </>
          ) : (
            <>
              <ShieldCheckIcon className="w-5 h-5 mr-2" />
              Run Security Audit
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="card-secondary border-l-4 border-red-500 p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Security Audit Failed</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {auditResult && (
        <>
          {/* Overall Score */}
          <div className="card-secondary p-6">
            <div className="text-center">
              <div className={`text-6xl font-bold ${getScoreColor(auditResult.score)} mb-2`}>
                {auditResult.score}
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Overall Security Score</h2>
              <p className="text-sm text-gray-600">
                Last audited on {new Date(auditResult.auditedAt).toLocaleString()} by{' '}
                {auditResult.auditedBy.name}
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="card-secondary p-4">
              <div className="flex items-center">
                <KeyIcon className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Authentication</p>
                  <p
                    className={`text-xl font-bold ${getScoreColor(auditResult.summary.authenticationScore)}`}
                  >
                    {auditResult.summary.authenticationScore}
                  </p>
                </div>
              </div>
            </div>

            <div className="card-secondary p-4">
              <div className="flex items-center">
                <UserIcon className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Authorization</p>
                  <p
                    className={`text-xl font-bold ${getScoreColor(auditResult.summary.authorizationScore)}`}
                  >
                    {auditResult.summary.authorizationScore}
                  </p>
                </div>
              </div>
            </div>

            <div className="card-secondary p-4">
              <div className="flex items-center">
                <ServerIcon className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Data Protection</p>
                  <p
                    className={`text-xl font-bold ${getScoreColor(auditResult.summary.dataProtectionScore)}`}
                  >
                    {auditResult.summary.dataProtectionScore}
                  </p>
                </div>
              </div>
            </div>

            <div className="card-secondary p-4">
              <div className="flex items-center">
                <GlobeAltIcon className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">API Security</p>
                  <p
                    className={`text-xl font-bold ${getScoreColor(auditResult.summary.apiSecurityScore)}`}
                  >
                    {auditResult.summary.apiSecurityScore}
                  </p>
                </div>
              </div>
            </div>

            <div className="card-secondary p-4">
              <div className="flex items-center">
                <LockClosedIcon className="w-8 h-8 text-indigo-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Session Mgmt</p>
                  <p
                    className={`text-xl font-bold ${getScoreColor(auditResult.summary.sessionManagementScore)}`}
                  >
                    {auditResult.summary.sessionManagementScore}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Issues Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card-secondary p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {auditResult.summary.criticalIssues}
              </div>
              <p className="text-sm text-gray-600">Critical Issues</p>
            </div>
            <div className="card-secondary p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {auditResult.summary.highIssues}
              </div>
              <p className="text-sm text-gray-600">High Issues</p>
            </div>
            <div className="card-secondary p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {auditResult.summary.mediumIssues}
              </div>
              <p className="text-sm text-gray-600">Medium Issues</p>
            </div>
            <div className="card-secondary p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {auditResult.summary.lowIssues}
              </div>
              <p className="text-sm text-gray-600">Low Issues</p>
            </div>
          </div>

          {/* Security Issues */}
          {auditResult.issues.length > 0 && (
            <div className="card-secondary">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Security Issues</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Identified security vulnerabilities requiring attention
                </p>
              </div>
              <div className="divide-y divide-gray-200">
                {auditResult.issues.map((issue) => (
                  <div key={issue.id} className="p-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-4">{getSeverityIcon(issue.severity)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-medium text-gray-900">{issue.title}</h4>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-md border ${getSeverityColor(issue.severity)}`}
                          >
                            {issue.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{issue.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <h5 className="font-medium text-gray-900 mb-1">Impact:</h5>
                            <p className="text-sm text-gray-600">{issue.impact}</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900 mb-1">Remediation:</h5>
                            <p className="text-sm text-gray-600">{issue.remediation}</p>
                          </div>
                        </div>
                        {issue.affectedEndpoints && issue.affectedEndpoints.length > 0 && (
                          <div className="mt-3">
                            <h5 className="font-medium text-gray-900 mb-1">Affected Endpoints:</h5>
                            <div className="flex flex-wrap gap-2">
                              {issue.affectedEndpoints.map((endpoint, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                >
                                  {endpoint}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {auditResult.recommendations.length > 0 && (
            <div className="card-secondary">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Security Recommendations</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Prioritized actions to improve your security posture
                </p>
              </div>
              <div className="divide-y divide-gray-200">
                {auditResult.recommendations.slice(0, 10).map((rec) => (
                  <div key={rec.id} className="p-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-4">{getCategoryIcon(rec.category)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-medium text-gray-900">{rec.title}</h4>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-md ${
                                rec.priority === 'immediate'
                                  ? 'bg-red-100 text-red-800'
                                  : rec.priority === 'high'
                                    ? 'bg-orange-100 text-orange-800'
                                    : rec.priority === 'medium'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {rec.priority.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center">
                              <ClockIcon className="w-3 h-3 mr-1" />
                              {rec.estimatedEffort}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-2">{rec.description}</p>
                        <div className="mt-3">
                          <h5 className="font-medium text-gray-900 mb-1">Implementation:</h5>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md font-mono">
                            {rec.implementation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
