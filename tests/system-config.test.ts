import { systemConfig } from '../lib/system-config';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    systemConfiguration: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  })),
}));

const mockPrisma = new PrismaClient();

describe('SystemConfigService', () => {
  beforeEach(() => {
    // Clear cache before each test
    systemConfig.clearCache();
    jest.clearAllMocks();
  });

  describe('Configuration Retrieval', () => {
    it('should get configuration from database when not cached', async () => {
      const mockConfig = {
        id: 'test-id',
        category: 'scoring',
        key: 'issue_priority_thresholds',
        value: { critical: 80, high: 60, medium: 40, low: 0 },
        isActive: true,
      };

      (mockPrisma.systemConfiguration.findUnique as jest.Mock).mockResolvedValue(mockConfig);

      const result = await systemConfig.getConfig('scoring', 'issue_priority_thresholds');

      expect(result).toEqual(mockConfig.value);
      expect(mockPrisma.systemConfiguration.findUnique).toHaveBeenCalledWith({
        where: {
          category_key_environment_scope: {
            category: 'scoring',
            key: 'issue_priority_thresholds',
            environment: expect.any(String),
            scope: 'global',
          },
        },
      });
    });

    it('should return cached value on subsequent calls', async () => {
      const mockConfig = {
        id: 'test-id',
        category: 'scoring',
        key: 'issue_priority_thresholds',
        value: { critical: 80, high: 60, medium: 40, low: 0 },
        isActive: true,
      };

      (mockPrisma.systemConfiguration.findUnique as jest.Mock).mockResolvedValue(mockConfig);

      // First call - should hit database
      const result1 = await systemConfig.getConfig('scoring', 'issue_priority_thresholds');

      // Second call - should use cache
      const result2 = await systemConfig.getConfig('scoring', 'issue_priority_thresholds');

      expect(result1).toEqual(mockConfig.value);
      expect(result2).toEqual(mockConfig.value);
      expect(mockPrisma.systemConfiguration.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should use fallback when configuration not found', async () => {
      (mockPrisma.systemConfiguration.findUnique as jest.Mock).mockResolvedValue(null);

      const fallback = { critical: 90, high: 70, medium: 50, low: 10 };
      const result = await systemConfig.getConfig('scoring', 'nonexistent_config', fallback);

      expect(result).toEqual(fallback);
    });

    it('should throw error when no configuration and no fallback', async () => {
      (mockPrisma.systemConfiguration.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(systemConfig.getConfig('scoring', 'nonexistent_config')).rejects.toThrow(
        'Configuration scoring.nonexistent_config not found and no fallback provided'
      );
    });
  });

  describe('Typed Configuration Getters', () => {
    it('should get scoring thresholds with correct type', async () => {
      const mockConfig = {
        value: { critical: 80, high: 60, medium: 40, low: 0 },
        isActive: true,
      };

      (mockPrisma.systemConfiguration.findUnique as jest.Mock).mockResolvedValue(mockConfig);

      const result = await systemConfig.getScoringThresholds();

      expect(result).toEqual(mockConfig.value);
      expect(typeof result.critical).toBe('number');
      expect(typeof result.high).toBe('number');
      expect(typeof result.medium).toBe('number');
      expect(typeof result.low).toBe('number');
    });

    it('should get AI fallback model', async () => {
      const mockConfig = {
        value: 'gpt-4-turbo',
        isActive: true,
      };

      (mockPrisma.systemConfiguration.findUnique as jest.Mock).mockResolvedValue(mockConfig);

      const result = await systemConfig.getAIFallbackModel();

      expect(result).toBe('gpt-4-turbo');
      expect(typeof result).toBe('string');
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration and invalidate cache', async () => {
      const newValue = { critical: 85, high: 65, medium: 45, low: 5 };

      (mockPrisma.systemConfiguration.upsert as jest.Mock).mockResolvedValue({
        id: 'test-id',
        value: newValue,
      });

      await systemConfig.setConfig('scoring', 'issue_priority_thresholds', newValue);

      expect(mockPrisma.systemConfiguration.upsert).toHaveBeenCalledWith({
        where: {
          category_key_environment_scope: {
            category: 'scoring',
            key: 'issue_priority_thresholds',
            environment: expect.any(String),
            scope: 'global',
          },
        },
        update: {
          value: newValue,
          description: undefined,
          updatedBy: undefined,
          version: { increment: 1 },
        },
        create: {
          category: 'scoring',
          key: 'issue_priority_thresholds',
          value: newValue,
          dataType: 'json',
          description: undefined,
          environment: expect.any(String),
          scope: 'global',
          updatedBy: undefined,
        },
      });
    });
  });

  describe('Change Listeners', () => {
    it('should notify listeners when configuration changes', async () => {
      const mockCallback = jest.fn();
      const newValue = { critical: 85, high: 65, medium: 45, low: 5 };

      // Set up listener
      const unsubscribe = systemConfig.onChange(
        'scoring',
        'issue_priority_thresholds',
        mockCallback
      );

      // Mock the upsert
      (mockPrisma.systemConfiguration.upsert as jest.Mock).mockResolvedValue({
        id: 'test-id',
        value: newValue,
      });

      // Update configuration
      await systemConfig.setConfig('scoring', 'issue_priority_thresholds', newValue);

      // Check if listener was called
      expect(mockCallback).toHaveBeenCalledWith(newValue);

      // Cleanup
      unsubscribe();
    });

    it('should remove listeners when unsubscribed', async () => {
      const mockCallback = jest.fn();

      // Set up and immediately unsubscribe
      const unsubscribe = systemConfig.onChange(
        'scoring',
        'issue_priority_thresholds',
        mockCallback
      );
      unsubscribe();

      // Mock the upsert
      (mockPrisma.systemConfiguration.upsert as jest.Mock).mockResolvedValue({
        id: 'test-id',
        value: { test: 'value' },
      });

      // Update configuration
      await systemConfig.setConfig('scoring', 'issue_priority_thresholds', { test: 'value' });

      // Listener should not be called
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('Health Check', () => {
    it('should return healthy status when database is accessible', async () => {
      (mockPrisma.systemConfiguration.count as jest.Mock).mockResolvedValue(10);

      const health = await systemConfig.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.dbConnection).toBe(true);
      expect(typeof health.cacheSize).toBe('number');
      expect(typeof health.lastCheck).toBe('string');
    });

    it('should return unhealthy status when database is not accessible', async () => {
      (mockPrisma.systemConfiguration.count as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const health = await systemConfig.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.dbConnection).toBe(false);
    });
  });

  describe('Cache Management', () => {
    it('should provide cache statistics', () => {
      const stats = systemConfig.getCacheStats();

      expect(typeof stats.size).toBe('number');
      expect(Array.isArray(stats.entries)).toBe(true);
    });

    it('should clear cache when requested', () => {
      systemConfig.clearCache();

      const stats = systemConfig.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      (mockPrisma.systemConfiguration.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const fallback = { critical: 80, high: 60, medium: 40, low: 0 };
      const result = await systemConfig.getConfig('scoring', 'issue_priority_thresholds', fallback);

      expect(result).toEqual(fallback);
    });

    it('should throw error when database fails and no fallback', async () => {
      (mockPrisma.systemConfiguration.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        systemConfig.getConfig('scoring', 'issue_priority_thresholds')
      ).rejects.toThrow();
    });
  });

  describe('Environment Support', () => {
    it('should load environment-specific configuration', async () => {
      const mockConfig = {
        value: { development: 'value' },
        isActive: true,
      };

      (mockPrisma.systemConfiguration.findUnique as jest.Mock).mockResolvedValue(mockConfig);

      const result = await systemConfig.getConfig('test', 'env_specific', undefined, 'development');

      expect(result).toEqual(mockConfig.value);
      expect(mockPrisma.systemConfiguration.findUnique).toHaveBeenCalledWith({
        where: {
          category_key_environment_scope: {
            category: 'test',
            key: 'env_specific',
            environment: 'development',
            scope: 'global',
          },
        },
      });
    });
  });
});
