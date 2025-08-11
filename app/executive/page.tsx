'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
  LightBulbIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface HealthScore {
  score: number;
  trend: 'improving' | 'declining' | 'stable';
  components: {
    initiativeHealth: number;
    issueVelocity: number;
    teamUtilization: number;
    roiTrend: number;
  };
  lastUpdated: Date;
}

interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  category: 'timeline' | 'resource' | 'roi' | 'issue';
  title: string;
  description: string;
  recommendation: string;
  priority: number;
  createdAt: Date;
}

interface RoiForecast {
  current: {
    totalInvestment: number;
    realizedRoi: number;
    pendingRoi: number;
    portfolioValue: number;
  };
  forecast: {
    threeMonth: number;
    sixMonth: number;
    twelveMonth: number;
    confidence: number;
  };
  topPerformers: Array<{
    id: string;
    title: string;
    roi: number;
    status: string;
  }>;
  recommendations: string[];
}

interface ExecutiveInsight {
  id: string;
  type: 'strategic' | 'operational' | 'financial' | 'risk';
  title: string;
  summary: string;
  impact: 'high' | 'medium' | 'low';
  actionRequired: boolean;
  recommendation: string;
  confidence: number;
}

export default function ExecutiveDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [roiForecast, setRoiForecast] = useState<RoiForecast | null>(null);
  const [insights, setInsights] = useState<ExecutiveInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [utilization, setUtilization] = useState<
    Array<{ ownerId: string; name: string; activeInitiatives: number }>
  >([]);
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [alertSettings, setAlertSettings] = useState<any | null>(null);

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [healthRes, alertsRes, roiRes, insightsRes, utilRes] = await Promise.all([
        fetch('/api/executive/health-score'),
        fetch('/api/executive/alerts'),
        fetch('/api/executive/roi-forecast'),
        fetch('/api/executive/insights'),
        fetch('/api/executive/team-utilization'),
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        // Normalize ISO date string to Date
        if (healthData.lastUpdated) {
          healthData.lastUpdated = new Date(healthData.lastUpdated);
        }
        setHealthScore(healthData);
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.alerts || []);
      }

      if (roiRes.ok) {
        const roiData = await roiRes.json();
        setRoiForecast(roiData);
      }

      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        setInsights(insightsData.insights || []);
      }

      if (utilRes.ok) {
        const utilData = await utilRes.json();
        setUtilization(utilData.utilization || []);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return '📈';
    if (trend === 'declining') return '📉';
    return '➡️';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return '🚨';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const exportReport = async () => {
    try {
      const [{ jsPDF }, html2canvasModule] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);
      const html2canvas = html2canvasModule.default;

      const target = reportRef.current;
      if (!target) return;

      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = (pdf as any).getImageProperties(imgData);
      const pdfWidth = pageWidth;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // Simple paginate if content exceeds one page
      let position = 0;
      let remainingHeight = pdfHeight;
      while (remainingHeight > 0) {
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        remainingHeight -= pageHeight;
        if (remainingHeight > 0) {
          pdf.addPage();
          position -= pageHeight;
        }
      }

      pdf.save(`executive-brief-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF export failed', err);
      // Fallback: export minimal JSON summary
      const reportData = {
        healthScore,
        alerts: alerts.slice(0, 5),
        roiForecast,
        insights: insights.slice(0, 10),
        generatedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `executive-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const loadAlertSettings = async () => {
    try {
      setSettingsError(null);
      const res = await fetch('/api/alerts/settings');
      if (!res.ok) throw new Error(`Failed to load settings (${res.status})`);
      const data = await res.json();
      setAlertSettings(data.settings || null);
    } catch (e) {
      setSettingsError('Failed to load alert settings.');
    }
  };

  const saveAlertSettings = async () => {
    if (!alertSettings) return;
    try {
      setSettingsSaving(true);
      setSettingsError(null);
      const res = await fetch('/api/alerts/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: alertSettings }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSettingsOpen(false);
    } catch (e) {
      setSettingsError('Failed to save settings.');
    } finally {
      setSettingsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" ref={reportRef}>
      {/* Non-blocking error banner placeholder (surface tile errors when present) */}
      {!loading &&
        (!healthScore || alerts.length === 0 || !roiForecast || insights.length === 0) && (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
            <div
              className="bg-yellow-50 border border-yellow-200 rounded-md p-3"
              role="status"
              aria-live="polite"
            >
              <div className="text-sm text-yellow-800 flex items-center justify-between">
                <span>
                  Some dashboard tiles could not load the latest data. Showing what’s available.
                </span>
                <button className="text-yellow-900 underline" onClick={loadDashboardData}>
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Executive Command Center</h1>
              <p className="text-gray-600 mt-1">
                AI-Powered Strategic Intelligence for {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
              <button
                onClick={exportReport}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: ChartBarIcon },
              { id: 'insights', name: 'AI Insights', icon: LightBulbIcon },
              { id: 'forecasting', name: 'ROI Forecasting', icon: ArrowTrendingUpIcon },
              { id: 'alerts', name: 'Alerts', icon: ExclamationTriangleIcon },
              { id: 'utilization', name: 'Team Utilization', icon: UsersIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.name}</span>
                {tab.id === 'alerts' && alerts.length > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full ml-2">
                    {alerts.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Health Score & Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Health Score</p>
                    <p
                      className={`text-3xl font-bold ${getHealthScoreColor(healthScore?.score || 0)}`}
                    >
                      {healthScore?.score || 0}
                    </p>
                  </div>
                  <div className="text-2xl">{getTrendIcon(healthScore?.trend || 'stable')}</div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${healthScore?.score || 0}%` }}
                    ></div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                    <p className="text-3xl font-bold text-red-600">
                      {alerts.filter((a) => a.type === 'critical').length}
                    </p>
                  </div>
                  <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {alerts.filter((a) => a.type === 'warning').length} warnings
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">ROI Forecast</p>
                    <p className="text-3xl font-bold text-green-600">
                      {roiForecast?.forecast.threeMonth.toFixed(1)}%
                    </p>
                  </div>
                  <ArrowTrendingUpIcon className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {roiForecast?.forecast.confidence}% confidence
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {formatCurrency(roiForecast?.current.portfolioValue || 0)}
                    </p>
                  </div>
                  <ChartBarIcon className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Total investment: {formatCurrency(roiForecast?.current.totalInvestment || 0)}
                </p>
              </motion.div>
            </div>

            {/* Health Score Components */}
            {healthScore && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Score Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(healthScore.components).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <p className="text-sm text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">{Math.round(value)}</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 flex items-center space-x-3">
                    <UsersIcon className="w-5 h-5 text-blue-500" />
                    <span>Review Resource Allocation</span>
                  </button>
                  <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 flex items-center space-x-3">
                    <ClockIcon className="w-5 h-5 text-yellow-500" />
                    <span>Address Timeline Risks</span>
                  </button>
                  <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 flex items-center space-x-3">
                    <CalendarIcon className="w-5 h-5 text-green-500" />
                    <span>Schedule Weekly Review</span>
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Insights</h3>
                <div className="space-y-3">
                  {insights.slice(0, 3).map((insight) => (
                    <div key={insight.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getImpactColor(insight.impact)}`}
                        >
                          {insight.impact}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{insight.summary}</p>
                    </div>
                  ))}
                  <button
                    onClick={() => setActiveTab('insights')}
                    className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View all insights →
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">AI-Powered Strategic Insights</h2>
            <div className="grid grid-cols-1 gap-6">
              {insights.map((insight) => (
                <div key={insight.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getImpactColor(insight.impact)}`}
                        >
                          {insight.impact} impact
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {insight.type}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{insight.summary}</p>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Recommendation:</strong> {insight.recommendation}
                        </p>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-sm text-gray-500">Confidence</div>
                      <div className="text-2xl font-bold text-gray-900">{insight.confidence}%</div>
                      {insight.actionRequired && (
                        <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          Action Required
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'utilization' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Team Utilization</h2>
              <span className="text-sm text-gray-500">Owners with most active initiatives</span>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={utilization} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="activeInitiatives" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Owner
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Active Initiatives
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {utilization.map((u) => (
                      <tr key={u.ownerId}>
                        <td className="px-4 py-2 text-sm text-gray-900">{u.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{u.activeInitiatives}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'forecasting' && roiForecast && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">ROI Forecasting & Performance</h2>

            {/* Current ROI Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600">Total Investment</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(roiForecast.current.totalInvestment)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600">Realized ROI</h3>
                <p className="text-2xl font-bold text-green-600">
                  {roiForecast.current.realizedRoi.toFixed(1)}%
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600">Pending ROI</h3>
                <p className="text-2xl font-bold text-yellow-600">
                  {roiForecast.current.pendingRoi.toFixed(1)}%
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600">Portfolio Value</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(roiForecast.current.portfolioValue)}
                </p>
              </div>
            </div>

            {/* ROI Forecast Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ROI Forecast Timeline</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      { period: 'Current', roi: roiForecast.current.realizedRoi },
                      { period: '3 Month', roi: roiForecast.forecast.threeMonth },
                      { period: '6 Month', roi: roiForecast.forecast.sixMonth },
                      { period: '12 Month', roi: roiForecast.forecast.twelveMonth },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`${value.toFixed(1)}%`, 'ROI']} />
                    <Line type="monotone" dataKey="roi" stroke="#2563eb" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Forecast confidence: {roiForecast.forecast.confidence}%
              </p>
            </div>

            {/* Top Performers & Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Top Performing Initiatives
                </h3>
                <div className="space-y-3">
                  {roiForecast.topPerformers.map((performer) => (
                    <div
                      key={performer.id}
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{performer.title}</p>
                        <p className="text-sm text-gray-600">{performer.status}</p>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        {performer.roi.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h3>
                <div className="space-y-3">
                  {roiForecast.recommendations.map((recommendation, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'alerts' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Predictive Alerts & Risk Management</h2>
              <button
                onClick={async () => {
                  setSettingsOpen(true);
                  await loadAlertSettings();
                }}
                className="px-3 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-black"
              >
                Alert Settings
              </button>
            </div>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start space-x-4">
                    <div className="text-2xl">{getAlertIcon(alert.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            alert.type === 'critical'
                              ? 'bg-red-100 text-red-800'
                              : alert.type === 'warning'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {alert.type}
                        </span>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          {alert.category}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{alert.description}</p>
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>Recommendation:</strong> {alert.recommendation}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Priority</div>
                      <div className="text-xl font-bold text-gray-900">{alert.priority}/10</div>
                    </div>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-lg font-medium text-gray-900">No Active Alerts</h3>
                  <p className="text-gray-600">
                    Your organization is performing well with no critical issues detected.
                  </p>
                </div>
              )}
            </div>
            {settingsOpen && (
              <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center">
                <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-6 relative">
                  <button
                    onClick={() => setSettingsOpen(false)}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Settings & Weekly Brief</h3>
                  {settingsError && (
                    <div className="mb-3 p-2 rounded bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
                      {settingsError}
                    </div>
                  )}
                  {!alertSettings ? (
                    <div className="text-sm text-gray-500">Loading settings...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Timeline Behind % (warning)</label>
                        <input
                          type="number"
                          className="w-full border rounded px-2 py-1"
                          value={alertSettings.timelineBehindPct}
                          onChange={(e) => setAlertSettings({ ...alertSettings, timelineBehindPct: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Deadline Critical (days)</label>
                        <input
                          type="number"
                          className="w-full border rounded px-2 py-1"
                          value={alertSettings.deadlineDaysCritical}
                          onChange={(e) => setAlertSettings({ ...alertSettings, deadlineDaysCritical: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Max Active Initiatives per Owner</label>
                        <input
                          type="number"
                          className="w-full border rounded px-2 py-1"
                          value={alertSettings.ownerMaxActive}
                          onChange={(e) => setAlertSettings({ ...alertSettings, ownerMaxActive: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Budget Overrun Warn %</label>
                        <input
                          type="number"
                          className="w-full border rounded px-2 py-1"
                          value={alertSettings.budgetOverrunWarnPct}
                          onChange={(e) => setAlertSettings({ ...alertSettings, budgetOverrunWarnPct: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Budget Overrun Critical %</label>
                        <input
                          type="number"
                          className="w-full border rounded px-2 py-1"
                          value={alertSettings.budgetOverrunCritPct}
                          onChange={(e) => setAlertSettings({ ...alertSettings, budgetOverrunCritPct: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Low ROI %</label>
                        <input
                          type="number"
                          className="w-full border rounded px-2 py-1"
                          value={alertSettings.lowRoiPct}
                          onChange={(e) => setAlertSettings({ ...alertSettings, lowRoiPct: Number(e.target.value) })}
                        />
                      </div>
                      <div className="md:col-span-2 border-t pt-3 mt-1">
                        <div className="flex items-center space-x-3">
                          <input
                            id="digestEnabled"
                            type="checkbox"
                            className="h-4 w-4"
                            checked={!!alertSettings.digest?.enabled}
                            onChange={(e) => setAlertSettings({ ...alertSettings, digest: { ...alertSettings.digest, enabled: e.target.checked } })}
                          />
                          <label htmlFor="digestEnabled" className="text-sm text-gray-800">Enable Weekly Executive Brief</label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Channel</label>
                            <select
                              className="w-full border rounded px-2 py-1"
                              value={alertSettings.digest?.channel || 'none'}
                              onChange={(e) => setAlertSettings({ ...alertSettings, digest: { ...alertSettings.digest, channel: e.target.value } })}
                            >
                              <option value="none">None</option>
                              <option value="email">Email</option>
                              <option value="slack">Slack</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Send Time (UTC)</label>
                            <input
                              type="time"
                              className="w-full border rounded px-2 py-1"
                              value={alertSettings.digest?.timeUTC || '09:00'}
                              onChange={(e) => setAlertSettings({ ...alertSettings, digest: { ...alertSettings.digest, timeUTC: e.target.value } })}
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={exportReport}
                              className="w-full px-3 py-2 text-sm border rounded hover:bg-gray-50"
                            >
                              Send Brief Now (Download)
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mt-6 flex items-center justify-end space-x-3">
                    <button onClick={() => setSettingsOpen(false)} className="px-3 py-2 text-sm border rounded">Cancel</button>
                    <button
                      onClick={saveAlertSettings}
                      disabled={settingsSaving}
                      className={`px-4 py-2 text-sm text-white rounded ${settingsSaving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                      {settingsSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
