-- AI Optimization Database Schema Extensions
-- Add these tables to track AI usage, performance, and costs

-- AI Usage Logging Table
CREATE TABLE IF NOT EXISTS "AIUsageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "cost" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "latency" INTEGER NOT NULL DEFAULT 0,
    "cacheHit" BOOLEAN NOT NULL DEFAULT false,
    "modelUsed" TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',
    "quality" INTEGER NOT NULL DEFAULT 100,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    
    CONSTRAINT "AIUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- AI User Quotas Table
CREATE TABLE IF NOT EXISTS "AIUserQuota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "tier" TEXT NOT NULL DEFAULT 'basic', -- basic, premium, enterprise
    "dailyTokenLimit" INTEGER NOT NULL DEFAULT 10000,
    "monthlyTokenLimit" INTEGER NOT NULL DEFAULT 250000,
    "dailyUsedTokens" INTEGER NOT NULL DEFAULT 0,
    "monthlyUsedTokens" INTEGER NOT NULL DEFAULT 0,
    "dailyCost" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "monthlyCost" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "lastResetDaily" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastResetMonthly" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "AIUserQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- AI Performance Metrics Table
CREATE TABLE IF NOT EXISTS "AIPerformanceMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operation" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "avgLatency" INTEGER NOT NULL DEFAULT 0,
    "avgCost" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "avgQuality" INTEGER NOT NULL DEFAULT 100,
    "successRate" DECIMAL(5,4) NOT NULL DEFAULT 1.0,
    "cacheHitRate" DECIMAL(5,4) NOT NULL DEFAULT 0.0,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE("operation", "model", "date")
);

-- AI Cache Entries Table (for persistent caching)
CREATE TABLE IF NOT EXISTS "AICacheEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cacheKey" TEXT NOT NULL UNIQUE,
    "operation" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "quality" INTEGER NOT NULL DEFAULT 100,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "modelUsed" TEXT NOT NULL,
    "tokenCount" INTEGER NOT NULL DEFAULT 0,
    "cost" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- AI Configuration Table
CREATE TABLE IF NOT EXISTS "AIConfiguration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL UNIQUE,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "AIConfiguration_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- AI Quality Feedback Table
CREATE TABLE IF NOT EXISTS "AIQualityFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usageLogId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
    "feedback" TEXT,
    "isHelpful" BOOLEAN,
    "reportedIssues" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "AIQualityFeedback_usageLogId_fkey" FOREIGN KEY ("usageLogId") REFERENCES "AIUsageLog"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AIQualityFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "AIUsageLog_userId_timestamp_idx" ON "AIUsageLog"("userId", "timestamp");
CREATE INDEX IF NOT EXISTS "AIUsageLog_operation_timestamp_idx" ON "AIUsageLog"("operation", "timestamp");
CREATE INDEX IF NOT EXISTS "AIUsageLog_modelUsed_timestamp_idx" ON "AIUsageLog"("modelUsed", "timestamp");
CREATE INDEX IF NOT EXISTS "AIUsageLog_cost_idx" ON "AIUsageLog"("cost");
CREATE INDEX IF NOT EXISTS "AIUsageLog_cacheHit_idx" ON "AIUsageLog"("cacheHit");

CREATE INDEX IF NOT EXISTS "AICacheEntry_operation_idx" ON "AICacheEntry"("operation");
CREATE INDEX IF NOT EXISTS "AICacheEntry_expiresAt_idx" ON "AICacheEntry"("expiresAt");
CREATE INDEX IF NOT EXISTS "AICacheEntry_lastUsed_idx" ON "AICacheEntry"("lastUsed");
CREATE INDEX IF NOT EXISTS "AICacheEntry_quality_idx" ON "AICacheEntry"("quality");

CREATE INDEX IF NOT EXISTS "AIPerformanceMetric_date_idx" ON "AIPerformanceMetric"("date");
CREATE INDEX IF NOT EXISTS "AIPerformanceMetric_operation_model_idx" ON "AIPerformanceMetric"("operation", "model");

-- Insert default AI configurations
INSERT INTO "AIConfiguration" ("id", "key", "value", "description", "updatedBy") VALUES 
(
    'default-models',
    'model_configs',
    '{
        "gpt-3.5-turbo": {
            "cost": 0.002,
            "speed": "fast",
            "quality": "good",
            "contextWindow": 4096,
            "inputCost": 0.0015,
            "outputCost": 0.002
        },
        "gpt-4": {
            "cost": 0.06,
            "speed": "slow", 
            "quality": "excellent",
            "contextWindow": 8192,
            "inputCost": 0.03,
            "outputCost": 0.06
        },
        "gpt-3.5-turbo-16k": {
            "cost": 0.004,
            "speed": "medium",
            "quality": "good", 
            "contextWindow": 16384,
            "inputCost": 0.003,
            "outputCost": 0.004
        }
    }',
    'Model configurations for cost and performance optimization',
    (SELECT "id" FROM "User" WHERE "role" = 'ADMIN' LIMIT 1)
) ON CONFLICT ("key") DO NOTHING;

INSERT INTO "AIConfiguration" ("id", "key", "value", "description", "updatedBy") VALUES
(
    'quota-tiers',
    'user_quotas',
    '{
        "basic": {
            "dailyTokenLimit": 10000,
            "monthlyTokenLimit": 250000,
            "maxRequestsPerMinute": 10,
            "allowedModels": ["gpt-3.5-turbo"]
        },
        "premium": {
            "dailyTokenLimit": 50000,
            "monthlyTokenLimit": 1000000,
            "maxRequestsPerMinute": 30,
            "allowedModels": ["gpt-3.5-turbo", "gpt-3.5-turbo-16k"]
        },
        "enterprise": {
            "dailyTokenLimit": 200000,
            "monthlyTokenLimit": 5000000,
            "maxRequestsPerMinute": 100,
            "allowedModels": ["gpt-3.5-turbo", "gpt-3.5-turbo-16k", "gpt-4"]
        }
    }',
    'User tier quota configurations',
    (SELECT "id" FROM "User" WHERE "role" = 'ADMIN' LIMIT 1)
) ON CONFLICT ("key") DO NOTHING;

INSERT INTO "AIConfiguration" ("id", "key", "value", "description", "updatedBy") VALUES
(
    'optimization-settings',
    'ai_optimization',
    '{
        "cacheTTL": 3600000,
        "batchSize": 5,
        "batchTimeout": 2000,
        "maxRetries": 3,
        "qualityThreshold": 70,
        "enablePersistentCache": true,
        "enableBatching": true,
        "enableQualityValidation": true
    }',
    'AI optimization and performance settings',
    (SELECT "id" FROM "User" WHERE "role" = 'ADMIN' LIMIT 1)
) ON CONFLICT ("key") DO NOTHING;

-- Create a view for AI analytics dashboard
CREATE OR REPLACE VIEW "AIAnalyticsDashboard" AS
SELECT 
    DATE(timestamp) as date,
    operation,
    modelUsed as model,
    COUNT(*) as request_count,
    SUM(totalTokens) as total_tokens,
    SUM(cost) as total_cost,
    AVG(latency) as avg_latency,
    AVG(quality) as avg_quality,
    SUM(CASE WHEN cacheHit THEN 1 ELSE 0 END)::float / COUNT(*) as cache_hit_rate,
    SUM(CASE WHEN quality >= 80 THEN 1 ELSE 0 END)::float / COUNT(*) as high_quality_rate
FROM "AIUsageLog"
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(timestamp), operation, modelUsed
ORDER BY date DESC, total_cost DESC;

-- Create a view for user AI usage summary
CREATE OR REPLACE VIEW "UserAIUsageSummary" AS
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    COUNT(DISTINCT DATE(aul.timestamp)) as active_days,
    COUNT(aul.id) as total_requests,
    SUM(aul.totalTokens) as total_tokens,
    SUM(aul.cost) as total_cost,
    AVG(aul.quality) as avg_quality,
    SUM(CASE WHEN aul.cacheHit THEN 1 ELSE 0 END)::float / COUNT(aul.id) as cache_hit_rate,
    MAX(aul.timestamp) as last_usage
FROM "User" u
LEFT JOIN "AIUsageLog" aul ON u.id = aul.userId
WHERE aul.timestamp >= CURRENT_DATE - INTERVAL '30 days' OR aul.timestamp IS NULL
GROUP BY u.id, u.name, u.email
ORDER BY total_cost DESC NULLS LAST;
