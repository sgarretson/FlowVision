import dynamic from 'next/dynamic';
import React, { ComponentType } from 'react';
import { advancedLogger, LogContext } from '@/lib/advanced-logger';

// Loading component for better UX during dynamic imports
const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="ml-3 text-gray-600">Loading...</span>
    </div>
  );
};

const LoadingSkeleton = ({ height = '200px' }: { height?: string }) => {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 rounded-lg" style={{ height }}></div>
    </div>
  );
};

const ErrorFallback = ({ error, retry }: { error?: string; retry?: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg border border-red-200">
      <svg
        className="h-8 w-8 text-red-500 mb-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
      <p className="text-red-700 text-sm mb-2">Failed to load component</p>
      {error && <p className="text-red-600 text-xs mb-3">{error}</p>}
      {retry && (
        <button
          onClick={retry}
          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
};

interface DynamicImportOptions {
  loading?: ComponentType;
  error?: ComponentType<{ error?: string; retry?: () => void }>;
  ssr?: boolean;
  suspense?: boolean;
}

/**
 * Enhanced dynamic import with performance monitoring and error handling
 */
export function createDynamicImport<T = {}>(
  importFunction: () => Promise<{ default: ComponentType<T> }>,
  options: DynamicImportOptions = {}
) {
  const {
    loading = LoadingSpinner,
    error = ErrorFallback,
    ssr = false,
    suspense = false,
  } = options;

  return dynamic(
    async () => {
      const startTime = performance.now();

      try {
        const module = await importFunction();
        const loadTime = performance.now() - startTime;

        advancedLogger.info(LogContext.PERFORMANCE, 'Dynamic component loaded', {
          loadTime: Math.round(loadTime),
          ssr,
          suspense,
        });

        return module;
      } catch (importError) {
        const loadTime = performance.now() - startTime;

        advancedLogger.error(
          LogContext.PERFORMANCE,
          'Dynamic component load failed',
          importError as Error,
          { loadTime: Math.round(loadTime), ssr, suspense }
        );

        throw importError;
      }
    },
    {
      loading,
      ssr,
      suspense,
    }
  );
}

/**
 * Pre-configured dynamic imports for common component patterns
 */
export const DynamicComponents = {
  // Heavy dashboard components
  AnalyticsDashboard: createDynamicImport(
    () => import('@/components/analytics/AnalyticsDashboard'),
    { loading: () => <LoadingSkeleton height="400px" />, ssr: false }
  ),

  ExecutiveDashboard: createDynamicImport(
    () => import('@/components/executive/ExecutiveDashboard'),
    { loading: () => <LoadingSkeleton height="600px" />, ssr: false }
  ),

  // AI-powered components (heavy and async)
  AIProgressIndicator: createDynamicImport(() => import('@/components/ai/AIProgressIndicator'), {
    loading: LoadingSpinner,
    ssr: false,
  }),

  AISolutionsDashboard: createDynamicImport(() => import('@/components/ai/AISolutionsDashboard'), {
    loading: () => <LoadingSkeleton height="500px" />,
    ssr: false,
  }),

  // Chart components (heavy libraries)
  ChartsBundle: createDynamicImport(() => import('@/components/charts/ChartsBundle'), {
    loading: () => <LoadingSkeleton height="300px" />,
    ssr: false,
  }),

  // Forms and modals (not critical for initial load)
  FormModal: createDynamicImport(() => import('@/components/FormModal'), {
    loading: LoadingSpinner,
    ssr: false,
  }),

  RequirementCardModal: createDynamicImport(() => import('@/components/RequirementCardModal'), {
    loading: LoadingSpinner,
    ssr: false,
  }),

  // Heavy admin components
  AIOptimizationDashboard: createDynamicImport(
    () => import('@/components/admin/AIOptimizationDashboard'),
    { loading: () => <LoadingSkeleton height="700px" />, ssr: false }
  ),

  PerformanceConfigPanel: createDynamicImport(
    () => import('@/components/admin/PerformanceConfigPanel'),
    { loading: () => <LoadingSkeleton height="400px" />, ssr: false }
  ),
};

/**
 * Bundle analysis helpers for development
 */
export const BundleAnalysis = {
  /**
   * Log bundle size impact of dynamic imports
   */
  logBundleImpact: (componentName: string, bundleSize?: number) => {
    if (process.env.NODE_ENV === 'development') {
      advancedLogger.info(LogContext.PERFORMANCE, 'Bundle analysis', {
        component: componentName,
        bundleSize: bundleSize ? `${Math.round(bundleSize / 1024)}KB` : 'unknown',
        isDynamic: true,
      });
    }
  },

  /**
   * Measure component render performance
   */
  measureRenderPerformance: (componentName: string, renderTime: number) => {
    if (process.env.NODE_ENV === 'development') {
      advancedLogger.info(LogContext.PERFORMANCE, 'Render performance', {
        component: componentName,
        renderTime: Math.round(renderTime),
        status: renderTime < 16 ? 'good' : renderTime < 50 ? 'acceptable' : 'slow',
      });
    }
  },
};

/**
 * Preload critical dynamic components
 */
export const preloadCriticalComponents = () => {
  if (typeof window !== 'undefined') {
    // Preload components likely to be needed soon
    const criticalComponents = [
      () => import('@/components/ai/AIProgressIndicator'),
      () => import('@/components/FormModal'),
    ];

    criticalComponents.forEach((importFn, index) => {
      setTimeout(() => {
        importFn().then(() => {
          advancedLogger.debug(LogContext.PERFORMANCE, 'Critical component preloaded', {
            index,
            timestamp: Date.now(),
          });
        });
      }, index * 100); // Stagger preloading
    });
  }
};

export default DynamicComponents;
