/**
 * FlowVision Real-time Monitoring & Alerting System - Phase 3
 * Continuous monitoring, alerting, and intelligent notification system
 */

import { PrismaClient } from '@prisma/client';
import PredictiveEngine from './predictive-engine';
import AutomatedDecisionEngine from './automated-decision-engine';
import CorrelationEngine from './correlation-engine';

const prisma = new PrismaClient();

export interface MonitoringMetric {
  id: string;
  name: string;
  description: string;
  type: 'gauge' | 'counter' | 'histogram' | 'rate' | 'boolean';
  category: 'system' | 'business' | 'user' | 'performance';
  currentValue: number;
  previousValue: number;
  threshold: {
    warning: number;
    critical: number;
    direction: 'above' | 'below'; // Alert when value goes above/below threshold
  };
  trend: {
    direction: 'increasing' | 'decreasing' | 'stable';
    velocity: number; // Rate of change
    acceleration: number; // Rate of change of rate of change
  };
  lastUpdated: Date;
  history: MetricDataPoint[];
}

export interface MetricDataPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface RealTimeAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  type: 'threshold' | 'anomaly' | 'prediction' | 'correlation' | 'system';
  title: string;
  description: string;
  source: {
    component: string;
    entityType: 'metric' | 'prediction' | 'correlation' | 'system';
    entityId: string;
  };
  context: {
    currentValue?: number;
    threshold?: number;
    trend?: string;
    relatedAlerts?: string[];
    affectedEntities?: string[];
  };
  actionable: boolean;
  autoResolution: {
    possible: boolean;
    confidence: number;
    estimatedTime?: number; // minutes
    actions?: string[];
  };
  acknowledgement: {
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
    reason?: string;
  };
  resolution: {
    resolved: boolean;
    resolvedBy?: string;
    resolvedAt?: Date;
    resolution?: string;
    effectiveness?: number; // 0-1
  };
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface MonitoringDashboard {
  id: string;
  name: string;
  description: string;
  metrics: string[]; // Metric IDs
  layout: DashboardLayout;
  refreshInterval: number; // milliseconds
  alerts: RealTimeAlert[];
  lastRefresh: Date;
}

export interface DashboardLayout {
  columns: number;
  widgets: DashboardWidget[];
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'alert' | 'prediction' | 'correlation';
  title: string;
  size: { width: number; height: number };
  position: { x: number; y: number };
  configuration: Record<string, any>;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'teams' | 'webhook' | 'sms' | 'push';
  configuration: Record<string, any>;
  enabled: boolean;
  filters: NotificationFilter[];
}

export interface NotificationFilter {
  severity: string[];
  types: string[];
  sources: string[];
  timeRange?: { start: string; end: string }; // HH:MM format
  frequency: 'immediate' | 'batched' | 'digest';
}

export class RealTimeMonitor {
  private static instance: RealTimeMonitor;
  private predictiveEngine: PredictiveEngine;
  private decisionEngine: AutomatedDecisionEngine;
  private correlationEngine: CorrelationEngine;

  private metrics: Map<string, MonitoringMetric> = new Map();
  private alerts: Map<string, RealTimeAlert> = new Map();
  private dashboards: Map<string, MonitoringDashboard> = new Map();
  private notificationChannels: Map<string, NotificationChannel> = new Map();

  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  public static getInstance(): RealTimeMonitor {
    if (!RealTimeMonitor.instance) {
      RealTimeMonitor.instance = new RealTimeMonitor();
    }
    return RealTimeMonitor.instance;
  }

  constructor() {
    this.predictiveEngine = PredictiveEngine.getInstance();
    this.decisionEngine = AutomatedDecisionEngine.getInstance();
    this.correlationEngine = CorrelationEngine.getInstance();
    this.initializeDefaultMetrics();
    this.initializeDefaultChannels();
    this.startMonitoring();
  }

  /**
   * Initialize default monitoring metrics
   */
  private initializeDefaultMetrics(): void {
    // System Health Metrics
    this.metrics.set('system_health_score', {
      id: 'system_health_score',
      name: 'System Health Score',
      description: 'Overall system health score (0-100)',
      type: 'gauge',
      category: 'system',
      currentValue: 85,
      previousValue: 83,
      threshold: {
        warning: 70,
        critical: 50,
        direction: 'below',
      },
      trend: {
        direction: 'increasing',
        velocity: 0.5,
        acceleration: 0.1,
      },
      lastUpdated: new Date(),
      history: [],
    });

    // Issue Velocity Metric
    this.metrics.set('issue_velocity', {
      id: 'issue_velocity',
      name: 'Issue Creation Velocity',
      description: 'Rate of new issues being created (issues/day)',
      type: 'rate',
      category: 'business',
      currentValue: 3.2,
      previousValue: 2.8,
      threshold: {
        warning: 5.0,
        critical: 8.0,
        direction: 'above',
      },
      trend: {
        direction: 'increasing',
        velocity: 0.4,
        acceleration: 0.05,
      },
      lastUpdated: new Date(),
      history: [],
    });

    // Initiative Success Rate
    this.metrics.set('initiative_success_rate', {
      id: 'initiative_success_rate',
      name: 'Initiative Success Rate',
      description: 'Percentage of initiatives completed successfully',
      type: 'gauge',
      category: 'business',
      currentValue: 78,
      previousValue: 75,
      threshold: {
        warning: 60,
        critical: 40,
        direction: 'below',
      },
      trend: {
        direction: 'increasing',
        velocity: 0.8,
        acceleration: 0.2,
      },
      lastUpdated: new Date(),
      history: [],
    });

    // Resource Utilization
    this.metrics.set('resource_utilization', {
      id: 'resource_utilization',
      name: 'Resource Utilization',
      description: 'Average resource utilization across all teams',
      type: 'gauge',
      category: 'performance',
      currentValue: 73,
      previousValue: 71,
      threshold: {
        warning: 85,
        critical: 95,
        direction: 'above',
      },
      trend: {
        direction: 'increasing',
        velocity: 1.2,
        acceleration: 0.3,
      },
      lastUpdated: new Date(),
      history: [],
    });

    // Prediction Accuracy
    this.metrics.set('prediction_accuracy', {
      id: 'prediction_accuracy',
      name: 'AI Prediction Accuracy',
      description: 'Accuracy of AI predictions (percentage)',
      type: 'gauge',
      category: 'system',
      currentValue: 82,
      previousValue: 81,
      threshold: {
        warning: 70,
        critical: 60,
        direction: 'below',
      },
      trend: {
        direction: 'stable',
        velocity: 0.1,
        acceleration: 0.0,
      },
      lastUpdated: new Date(),
      history: [],
    });

    // Correlation Strength
    this.metrics.set('correlation_strength', {
      id: 'correlation_strength',
      name: 'Average Correlation Strength',
      description: 'Average strength of detected correlations',
      type: 'gauge',
      category: 'system',
      currentValue: 0.67,
      previousValue: 0.65,
      threshold: {
        warning: 0.4,
        critical: 0.3,
        direction: 'below',
      },
      trend: {
        direction: 'increasing',
        velocity: 0.02,
        acceleration: 0.001,
      },
      lastUpdated: new Date(),
      history: [],
    });
  }

  /**
   * Initialize default notification channels
   */
  private initializeDefaultChannels(): void {
    this.notificationChannels.set('email_alerts', {
      id: 'email_alerts',
      name: 'Email Alerts',
      type: 'email',
      configuration: {
        smtp: {
          host: process.env.SMTP_HOST || 'localhost',
          port: process.env.SMTP_PORT || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        },
        templates: {
          critical: 'critical_alert_template',
          warning: 'warning_alert_template',
          info: 'info_alert_template',
        },
      },
      enabled: true,
      filters: [
        {
          severity: ['critical', 'emergency'],
          types: ['threshold', 'prediction', 'anomaly'],
          sources: ['system', 'business'],
          frequency: 'immediate',
        },
      ],
    });

    this.notificationChannels.set('slack_integration', {
      id: 'slack_integration',
      name: 'Slack Integration',
      type: 'slack',
      configuration: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channels: {
          critical: '#alerts-critical',
          warning: '#alerts-warning',
          info: '#alerts-info',
        },
      },
      enabled: !!process.env.SLACK_WEBHOOK_URL,
      filters: [
        {
          severity: ['warning', 'critical', 'emergency'],
          types: ['threshold', 'prediction'],
          sources: ['system', 'business'],
          frequency: 'immediate',
        },
      ],
    });
  }

  /**
   * Start real-time monitoring
   */
  private startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.updateMetrics();
        await this.checkThresholds();
        await this.detectAnomalies();
        await this.processAlerts();
      } catch (error) {
        console.error('Error in monitoring cycle:', error);
      }
    }, 5000); // Monitor every 5 seconds

    console.log('Real-time monitoring started');
  }

  /**
   * Stop real-time monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    console.log('Real-time monitoring stopped');
  }

  /**
   * Update all metrics with current values
   */
  private async updateMetrics(): Promise<void> {
    try {
      // Update System Health Score
      const healthScore = await this.calculateSystemHealthScore();
      await this.updateMetric('system_health_score', healthScore);

      // Update Issue Velocity
      const issueVelocity = await this.calculateIssueVelocity();
      await this.updateMetric('issue_velocity', issueVelocity);

      // Update Initiative Success Rate
      const successRate = await this.calculateInitiativeSuccessRate();
      await this.updateMetric('initiative_success_rate', successRate);

      // Update Resource Utilization
      const resourceUtil = await this.calculateResourceUtilization();
      await this.updateMetric('resource_utilization', resourceUtil);

      // Update Prediction Accuracy
      const predictionAccuracy = await this.calculatePredictionAccuracy();
      await this.updateMetric('prediction_accuracy', predictionAccuracy);

      // Update Correlation Strength
      const correlationStrength = await this.calculateCorrelationStrength();
      await this.updateMetric('correlation_strength', correlationStrength * 100);
    } catch (error) {
      console.error('Error updating metrics:', error);
    }
  }

  /**
   * Update a specific metric
   */
  private async updateMetric(metricId: string, newValue: number): Promise<void> {
    const metric = this.metrics.get(metricId);
    if (!metric) return;

    // Store previous value and update current
    metric.previousValue = metric.currentValue;
    metric.currentValue = newValue;
    metric.lastUpdated = new Date();

    // Add to history
    metric.history.push({
      timestamp: new Date(),
      value: newValue,
    });

    // Keep only last 100 data points
    if (metric.history.length > 100) {
      metric.history = metric.history.slice(-100);
    }

    // Calculate trend
    if (metric.history.length >= 3) {
      const recent = metric.history.slice(-3);
      const oldVelocity = metric.trend.velocity;

      metric.trend.velocity = (recent[2].value - recent[0].value) / 2;
      metric.trend.acceleration = metric.trend.velocity - oldVelocity;

      if (Math.abs(metric.trend.velocity) < 0.1) {
        metric.trend.direction = 'stable';
      } else {
        metric.trend.direction = metric.trend.velocity > 0 ? 'increasing' : 'decreasing';
      }
    }

    // Notify subscribers
    this.notifySubscribers(`metric:${metricId}`, metric);
  }

  /**
   * Check metric thresholds and create alerts
   */
  private async checkThresholds(): Promise<void> {
    for (const metric of this.metrics.values()) {
      const { currentValue, threshold } = metric;

      let alertLevel: 'warning' | 'critical' | null = null;

      if (threshold.direction === 'above') {
        if (currentValue >= threshold.critical) {
          alertLevel = 'critical';
        } else if (currentValue >= threshold.warning) {
          alertLevel = 'warning';
        }
      } else {
        if (currentValue <= threshold.critical) {
          alertLevel = 'critical';
        } else if (currentValue <= threshold.warning) {
          alertLevel = 'warning';
        }
      }

      if (alertLevel) {
        await this.createAlert({
          severity: alertLevel,
          type: 'threshold',
          title: `${metric.name} Threshold Exceeded`,
          description: `${metric.name} is ${currentValue} (threshold: ${threshold[alertLevel]})`,
          source: {
            component: 'monitoring',
            entityType: 'metric',
            entityId: metric.id,
          },
          context: {
            currentValue,
            threshold: threshold[alertLevel],
            trend: metric.trend.direction,
          },
          actionable: true,
          autoResolution: {
            possible: false,
            confidence: 0,
          },
        });
      }
    }
  }

  /**
   * Detect anomalies using the predictive engine
   */
  private async detectAnomalies(): Promise<void> {
    try {
      const anomalies = await this.predictiveEngine.detectAnomalies();

      for (const anomaly of anomalies) {
        await this.createAlert({
          severity:
            anomaly.severity === 'low'
              ? 'info'
              : anomaly.severity === 'medium'
                ? 'warning'
                : 'critical',
          type: 'anomaly',
          title: `Anomaly Detected: ${anomaly.entityType}`,
          description: anomaly.description,
          source: {
            component: 'anomaly_detection',
            entityType: anomaly.entityType as any,
            entityId: anomaly.entityId,
          },
          context: {
            currentValue: anomaly.baseline.actualValue,
            threshold: anomaly.baseline.expectedValue,
            trend: `${anomaly.baseline.deviation} standard deviations`,
          },
          actionable: anomaly.recommendations.length > 0,
          autoResolution: {
            possible: anomaly.recommendations.some((r) => r.automation.canAutomate),
            confidence: anomaly.confidence,
            actions: anomaly.recommendations.map((r) => r.action),
          },
        });
      }
    } catch (error) {
      console.error('Error in anomaly detection:', error);
    }
  }

  /**
   * Process and manage alerts
   */
  private async processAlerts(): Promise<void> {
    const now = new Date();

    // Remove expired alerts
    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.expiresAt && alert.expiresAt < now) {
        this.alerts.delete(alertId);
        this.notifySubscribers('alert:expired', { alertId, alert });
      }
    }

    // Send notifications for new alerts
    for (const alert of this.alerts.values()) {
      if (alert.createdAt.getTime() > now.getTime() - 10000) {
        // Last 10 seconds
        await this.sendNotifications(alert);
      }
    }
  }

  /**
   * Create a new alert
   */
  private async createAlert(alertData: Partial<RealTimeAlert>): Promise<RealTimeAlert> {
    const alert: RealTimeAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity: alertData.severity || 'info',
      type: alertData.type || 'system',
      title: alertData.title || 'System Alert',
      description: alertData.description || '',
      source: alertData.source || {
        component: 'unknown',
        entityType: 'system',
        entityId: 'unknown',
      },
      context: alertData.context || {},
      actionable: alertData.actionable || false,
      autoResolution: alertData.autoResolution || {
        possible: false,
        confidence: 0,
      },
      acknowledgement: {
        acknowledged: false,
      },
      resolution: {
        resolved: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: alertData.expiresAt,
    };

    // Check for duplicate alerts
    const existingAlert = Array.from(this.alerts.values()).find(
      (a) =>
        a.source.entityId === alert.source.entityId &&
        a.type === alert.type &&
        !a.resolution.resolved &&
        a.createdAt.getTime() > Date.now() - 300000 // Last 5 minutes
    );

    if (existingAlert) {
      existingAlert.updatedAt = new Date();
      return existingAlert;
    }

    this.alerts.set(alert.id, alert);
    this.notifySubscribers('alert:created', alert);

    // Trigger automated response if possible
    if (alert.autoResolution.possible && alert.autoResolution.confidence > 0.8) {
      setTimeout(() => this.attemptAutoResolution(alert.id), 30000); // Wait 30 seconds
    }

    return alert;
  }

  /**
   * Attempt automatic resolution of an alert
   */
  private async attemptAutoResolution(alertId: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.resolution.resolved || alert.acknowledgement.acknowledged) {
      return false;
    }

    try {
      // In a real implementation, this would execute the resolution actions
      console.log(`Attempting auto-resolution for alert ${alertId}`);

      // Simulate resolution
      alert.resolution = {
        resolved: true,
        resolvedBy: 'system',
        resolvedAt: new Date(),
        resolution: 'Automatically resolved by system',
        effectiveness: alert.autoResolution.confidence,
      };

      this.notifySubscribers('alert:resolved', alert);
      return true;
    } catch (error) {
      console.error(`Error in auto-resolution for alert ${alertId}:`, error);
      return false;
    }
  }

  /**
   * Send notifications through configured channels
   */
  private async sendNotifications(alert: RealTimeAlert): Promise<void> {
    for (const channel of this.notificationChannels.values()) {
      if (!channel.enabled) continue;

      // Check if alert matches channel filters
      const matchesFilter = channel.filters.some(
        (filter) =>
          filter.severity.includes(alert.severity) &&
          filter.types.includes(alert.type) &&
          filter.sources.includes(alert.source.component)
      );

      if (matchesFilter) {
        try {
          await this.sendNotificationToChannel(channel, alert);
        } catch (error) {
          console.error(`Error sending notification to ${channel.name}:`, error);
        }
      }
    }
  }

  /**
   * Send notification to a specific channel
   */
  private async sendNotificationToChannel(
    channel: NotificationChannel,
    alert: RealTimeAlert
  ): Promise<void> {
    // In a real implementation, this would integrate with actual notification services
    console.log(`Notification sent to ${channel.name}:`, {
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
    });
  }

  // Metric calculation methods
  private async calculateSystemHealthScore(): Promise<number> {
    try {
      const response = await fetch('/api/executive/health-score');
      const data = await response.json();
      return data.score || 85;
    } catch {
      return 85; // Default value
    }
  }

  private async calculateIssueVelocity(): Promise<number> {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const issues = await prisma.issue.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
        },
      });
      return issues.length / 7; // Issues per day
    } catch {
      return 3.2; // Default value
    }
  }

  private async calculateInitiativeSuccessRate(): Promise<number> {
    try {
      const initiatives = await prisma.initiative.findMany({
        where: {
          status: { in: ['COMPLETED', 'CANCELLED'] },
        },
      });
      const successful = initiatives.filter((i) => i.status === 'COMPLETED');
      return initiatives.length > 0 ? (successful.length / initiatives.length) * 100 : 78;
    } catch {
      return 78; // Default value
    }
  }

  private async calculateResourceUtilization(): Promise<number> {
    // Simplified calculation - in reality, this would integrate with resource management
    return 70 + Math.random() * 20; // 70-90%
  }

  private async calculatePredictionAccuracy(): Promise<number> {
    // This would be calculated from historical prediction performance
    return 82 + Math.random() * 10; // 82-92%
  }

  private async calculateCorrelationStrength(): Promise<number> {
    try {
      const stats = await this.correlationEngine.getCorrelationStats();
      return stats.averageStrength;
    } catch {
      return 0.67; // Default value
    }
  }

  /**
   * Subscribe to real-time updates
   */
  public subscribe(eventType: string, callback: (data: any) => void): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(callback);
  }

  /**
   * Unsubscribe from real-time updates
   */
  public unsubscribe(eventType: string, callback: (data: any) => void): void {
    const subscribers = this.subscribers.get(eventType);
    if (subscribers) {
      subscribers.delete(callback);
    }
  }

  /**
   * Notify subscribers of events
   */
  private notifySubscribers(eventType: string, data: any): void {
    const subscribers = this.subscribers.get(eventType);
    if (subscribers) {
      for (const callback of subscribers) {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      }
    }
  }

  /**
   * Get current monitoring status
   */
  public getMonitoringStatus(): {
    isMonitoring: boolean;
    metricsCount: number;
    activeAlerts: number;
    channelsEnabled: number;
    lastUpdate: Date;
  } {
    const activeAlerts = Array.from(this.alerts.values()).filter((a) => !a.resolution.resolved);
    const enabledChannels = Array.from(this.notificationChannels.values()).filter((c) => c.enabled);

    return {
      isMonitoring: this.isMonitoring,
      metricsCount: this.metrics.size,
      activeAlerts: activeAlerts.length,
      channelsEnabled: enabledChannels.length,
      lastUpdate: new Date(),
    };
  }

  /**
   * Get all current metrics
   */
  public getMetrics(): MonitoringMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get all current alerts
   */
  public getAlerts(): RealTimeAlert[] {
    return Array.from(this.alerts.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(alertId: string, userId: string, reason?: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.acknowledgement.acknowledged) {
      return false;
    }

    alert.acknowledgement = {
      acknowledged: true,
      acknowledgedBy: userId,
      acknowledgedAt: new Date(),
      reason,
    };

    this.notifySubscribers('alert:acknowledged', alert);
    return true;
  }

  /**
   * Resolve an alert manually
   */
  public resolveAlert(alertId: string, userId: string, resolution: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.resolution.resolved) {
      return false;
    }

    alert.resolution = {
      resolved: true,
      resolvedBy: userId,
      resolvedAt: new Date(),
      resolution,
    };

    this.notifySubscribers('alert:resolved', alert);
    return true;
  }
}

export default RealTimeMonitor;
