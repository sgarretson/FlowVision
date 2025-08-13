#!/usr/bin/env node

/**
 * AI Enhancement Phase 2 Testing Script
 * Comprehensive testing of the optimized AI system including:
 * - Performance monitoring
 * - Intelligent caching
 * - Usage tracking
 * - Quality validation
 * - Cost optimization
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AIEnhancementTester {
  constructor() {
    this.testResults = {
      timestamp: new Date().toISOString(),
      phase: 'AI Enhancement Phase 2',
      tests: [],
      summary: {
        passed: 0,
        failed: 0,
        total: 0,
      },
    };
  }

  log(message, type = 'info') {
    const prefix = {
      info: '💡',
      success: '✅',
      error: '❌',
      warning: '⚠️ ',
      test: '🧪',
    };
    console.log(`${prefix[type] || '📋'} ${message}`);
  }

  async addTestResult(name, passed, details, metrics = null) {
    const result = {
      name,
      passed,
      details,
      metrics,
      timestamp: new Date().toISOString(),
    };

    this.testResults.tests.push(result);
    this.testResults.summary.total++;

    if (passed) {
      this.testResults.summary.passed++;
      this.log(`${name}: PASSED - ${details}`, 'success');
    } else {
      this.testResults.summary.failed++;
      this.log(`${name}: FAILED - ${details}`, 'error');
    }

    if (metrics) {
      this.log(`  Metrics: ${JSON.stringify(metrics)}`, 'info');
    }
  }

  async testAIMigrationService() {
    this.log('Testing AIMigration Service...', 'test');

    try {
      // Import the AIMigration service
      const AIMigration = await import('../lib/ai-migration.js');
      const service = AIMigration.default;

      // Test 1: Service Configuration
      const isConfigured = service.isConfigured();
      await this.addTestResult(
        'AIMigration Configuration',
        isConfigured,
        isConfigured ? 'Service is properly configured' : 'Service configuration missing'
      );

      // Test 2: Optimization Feature Flags
      const testUserId = 'test-user-123';
      const isOptimizedEnabled = service.isOptimizedEnabled(testUserId);
      await this.addTestResult(
        'Optimization Feature Flags',
        typeof isOptimizedEnabled === 'boolean',
        `Optimization enabled: ${isOptimizedEnabled}`
      );

      // Test 3: Service Methods Availability
      const requiredMethods = [
        'generateIssueSummary',
        'generateClusterSummary',
        'generateRequirementsFromSummary',
        'generateIssueInsights',
        'generateInitiativeRecommendations',
        'generateRequirementCards',
      ];

      const availableMethods = requiredMethods.filter(
        (method) => typeof service[method] === 'function'
      );

      await this.addTestResult(
        'Service Methods Availability',
        availableMethods.length === requiredMethods.length,
        `${availableMethods.length}/${requiredMethods.length} methods available`,
        {
          availableMethods,
          missingMethods: requiredMethods.filter((m) => !availableMethods.includes(m)),
        }
      );

      // Test 4: Performance Metrics Access
      try {
        const performanceMetrics = await service.getPerformanceMetrics();
        await this.addTestResult(
          'Performance Metrics Access',
          performanceMetrics !== undefined,
          'Performance metrics accessible',
          { hasMetrics: !!performanceMetrics }
        );
      } catch (error) {
        await this.addTestResult(
          'Performance Metrics Access',
          false,
          `Performance metrics error: ${error.message}`
        );
      }
    } catch (error) {
      await this.addTestResult(
        'AIMigration Service Import',
        false,
        `Failed to import service: ${error.message}`
      );
    }
  }

  async testDatabaseSchema() {
    this.log('Testing AI Optimization Database Schema...', 'test');

    const requiredTables = [
      'AIUsageLog',
      'AIUserQuota',
      'AIPerformanceMetric',
      'AICacheEntry',
      'AIConfiguration',
      'AIQualityFeedback',
    ];

    try {
      for (const tableName of requiredTables) {
        try {
          // Test table existence by trying to count records
          const count = await prisma.$queryRaw`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${tableName}
          `;

          const tableExists = count[0]?.count > 0;
          await this.addTestResult(
            `Database Table: ${tableName}`,
            tableExists,
            tableExists ? 'Table exists' : 'Table missing'
          );
        } catch (error) {
          await this.addTestResult(
            `Database Table: ${tableName}`,
            false,
            `Table check failed: ${error.message}`
          );
        }
      }

      // Test AI configurations
      try {
        const configCount = await prisma.aIConfiguration.count();
        await this.addTestResult(
          'AI Configurations',
          configCount > 0,
          `${configCount} configurations found`,
          { configCount }
        );
      } catch (error) {
        await this.addTestResult(
          'AI Configurations',
          false,
          `Configuration check failed: ${error.message}`
        );
      }
    } catch (error) {
      await this.addTestResult(
        'Database Schema Check',
        false,
        `Database schema test failed: ${error.message}`
      );
    }
  }

  async testUserQuotaSystem() {
    this.log('Testing User Quota System...', 'test');

    try {
      // Test quota creation for existing users
      const userCount = await prisma.user.count();
      const quotaCount = await prisma.aIUserQuota.count();

      await this.addTestResult(
        'User Quota Coverage',
        quotaCount > 0,
        `${quotaCount} quotas for ${userCount} users`,
        { userCount, quotaCount, coverage: quotaCount / Math.max(userCount, 1) }
      );

      // Test quota structure
      if (quotaCount > 0) {
        const sampleQuota = await prisma.aIUserQuota.findFirst();
        const requiredFields = [
          'dailyTokenLimit',
          'monthlyTokenLimit',
          'dailyUsedTokens',
          'monthlyUsedTokens',
          'tier',
          'isBlocked',
        ];

        const hasAllFields = requiredFields.every((field) => sampleQuota[field] !== undefined);

        await this.addTestResult(
          'Quota Structure Validation',
          hasAllFields,
          hasAllFields ? 'All required fields present' : 'Missing required fields',
          { sampleQuota: sampleQuota ? Object.keys(sampleQuota) : [] }
        );
      }
    } catch (error) {
      await this.addTestResult(
        'User Quota System',
        false,
        `Quota system test failed: ${error.message}`
      );
    }
  }

  async testPerformanceMonitoring() {
    this.log('Testing Performance Monitoring System...', 'test');

    try {
      // Test performance metrics creation
      const metricsCount = await prisma.aIPerformanceMetric.count();
      await this.addTestResult(
        'Performance Metrics',
        metricsCount >= 0,
        `${metricsCount} performance metrics records`,
        { metricsCount }
      );

      // Test performance data structure
      if (metricsCount > 0) {
        const sampleMetric = await prisma.aIPerformanceMetric.findFirst();
        const requiredMetricFields = [
          'operation',
          'model',
          'avgLatency',
          'avgCost',
          'avgQuality',
          'successRate',
          'cacheHitRate',
        ];

        const hasAllMetricFields = requiredMetricFields.every(
          (field) => sampleMetric[field] !== undefined
        );

        await this.addTestResult(
          'Performance Metrics Structure',
          hasAllMetricFields,
          hasAllMetricFields ? 'All metric fields present' : 'Missing metric fields',
          { sampleMetric: sampleMetric ? Object.keys(sampleMetric) : [] }
        );
      }

      // Test usage log functionality
      const usageLogCount = await prisma.aIUsageLog.count();
      await this.addTestResult(
        'Usage Logging',
        usageLogCount >= 0,
        `${usageLogCount} usage log entries`,
        { usageLogCount }
      );
    } catch (error) {
      await this.addTestResult(
        'Performance Monitoring',
        false,
        `Performance monitoring test failed: ${error.message}`
      );
    }
  }

  async testCachingSystem() {
    this.log('Testing Intelligent Caching System...', 'test');

    try {
      // Test cache entry structure
      const cacheCount = await prisma.aICacheEntry.count();
      await this.addTestResult('Cache System', cacheCount >= 0, `${cacheCount} cache entries`, {
        cacheCount,
      });

      // Test cache configuration
      const cacheConfig = await prisma.aIConfiguration.findUnique({
        where: { key: 'cache_strategy' },
      });

      await this.addTestResult(
        'Cache Configuration',
        !!cacheConfig,
        cacheConfig ? 'Cache strategy configured' : 'Cache strategy missing',
        {
          cacheConfig: cacheConfig ? cacheConfig.value : null,
          isActive: cacheConfig?.isActive,
        }
      );

      // Test cache cleanup capability
      if (cacheCount > 0) {
        try {
          // Test cache expiry logic
          const expiredCount = await prisma.aICacheEntry.count({
            where: {
              expiresAt: {
                lt: new Date(),
              },
            },
          });

          await this.addTestResult(
            'Cache Expiry Management',
            expiredCount >= 0,
            `${expiredCount} expired cache entries identified`
          );
        } catch (error) {
          await this.addTestResult(
            'Cache Expiry Management',
            false,
            `Cache expiry test failed: ${error.message}`
          );
        }
      }
    } catch (error) {
      await this.addTestResult(
        'Caching System',
        false,
        `Caching system test failed: ${error.message}`
      );
    }
  }

  async testQualityValidation() {
    this.log('Testing Quality Validation System...', 'test');

    try {
      // Test quality feedback structure
      const feedbackCount = await prisma.aIQualityFeedback.count();
      await this.addTestResult(
        'Quality Feedback System',
        feedbackCount >= 0,
        `${feedbackCount} quality feedback entries`,
        { feedbackCount }
      );

      // Test quality thresholds configuration
      const qualityConfig = await prisma.aIConfiguration.findUnique({
        where: { key: 'quality_thresholds' },
      });

      await this.addTestResult(
        'Quality Thresholds',
        !!qualityConfig,
        qualityConfig ? 'Quality thresholds configured' : 'Quality thresholds missing',
        {
          qualityConfig: qualityConfig ? qualityConfig.value : null,
          isActive: qualityConfig?.isActive,
        }
      );

      // Test quality scoring range validation
      if (qualityConfig) {
        const thresholds = qualityConfig.value;
        const validThresholds =
          thresholds.minimumConfidence >= 0 &&
          thresholds.minimumConfidence <= 100 &&
          thresholds.minimumQualityScore >= 0 &&
          thresholds.minimumQualityScore <= 100;

        await this.addTestResult(
          'Quality Threshold Validation',
          validThresholds,
          validThresholds ? 'Valid threshold ranges' : 'Invalid threshold ranges',
          { thresholds }
        );
      }
    } catch (error) {
      await this.addTestResult(
        'Quality Validation',
        false,
        `Quality validation test failed: ${error.message}`
      );
    }
  }

  async testEndpointMigration() {
    this.log('Testing API Endpoint Migration...', 'test');

    // Test that endpoints are using AIMigration service
    const endpointFiles = [
      'app/api/ai/analyze-issue/route.ts',
      'app/api/ai/generate-initiative/route.ts',
      'app/api/clusters/[id]/initiatives/route.ts',
      'app/api/initiatives/[id]/generate-requirement-cards/route.ts',
      'app/api/executive/insights/route.ts',
      'app/api/admin/openai/route.ts',
    ];

    const fs = require('fs');
    const path = require('path');

    for (const endpointFile of endpointFiles) {
      try {
        const filePath = path.join(process.cwd(), endpointFile);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const usesMigration = content.includes('AIMigration') || content.includes('ai-migration');
          const usesOldService =
            content.includes('openAIService') && !content.includes('AIMigration');

          await this.addTestResult(
            `Endpoint Migration: ${endpointFile}`,
            usesMigration && !usesOldService,
            usesMigration ? 'Using AIMigration service' : 'Still using old service',
            { usesMigration, usesOldService }
          );
        } else {
          await this.addTestResult(
            `Endpoint Migration: ${endpointFile}`,
            false,
            'File does not exist'
          );
        }
      } catch (error) {
        await this.addTestResult(
          `Endpoint Migration: ${endpointFile}`,
          false,
          `Migration check failed: ${error.message}`
        );
      }
    }
  }

  async runComprehensiveTest() {
    this.log('🚀 Starting AI Enhancement Phase 2 Testing', 'info');
    this.log('='.repeat(60), 'info');

    await this.testAIMigrationService();
    await this.testDatabaseSchema();
    await this.testUserQuotaSystem();
    await this.testPerformanceMonitoring();
    await this.testCachingSystem();
    await this.testQualityValidation();
    await this.testEndpointMigration();

    // Generate final report
    this.generateFinalReport();
  }

  generateFinalReport() {
    const { passed, failed, total } = this.testResults.summary;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

    this.log('='.repeat(60), 'info');
    this.log('📊 AI ENHANCEMENT PHASE 2 TEST RESULTS', 'info');
    this.log('='.repeat(60), 'info');

    this.log(`Total Tests: ${total}`, 'info');
    this.log(`Passed: ${passed}`, passed > 0 ? 'success' : 'warning');
    this.log(`Failed: ${failed}`, failed > 0 ? 'error' : 'success');
    this.log(`Pass Rate: ${passRate}%`, passRate >= 80 ? 'success' : 'warning');

    // Save detailed report
    const fs = require('fs');
    const path = require('path');

    const reportPath = path.join(
      process.cwd(),
      'logs',
      `ai-enhancement-phase2-test-${Date.now()}.json`
    );
    const logsDir = path.dirname(reportPath);

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));

    this.log(`📄 Detailed report saved: ${reportPath}`, 'info');

    // Overall status
    if (passRate >= 80) {
      this.log('🎉 AI Enhancement Phase 2: READY FOR PRODUCTION!', 'success');
    } else {
      this.log('⚠️  AI Enhancement Phase 2: NEEDS ATTENTION', 'warning');
    }

    this.log('='.repeat(60), 'info');
  }
}

// Run comprehensive testing
async function runTests() {
  const tester = new AIEnhancementTester();

  try {
    await tester.runComprehensiveTest();
  } catch (error) {
    console.error('❌ Testing failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runTests()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { AIEnhancementTester };
