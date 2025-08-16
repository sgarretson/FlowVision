/**
 * AI Cache Manager for FlowVision
 * Provides intelligent caching, rate limiting, and performance optimization for AI operations
 */

import { z } from 'zod';

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum cache size in MB
  compressionEnabled: boolean;
  invalidationRules: string[];
}

export interface AIRequest {
  prompt: string;
  model: string;
  maxTokens: number;
  temperature: number;
  userId?: string;
  contextHash?: string;
}

export interface CachedResponse {
  response: any;
  metadata: {
    model: string;
    tokens: number;
    cost: number;
    timestamp: number;
    hitCount: number;
    confidence?: number;
  };
}

export interface CacheStats {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  cacheSize: number;
  costSavings: number;
  avgResponseTime: number;
}

export interface RateLimitConfig {
  requests: number;
  window: number; // in seconds
  costLimit: number; // in USD per window
  burstLimit: number;
}

/**
 * Intelligent AI Cache Manager
 */
export class AICacheManager {
  private cache = new Map<string, CachedResponse>();
  private requestCounts = new Map<string, { count: number; cost: number; resetTime: number }>();
  private config: CacheConfig;
  private rateLimits: Map<string, RateLimitConfig>;
  private stats: CacheStats;

  constructor(config: CacheConfig) {
    this.config = config;
    this.rateLimits = new Map();
    this.stats = {
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      cacheSize: 0,
      costSavings: 0,
      avgResponseTime: 0,
    };

    // Set up cache cleanup interval
    if (config.enabled) {
      setInterval(() => this.cleanup(), 60000); // Clean every minute
    }
  }

  /**
   * Generate cache key for AI request
   */
  private generateCacheKey(request: AIRequest): string {
    const normalizedRequest = {
      prompt: request.prompt.trim().toLowerCase(),
      model: request.model,
      maxTokens: request.maxTokens,
      temperature: Math.round(request.temperature * 100) / 100, // Round to 2 decimals
      contextHash: request.contextHash,
    };

    return Buffer.from(JSON.stringify(normalizedRequest)).toString('base64');
  }

  /**
   * Check if request can be served from cache
   */
  async get(request: AIRequest): Promise<CachedResponse | null> {
    if (!this.config.enabled) return null;

    const key = this.generateCacheKey(request);
    const cached = this.cache.get(key);

    if (!cached) {
      this.stats.totalRequests++;
      return null;
    }

    // Check TTL
    const now = Date.now();
    if (now - cached.metadata.timestamp > this.config.ttl * 1000) {
      this.cache.delete(key);
      this.stats.totalRequests++;
      return null;
    }

    // Update hit count and stats
    cached.metadata.hitCount++;
    this.stats.totalRequests++;
    this.updateHitRate();

    return cached;
  }

  /**
   * Store AI response in cache
   */
  async set(
    request: AIRequest,
    response: any,
    metadata: { tokens: number; cost: number; confidence?: number }
  ): Promise<void> {
    if (!this.config.enabled) return;

    const key = this.generateCacheKey(request);
    const cachedResponse: CachedResponse = {
      response,
      metadata: {
        model: request.model,
        tokens: metadata.tokens,
        cost: metadata.cost,
        timestamp: Date.now(),
        hitCount: 0,
        confidence: metadata.confidence,
      },
    };

    // Check cache size limits
    if (this.cache.size >= this.config.maxSize * 1024 * 1024) {
      this.evictLeastUsed();
    }

    this.cache.set(key, cachedResponse);
    this.updateCacheStats();
  }

  /**
   * Check rate limits for user/service
   */
  async checkRateLimit(
    userId: string,
    estimatedCost: number,
    rateLimitConfig?: RateLimitConfig
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const config = rateLimitConfig ||
      this.rateLimits.get(userId) || {
        requests: 100,
        window: 3600, // 1 hour
        costLimit: 10.0, // $10 per hour
        burstLimit: 20,
      };

    const now = Date.now();
    const windowStart = now - config.window * 1000;

    let userStats = this.requestCounts.get(userId);

    if (!userStats || userStats.resetTime <= now) {
      userStats = {
        count: 0,
        cost: 0,
        resetTime: now + config.window * 1000,
      };
      this.requestCounts.set(userId, userStats);
    }

    // Check request count limit
    if (userStats.count >= config.requests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: userStats.resetTime,
      };
    }

    // Check cost limit
    if (userStats.cost + estimatedCost > config.costLimit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: userStats.resetTime,
      };
    }

    // Update counters
    userStats.count++;
    userStats.cost += estimatedCost;

    return {
      allowed: true,
      remaining: config.requests - userStats.count,
      resetTime: userStats.resetTime,
    };
  }

  /**
   * Optimize prompt for better caching
   */
  optimizePrompt(prompt: string): string {
    return prompt
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n+/g, '\n') // Normalize line breaks
      .toLowerCase(); // Case insensitive caching
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Clear cache with optional pattern
   */
  async clear(pattern?: string): Promise<number> {
    if (!pattern) {
      const size = this.cache.size;
      this.cache.clear();
      this.updateCacheStats();
      return size;
    }

    let cleared = 0;
    const regex = new RegExp(pattern);

    for (const [key] of this.cache) {
      if (regex.test(key)) {
        this.cache.delete(key);
        cleared++;
      }
    }

    this.updateCacheStats();
    return cleared;
  }

  /**
   * Invalidate cache based on rules
   */
  async invalidate(context: string): Promise<number> {
    let invalidated = 0;

    for (const rule of this.config.invalidationRules) {
      if (context.includes(rule)) {
        invalidated += await this.clear(rule);
      }
    }

    return invalidated;
  }

  /**
   * Estimate cost for AI request
   */
  estimateCost(request: AIRequest): number {
    const modelCosts: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.03, output: 0.06 }, // per 1K tokens
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
    };

    const cost = modelCosts[request.model] || modelCosts['gpt-3.5-turbo'];
    const estimatedInputTokens = Math.ceil(request.prompt.length / 4); // Rough estimation
    const estimatedTotalTokens = estimatedInputTokens + request.maxTokens;

    return (estimatedTotalTokens / 1000) * cost.input + (request.maxTokens / 1000) * cost.output;
  }

  /**
   * Batch process AI requests with intelligent queuing
   */
  async batchProcess(
    requests: AIRequest[],
    processor: (request: AIRequest) => Promise<any>
  ): Promise<any[]> {
    const results: any[] = [];
    const pendingRequests: AIRequest[] = [];

    // Check cache first
    for (const request of requests) {
      const cached = await this.get(request);
      if (cached) {
        results.push(cached.response);
      } else {
        pendingRequests.push(request);
      }
    }

    // Process pending requests in batches
    const batchSize = 5; // Limit concurrent requests
    const batches = [];

    for (let i = 0; i < pendingRequests.length; i += batchSize) {
      batches.push(pendingRequests.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map(async (request) => {
          const result = await processor(request);
          // Cache the result
          await this.set(request, result, {
            tokens: result.usage?.total_tokens || 0,
            cost: this.estimateCost(request),
            confidence: result.confidence,
          });
          return result;
        })
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Get similar cached responses
   */
  async getSimilar(request: AIRequest, threshold: number = 0.8): Promise<CachedResponse[]> {
    const similar: CachedResponse[] = [];
    const requestWords = new Set(request.prompt.toLowerCase().split(/\s+/));

    for (const [key, cached] of this.cache) {
      try {
        const cachedRequest = JSON.parse(Buffer.from(key, 'base64').toString());
        const cachedWords = new Set(cachedRequest.prompt.split(/\s+/));

        // Calculate Jaccard similarity
        const intersection = new Set([...requestWords].filter((x) => cachedWords.has(x)));
        const union = new Set([...requestWords, ...cachedWords]);
        const similarity = intersection.size / union.size;

        if (similarity >= threshold) {
          similar.push(cached);
        }
      } catch (error) {
        // Skip invalid cache entries
        continue;
      }
    }

    return similar.sort((a, b) => b.metadata.hitCount - a.metadata.hitCount);
  }

  /**
   * Update hit rate statistics
   */
  private updateHitRate(): void {
    const hits = Array.from(this.cache.values()).reduce(
      (sum, cached) => sum + cached.metadata.hitCount,
      0
    );
    this.stats.hitRate = this.stats.totalRequests > 0 ? hits / this.stats.totalRequests : 0;
    this.stats.missRate = 1 - this.stats.hitRate;
  }

  /**
   * Update cache size statistics
   */
  private updateCacheStats(): void {
    this.stats.cacheSize = this.cache.size;
    this.stats.costSavings = Array.from(this.cache.values()).reduce(
      (sum, cached) => sum + cached.metadata.cost * cached.metadata.hitCount,
      0
    );
  }

  /**
   * Evict least recently used entries
   */
  private evictLeastUsed(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].metadata.timestamp - b[1].metadata.timestamp);

    // Remove oldest 10% of entries
    const toRemove = Math.ceil(entries.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const ttlMs = this.config.ttl * 1000;

    for (const [key, cached] of this.cache) {
      if (now - cached.metadata.timestamp > ttlMs) {
        this.cache.delete(key);
      }
    }

    // Cleanup rate limit counters
    for (const [userId, stats] of this.requestCounts) {
      if (stats.resetTime <= now) {
        this.requestCounts.delete(userId);
      }
    }

    this.updateCacheStats();
  }

  /**
   * Export cache for persistence
   */
  async export(): Promise<any> {
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      value,
    }));

    return {
      version: '1.0',
      timestamp: Date.now(),
      config: this.config,
      stats: this.stats,
      entries,
    };
  }

  /**
   * Import cache from persistence
   */
  async import(data: any): Promise<void> {
    if (data.version !== '1.0') {
      throw new Error('Incompatible cache version');
    }

    this.cache.clear();

    for (const entry of data.entries) {
      this.cache.set(entry.key, entry.value);
    }

    this.stats = data.stats;
    this.updateCacheStats();
  }
}

/**
 * Create configured cache manager instance
 */
export function createAICacheManager(): AICacheManager {
  const config: CacheConfig = {
    enabled: process.env.AI_CACHE_ENABLED !== 'false',
    ttl: parseInt(process.env.AI_CACHE_TTL || '3600'), // 1 hour default
    maxSize: parseInt(process.env.AI_CACHE_MAX_SIZE || '100'), // 100MB default
    compressionEnabled: process.env.AI_CACHE_COMPRESSION === 'true',
    invalidationRules: ['user_updated', 'system_config_changed', 'business_profile_modified'],
  };

  return new AICacheManager(config);
}

// Global cache manager instance
export const aiCacheManager = createAICacheManager();
