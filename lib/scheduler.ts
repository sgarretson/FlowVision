import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

export interface BriefSchedule {
  userId: string;
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  timeUTC: string; // HH:mm format
  channel: 'email' | 'slack' | 'none';
  lastSent?: Date;
}

export class ExecutiveBriefScheduler {
  private static instance: ExecutiveBriefScheduler;
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): ExecutiveBriefScheduler {
    if (!this.instance) {
      this.instance = new ExecutiveBriefScheduler();
    }
    return this.instance;
  }

  /**
   * Start the scheduler - checks every hour for pending briefs
   */
  start() {
    console.log('📅 Executive Brief Scheduler starting...');

    // Check every hour for pending briefs
    const hourlyCheck = setInterval(
      () => {
        this.processPendingBriefs();
      },
      60 * 60 * 1000
    ); // 1 hour

    this.intervals.set('main', hourlyCheck);

    // Initial check
    this.processPendingBriefs();
  }

  /**
   * Stop the scheduler
   */
  stop() {
    console.log('📅 Executive Brief Scheduler stopping...');
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
  }

  /**
   * Process all pending briefs
   */
  private async processPendingBriefs() {
    try {
      const users = await prisma.user.findMany({
        where: {
          preferences: {
            path: ['briefSchedule', 'enabled'],
            equals: true,
          },
        },
      });

      for (const user of users) {
        const schedule = this.extractSchedule(user.preferences);
        if (schedule && this.shouldSendBrief(schedule)) {
          await this.generateAndSendBrief(user.id, schedule);
        }
      }
    } catch (error) {
      console.error('❌ Error processing pending briefs:', error);
    }
  }

  /**
   * Extract schedule from user preferences
   */
  private extractSchedule(preferences: any): BriefSchedule | null {
    try {
      const briefSchedule = preferences?.briefSchedule;
      if (!briefSchedule?.enabled) return null;

      return {
        userId: '',
        enabled: briefSchedule.enabled,
        frequency: briefSchedule.frequency || 'weekly',
        dayOfWeek: briefSchedule.dayOfWeek,
        dayOfMonth: briefSchedule.dayOfMonth,
        timeUTC: briefSchedule.timeUTC || '09:00',
        channel: briefSchedule.channel || 'email',
        lastSent: briefSchedule.lastSent ? new Date(briefSchedule.lastSent) : undefined,
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if a brief should be sent based on schedule
   */
  private shouldSendBrief(schedule: BriefSchedule): boolean {
    const now = new Date();
    const [hours, minutes] = schedule.timeUTC.split(':').map(Number);

    // Check if it's the right time (within 1 hour window)
    const targetTime = new Date(now);
    targetTime.setUTCHours(hours, minutes, 0, 0);

    const timeDiff = Math.abs(now.getTime() - targetTime.getTime());
    const oneHour = 60 * 60 * 1000;

    if (timeDiff > oneHour) return false;

    // Check frequency-specific conditions
    switch (schedule.frequency) {
      case 'daily':
        return this.shouldSendDaily(schedule, now);
      case 'weekly':
        return this.shouldSendWeekly(schedule, now);
      case 'monthly':
        return this.shouldSendMonthly(schedule, now);
      default:
        return false;
    }
  }

  private shouldSendDaily(schedule: BriefSchedule, now: Date): boolean {
    if (!schedule.lastSent) return true;

    const daysSince = (now.getTime() - schedule.lastSent.getTime()) / (24 * 60 * 60 * 1000);
    return daysSince >= 1;
  }

  private shouldSendWeekly(schedule: BriefSchedule, now: Date): boolean {
    const targetDay = schedule.dayOfWeek ?? 1; // Default to Monday
    if (now.getUTCDay() !== targetDay) return false;

    if (!schedule.lastSent) return true;

    const weeksSince = (now.getTime() - schedule.lastSent.getTime()) / (7 * 24 * 60 * 60 * 1000);
    return weeksSince >= 1;
  }

  private shouldSendMonthly(schedule: BriefSchedule, now: Date): boolean {
    const targetDay = schedule.dayOfMonth ?? 1;
    if (now.getUTCDate() !== targetDay) return false;

    if (!schedule.lastSent) return true;

    // Simple monthly check - ensure different month
    return (
      now.getUTCMonth() !== schedule.lastSent.getUTCMonth() ||
      now.getUTCFullYear() !== schedule.lastSent.getUTCFullYear()
    );
  }

  /**
   * Generate and send a brief
   */
  private async generateAndSendBrief(userId: string, schedule: BriefSchedule) {
    try {
      console.log(`📊 Generating brief for user ${userId}`);

      // Generate comprehensive brief data
      const briefData = await this.generateBriefData();

      // Send via configured channel
      switch (schedule.channel) {
        case 'email':
          await this.sendEmailBrief(userId, briefData);
          break;
        case 'slack':
          await this.sendSlackBrief(userId, briefData);
          break;
        default:
          console.log(`📤 Brief generated for user ${userId} (no delivery channel)`);
      }

      // Update last sent timestamp
      await this.updateLastSent(userId, new Date());
    } catch (error) {
      console.error(`❌ Failed to generate brief for user ${userId}:`, error);
    }
  }

  /**
   * Generate comprehensive brief data
   */
  private async generateBriefData() {
    const [initiatives, issues, clusters, recentActivity] = await Promise.all([
      prisma.initiative.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: { owner: { select: { name: true } } },
      }),
      prisma.issue.count(),
      prisma.issueCluster.count(),
      prisma.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 5,
        include: { user: { select: { name: true } } },
      }),
    ]);

    const statusCounts = await prisma.initiative.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const priorityInitiatives = initiatives
      .filter((i) => i.status === 'APPROVED' || i.status === 'ACTIVE')
      .slice(0, 5);

    const completedThisWeek = initiatives.filter((i) => {
      if (i.status !== 'COMPLETED') return false;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return i.updatedAt > weekAgo;
    });

    return {
      headline: `Executive Brief - Week of ${new Date().toLocaleDateString()}`,
      summary: {
        totalInitiatives: initiatives.length,
        openIssues: issues,
        activeClusters: clusters,
        completedThisWeek: completedThisWeek.length,
      },
      statusBreakdown: Object.fromEntries(statusCounts.map((s) => [s.status, s._count._all])),
      priorityInitiatives: priorityInitiatives.map((i) => ({
        title: i.title,
        owner: i.owner?.name || 'Unassigned',
        status: i.status,
        progress: i.progress,
        daysActive: Math.floor((Date.now() - i.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
      })),
      recentActivity: recentActivity.map((a) => ({
        action: a.action,
        user: a.user?.name || 'System',
        timestamp: a.timestamp,
      })),
      insights: this.generateInsights(initiatives, issues, clusters),
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate AI-style insights
   */
  private generateInsights(initiatives: any[], issueCount: number, clusterCount: number): string[] {
    const insights: string[] = [];

    const activeCount = initiatives.filter((i) => i.status === 'ACTIVE').length;
    const completedCount = initiatives.filter((i) => i.status === 'COMPLETED').length;

    if (activeCount > 10) {
      insights.push(
        `⚠️ High initiative load: ${activeCount} active initiatives may indicate resource strain.`
      );
    }

    if (completedCount > activeCount) {
      insights.push(
        `✅ Strong execution: ${completedCount} completed initiatives exceed active count.`
      );
    }

    if (issueCount > clusterCount * 3) {
      insights.push(
        `🔍 Issue clustering opportunity: ${issueCount} issues could benefit from better categorization.`
      );
    }

    const avgProgress =
      initiatives
        .filter((i) => i.status === 'ACTIVE')
        .reduce((sum, i) => sum + (i.progress || 0), 0) / Math.max(activeCount, 1);

    if (avgProgress < 30) {
      insights.push(
        `📊 Slow progress detected: Average initiative progress is ${avgProgress.toFixed(1)}%.`
      );
    }

    return insights.length > 0
      ? insights
      : ['📈 Operations are running smoothly with balanced initiative pipeline.'];
  }

  /**
   * Send brief via email
   */
  private async sendEmailBrief(userId: string, briefData: any) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (!user?.email) return;

      // In production, configure proper SMTP
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: process.env.SMTP_USER
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
      });

      const html = this.formatBriefHTML(briefData);

      await transporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@flowvision.app',
        to: user.email,
        subject: `FlowVision Executive Brief - ${new Date().toLocaleDateString()}`,
        html,
      });

      console.log(`📧 Email brief sent to ${user.email}`);
    } catch (error) {
      console.error('❌ Email send failed:', error);
    }
  }

  /**
   * Send brief via Slack (placeholder)
   */
  private async sendSlackBrief(userId: string, briefData: any) {
    // Placeholder for Slack integration
    console.log(`📱 Slack brief would be sent for user ${userId}`);
    // TODO: Implement Slack webhook integration
  }

  /**
   * Format brief as HTML email
   */
  private formatBriefHTML(briefData: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: #1f2937; color: white; padding: 20px; }
          .content { padding: 20px; }
          .metric { display: inline-block; margin: 10px; padding: 15px; background: #f3f4f6; border-radius: 8px; }
          .insight { background: #fef3c7; padding: 10px; margin: 10px 0; border-radius: 4px; }
          .initiative { border-left: 4px solid #3b82f6; padding: 10px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎯 ${briefData.headline}</h1>
        </div>
        <div class="content">
          <h2>📊 Summary</h2>
          <div class="metric">
            <strong>${briefData.summary.totalInitiatives}</strong><br>
            Total Initiatives
          </div>
          <div class="metric">
            <strong>${briefData.summary.openIssues}</strong><br>
            Open Issues
          </div>
          <div class="metric">
            <strong>${briefData.summary.completedThisWeek}</strong><br>
            Completed This Week
          </div>
          
          <h2>🚀 Priority Initiatives</h2>
          ${briefData.priorityInitiatives
            .map(
              (init: any) => `
            <div class="initiative">
              <strong>${init.title}</strong><br>
              Owner: ${init.owner} | Status: ${init.status} | Progress: ${init.progress}%
            </div>
          `
            )
            .join('')}
          
          <h2>💡 Insights</h2>
          ${briefData.insights
            .map(
              (insight: string) => `
            <div class="insight">${insight}</div>
          `
            )
            .join('')}
          
          <p><em>Generated at ${new Date(briefData.generatedAt).toLocaleString()}</em></p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Update last sent timestamp for user
   */
  private async updateLastSent(userId: string, timestamp: Date) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferences: true },
      });

      const preferences = (user?.preferences as any) || {};
      preferences.briefSchedule = {
        ...preferences.briefSchedule,
        lastSent: timestamp.toISOString(),
      };

      await prisma.user.update({
        where: { id: userId },
        data: { preferences },
      });
    } catch (error) {
      console.error('❌ Failed to update last sent timestamp:', error);
    }
  }
}

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  ExecutiveBriefScheduler.getInstance().start();
}
