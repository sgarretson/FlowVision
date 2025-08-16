import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { advancedLogger, LogContext } from '@/lib/advanced-logger';
import { withErrorHandling } from '@/lib/error-handler';

interface PerformanceMetric {
  lcp?: number;
  fid?: number;
  cls?: number;
  domContentLoaded?: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
  networkType?: string;
  effectiveType?: string;
  deviceMemory?: number;
  jsHeapSizeUsed?: number;
  jsHeapSizeTotal?: number;
  jsHeapSizeLimit?: number;
}

interface PerformanceReport {
  metrics: PerformanceMetric;
  timestamp: number;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
}

export const POST = withErrorHandling(async function handlePerformanceMetrics(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const correlationId = advancedLogger.generateCorrelationId();

  // Allow anonymous reporting for performance metrics
  const userId = session?.user?.id || 'anonymous';

  try {
    const body: PerformanceReport = await req.json();
    const { metrics, timestamp, userAgent, viewport } = body;

    if (!metrics || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: metrics and timestamp' },
        { status: 400 }
      );
    }

    // Log performance metrics
    advancedLogger.info(
      LogContext.PERFORMANCE,
      'Performance metrics received',
      {
        userId,
        metrics: {
          lcp: metrics.lcp ? Math.round(metrics.lcp) : undefined,
          fid: metrics.fid ? Math.round(metrics.fid) : undefined,
          cls: metrics.cls ? Math.round(metrics.cls * 1000) / 1000 : undefined,
          domContentLoaded: metrics.domContentLoaded
            ? Math.round(metrics.domContentLoaded)
            : undefined,
          firstPaint: metrics.firstPaint ? Math.round(metrics.firstPaint) : undefined,
          firstContentfulPaint: metrics.firstContentfulPaint
            ? Math.round(metrics.firstContentfulPaint)
            : undefined,
          networkType: metrics.networkType,
          effectiveType: metrics.effectiveType,
          deviceMemory: metrics.deviceMemory,
        },
        viewport,
        userAgent: userAgent?.substring(0, 100), // Truncate for logging
        timestamp,
      },
      correlationId
    );

    // Calculate performance score
    const score = calculatePerformanceScore(metrics);

    // Log performance alerts if needed
    if (score.rating === 'poor') {
      advancedLogger.warn(
        LogContext.PERFORMANCE,
        'Poor performance detected',
        {
          userId,
          score: score.score,
          factors: score.factors,
          metrics: {
            lcp: metrics.lcp,
            fid: metrics.fid,
            cls: metrics.cls,
          },
        },
        correlationId
      );
    }

    // Aggregate metrics for monitoring (in a real app, you'd store this in a database)
    const aggregatedMetrics = {
      userId,
      timestamp,
      score: score.score,
      rating: score.rating,
      metrics,
      viewport,
      device: parseUserAgent(userAgent),
    };

    // Store in database (if needed)
    // await storePerformanceMetrics(aggregatedMetrics);

    return NextResponse.json({
      status: 'success',
      message: 'Performance metrics recorded',
      score: score.score,
      rating: score.rating,
      recommendations: generateRecommendations(metrics),
    });
  } catch (error) {
    advancedLogger.error(
      LogContext.PERFORMANCE,
      'Performance metrics processing failed',
      error as Error,
      { userId },
      correlationId
    );
    throw error;
  }
});

function calculatePerformanceScore(metrics: PerformanceMetric) {
  let score = 100;
  const factors: string[] = [];

  // LCP scoring (weighted 30%)
  if (metrics.lcp) {
    if (metrics.lcp > 4000) {
      score -= 30;
      factors.push('LCP > 4s');
    } else if (metrics.lcp > 2500) {
      score -= 15;
      factors.push('LCP > 2.5s');
    }
  }

  // FID scoring (weighted 25%)
  if (metrics.fid) {
    if (metrics.fid > 300) {
      score -= 25;
      factors.push('FID > 300ms');
    } else if (metrics.fid > 100) {
      score -= 10;
      factors.push('FID > 100ms');
    }
  }

  // CLS scoring (weighted 20%)
  if (metrics.cls) {
    if (metrics.cls > 0.25) {
      score -= 20;
      factors.push('CLS > 0.25');
    } else if (metrics.cls > 0.1) {
      score -= 10;
      factors.push('CLS > 0.1');
    }
  }

  // Memory usage (weighted 15%)
  if (metrics.jsHeapSizeUsed && metrics.jsHeapSizeLimit) {
    const memoryUsage = (metrics.jsHeapSizeUsed / metrics.jsHeapSizeLimit) * 100;
    if (memoryUsage > 90) {
      score -= 15;
      factors.push('High memory usage');
    } else if (memoryUsage > 70) {
      score -= 7;
      factors.push('Moderate memory usage');
    }
  }

  // Network impact (weighted 10%)
  if (metrics.effectiveType) {
    if (metrics.effectiveType === 'slow-2g' || metrics.effectiveType === '2g') {
      score -= 10;
      factors.push('Slow network');
    } else if (metrics.effectiveType === '3g') {
      score -= 5;
      factors.push('3G network');
    }
  }

  return {
    score: Math.max(0, score),
    factors,
    rating: score >= 90 ? 'good' : score >= 70 ? 'needs-improvement' : ('poor' as const),
  };
}

function generateRecommendations(metrics: PerformanceMetric): string[] {
  const recommendations: string[] = [];

  if (metrics.lcp && metrics.lcp > 2500) {
    recommendations.push(
      'Optimize Largest Contentful Paint by improving server response times and optimizing above-the-fold content'
    );
  }

  if (metrics.fid && metrics.fid > 100) {
    recommendations.push(
      'Reduce First Input Delay by minimizing JavaScript execution time and using code splitting'
    );
  }

  if (metrics.cls && metrics.cls > 0.1) {
    recommendations.push(
      'Improve Cumulative Layout Shift by setting dimensions for images and avoiding inserting content above existing content'
    );
  }

  if (metrics.jsHeapSizeUsed && metrics.jsHeapSizeLimit) {
    const memoryUsage = (metrics.jsHeapSizeUsed / metrics.jsHeapSizeLimit) * 100;
    if (memoryUsage > 70) {
      recommendations.push(
        'Optimize memory usage by implementing proper cleanup and avoiding memory leaks'
      );
    }
  }

  if (metrics.effectiveType === 'slow-2g' || metrics.effectiveType === '2g') {
    recommendations.push(
      'Optimize for slow networks by implementing progressive loading and reducing bundle size'
    );
  }

  return recommendations;
}

function parseUserAgent(userAgent: string) {
  // Simple user agent parsing
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
  const isTablet = /iPad|Tablet/i.test(userAgent);
  const browser = userAgent.includes('Chrome')
    ? 'Chrome'
    : userAgent.includes('Firefox')
      ? 'Firefox'
      : userAgent.includes('Safari')
        ? 'Safari'
        : userAgent.includes('Edge')
          ? 'Edge'
          : 'Unknown';

  return {
    isMobile,
    isTablet,
    browser,
    platform: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
  };
}
