'use client';

import { useEffect, useState, useCallback } from 'react';
import { advancedLogger, LogContext } from '@/lib/advanced-logger';

interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift

  // Navigation Timing
  domContentLoaded?: number;
  firstPaint?: number;
  firstContentfulPaint?: number;

  // Resource Loading
  resourceLoadTime?: number;
  imageLoadTime?: number;

  // Mobile Specific
  networkType?: string;
  effectiveType?: string;
  deviceMemory?: number;

  // Bundle & Performance
  jsHeapSizeUsed?: number;
  jsHeapSizeTotal?: number;
  jsHeapSizeLimit?: number;
}

interface PerformanceThresholds {
  lcp: { good: number; poor: number };
  fid: { good: number; poor: number };
  cls: { good: number; poor: number };
  imageLoad: { good: number; poor: number };
}

const defaultThresholds: PerformanceThresholds = {
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  imageLoad: { good: 1000, poor: 3000 },
};

export const usePerformanceMonitoring = (
  options: {
    enableAutoReporting?: boolean;
    thresholds?: Partial<PerformanceThresholds>;
    reportInterval?: number;
  } = {}
) => {
  const {
    enableAutoReporting = true,
    thresholds = defaultThresholds,
    reportInterval = 30000, // 30 seconds
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [isSupported, setIsSupported] = useState(false);

  // Check browser support
  useEffect(() => {
    const supported = !!(
      window.performance &&
      window.performance.getEntriesByType &&
      window.PerformanceObserver
    );
    setIsSupported(supported);

    if (!supported) {
      advancedLogger.warn(
        LogContext.PERFORMANCE,
        'Performance monitoring not supported in this browser'
      );
    }
  }, []);

  // Measure Core Web Vitals
  const measureWebVitals = useCallback(() => {
    if (!isSupported) return;

    try {
      // Largest Contentful Paint (LCP)
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;

        if (lastEntry) {
          setMetrics((prev) => ({
            ...prev,
            lcp: lastEntry.startTime,
          }));

          advancedLogger.info(LogContext.PERFORMANCE, 'LCP measured', {
            value: Math.round(lastEntry.startTime),
            rating:
              lastEntry.startTime <= thresholds.lcp!.good
                ? 'good'
                : lastEntry.startTime <= thresholds.lcp!.poor
                  ? 'needs-improvement'
                  : 'poor',
          });
        }
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          setMetrics((prev) => ({
            ...prev,
            fid: entry.processingStart - entry.startTime,
          }));

          advancedLogger.info(LogContext.PERFORMANCE, 'FID measured', {
            value: Math.round(entry.processingStart - entry.startTime),
            rating:
              entry.processingStart - entry.startTime <= thresholds.fid!.good
                ? 'good'
                : entry.processingStart - entry.startTime <= thresholds.fid!.poor
                  ? 'needs-improvement'
                  : 'poor',
          });
        });
      });

      fidObserver.observe({ type: 'first-input', buffered: true });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }

        setMetrics((prev) => ({
          ...prev,
          cls: clsValue,
        }));
      });

      clsObserver.observe({ type: 'layout-shift', buffered: true });

      return () => {
        observer.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
      };
    } catch (error) {
      advancedLogger.error(LogContext.PERFORMANCE, 'Error measuring web vitals', error as Error);
    }
  }, [isSupported, thresholds]);

  // Measure navigation timing
  const measureNavigationTiming = useCallback(() => {
    if (!isSupported) return;

    try {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;

      if (navigation) {
        const domContentLoaded =
          navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;

        setMetrics((prev) => ({
          ...prev,
          domContentLoaded,
        }));

        advancedLogger.info(LogContext.PERFORMANCE, 'Navigation timing measured', {
          domContentLoaded: Math.round(domContentLoaded),
          loadComplete: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
        });
      }

      // First Paint and First Contentful Paint
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach((entry) => {
        if (entry.name === 'first-paint') {
          setMetrics((prev) => ({ ...prev, firstPaint: entry.startTime }));
        } else if (entry.name === 'first-contentful-paint') {
          setMetrics((prev) => ({ ...prev, firstContentfulPaint: entry.startTime }));
        }
      });
    } catch (error) {
      advancedLogger.error(
        LogContext.PERFORMANCE,
        'Error measuring navigation timing',
        error as Error
      );
    }
  }, [isSupported]);

  // Measure network information (mobile-specific)
  const measureNetworkInfo = useCallback(() => {
    try {
      const connection = (navigator as any).connection;
      if (connection) {
        setMetrics((prev) => ({
          ...prev,
          networkType: connection.type,
          effectiveType: connection.effectiveType,
        }));

        advancedLogger.info(LogContext.PERFORMANCE, 'Network info measured', {
          networkType: connection.type,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
        });
      }

      // Device Memory (if available)
      const deviceMemory = (navigator as any).deviceMemory;
      if (deviceMemory) {
        setMetrics((prev) => ({ ...prev, deviceMemory }));
      }
    } catch (error) {
      advancedLogger.debug(LogContext.PERFORMANCE, 'Network info not available');
    }
  }, []);

  // Measure memory usage
  const measureMemoryUsage = useCallback(() => {
    try {
      const memory = (performance as any).memory;
      if (memory) {
        setMetrics((prev) => ({
          ...prev,
          jsHeapSizeUsed: memory.usedJSHeapSize,
          jsHeapSizeTotal: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        }));

        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

        if (usagePercent > 80) {
          advancedLogger.warn(LogContext.PERFORMANCE, 'High memory usage detected', {
            usagePercent: Math.round(usagePercent),
            used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
          });
        }
      }
    } catch (error) {
      advancedLogger.debug(LogContext.PERFORMANCE, 'Memory info not available');
    }
  }, []);

  // Monitor resource loading
  const monitorResourceLoading = useCallback(() => {
    if (!isSupported) return;

    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach((entry: any) => {
          const loadTime = entry.responseEnd - entry.requestStart;

          if (entry.initiatorType === 'img') {
            setMetrics((prev) => ({
              ...prev,
              imageLoadTime: Math.max(prev.imageLoadTime || 0, loadTime),
            }));

            if (loadTime > thresholds.imageLoad!.poor) {
              advancedLogger.warn(LogContext.PERFORMANCE, 'Slow image loading detected', {
                url: entry.name,
                loadTime: Math.round(loadTime),
                size: entry.transferSize,
              });
            }
          }
        });
      });

      resourceObserver.observe({ type: 'resource', buffered: true });

      return () => resourceObserver.disconnect();
    } catch (error) {
      advancedLogger.error(
        LogContext.PERFORMANCE,
        'Error monitoring resource loading',
        error as Error
      );
    }
  }, [isSupported, thresholds]);

  // Report performance metrics
  const reportMetrics = useCallback(async () => {
    if (!enableAutoReporting || Object.keys(metrics).length === 0) return;

    try {
      await fetch('/api/performance/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        }),
      });

      advancedLogger.info(LogContext.PERFORMANCE, 'Performance metrics reported', {
        metricsCount: Object.keys(metrics).length,
      });
    } catch (error) {
      advancedLogger.error(LogContext.PERFORMANCE, 'Failed to report metrics', error as Error);
    }
  }, [metrics, enableAutoReporting]);

  // Initialize monitoring
  useEffect(() => {
    if (!isSupported) return;

    const cleanupFunctions: (() => void)[] = [];

    // Measure all performance aspects
    const webVitalsCleanup = measureWebVitals();
    if (webVitalsCleanup) cleanupFunctions.push(webVitalsCleanup);

    measureNavigationTiming();
    measureNetworkInfo();
    measureMemoryUsage();

    const resourceCleanup = monitorResourceLoading();
    if (resourceCleanup) cleanupFunctions.push(resourceCleanup);

    // Set up periodic memory monitoring
    const memoryInterval = setInterval(measureMemoryUsage, 10000);
    cleanupFunctions.push(() => clearInterval(memoryInterval));

    // Set up periodic reporting
    if (enableAutoReporting) {
      const reportInterval = setInterval(reportMetrics, reportInterval);
      cleanupFunctions.push(() => clearInterval(reportInterval));
    }

    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [
    isSupported,
    measureWebVitals,
    measureNavigationTiming,
    measureNetworkInfo,
    measureMemoryUsage,
    monitorResourceLoading,
    reportMetrics,
    enableAutoReporting,
    reportInterval,
  ]);

  // Manual performance measurement
  const measureNow = useCallback(() => {
    measureNavigationTiming();
    measureNetworkInfo();
    measureMemoryUsage();
  }, [measureNavigationTiming, measureNetworkInfo, measureMemoryUsage]);

  // Get performance score
  const getPerformanceScore = useCallback(() => {
    let score = 100;
    let factors: string[] = [];

    if (metrics.lcp) {
      if (metrics.lcp > thresholds.lcp!.poor) {
        score -= 30;
        factors.push('LCP');
      } else if (metrics.lcp > thresholds.lcp!.good) {
        score -= 15;
      }
    }

    if (metrics.fid) {
      if (metrics.fid > thresholds.fid!.poor) {
        score -= 25;
        factors.push('FID');
      } else if (metrics.fid > thresholds.fid!.good) {
        score -= 10;
      }
    }

    if (metrics.cls) {
      if (metrics.cls > thresholds.cls!.poor) {
        score -= 20;
        factors.push('CLS');
      } else if (metrics.cls > thresholds.cls!.good) {
        score -= 10;
      }
    }

    return {
      score: Math.max(0, score),
      factors,
      rating: score >= 90 ? 'good' : score >= 70 ? 'needs-improvement' : ('poor' as const),
    };
  }, [metrics, thresholds]);

  return {
    metrics,
    isSupported,
    measureNow,
    reportMetrics,
    getPerformanceScore,
  };
};

export default usePerformanceMonitoring;
