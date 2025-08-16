/**
 * Environment Configuration and Validation
 * Ensures all required environment variables are properly configured
 */

import { z } from 'zod';

export const environmentSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Authentication
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),

  // Node Environment
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),

  // Optional: Admin seed configuration
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(8).optional(),

  // Optional: AI Services
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
  OPENAI_ORG_ID: z.string().startsWith('org-').optional(),

  // Optional: Email configuration
  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.string().transform(Number).optional(),
  EMAIL_SERVER_USER: z.string().optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Optional: File storage
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),

  // Optional: Redis
  REDIS_URL: z.string().url().optional(),

  // Optional: Monitoring
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),

  // Optional: Security
  RATE_LIMIT_ENABLED: z.string().transform(Boolean).optional(),
  RATE_LIMIT_WINDOW: z.string().transform(Number).optional(),
  RATE_LIMIT_MAX: z.string().transform(Number).optional(),
});

export type EnvironmentConfig = z.infer<typeof environmentSchema>;

/**
 * Validate environment configuration
 */
export function validateEnvironment(): {
  success: boolean;
  config?: EnvironmentConfig;
  errors?: string[];
} {
  try {
    const config = environmentSchema.parse(process.env);
    return { success: true, config };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Unknown environment validation error'] };
  }
}

/**
 * Get environment configuration with validation
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const result = validateEnvironment();

  if (!result.success) {
    console.error('❌ Environment validation failed:');
    result.errors?.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  return result.config!;
}

/**
 * Check if required services are configured
 */
export function getServiceStatus() {
  const config = getEnvironmentConfig();

  return {
    database: !!config.DATABASE_URL,
    authentication: !!(config.NEXTAUTH_SECRET && config.NEXTAUTH_URL),
    ai: !!config.OPENAI_API_KEY,
    email: !!(config.EMAIL_SERVER_HOST && config.EMAIL_SERVER_USER),
    fileStorage: !!(config.AWS_ACCESS_KEY_ID || process.env.UPLOAD_DIR),
    redis: !!config.REDIS_URL,
    monitoring: !!(config.NEXT_PUBLIC_GA_ID || config.SENTRY_DSN),
  };
}

/**
 * Get database configuration with validation
 */
export function getDatabaseConfig() {
  const config = getEnvironmentConfig();

  if (config.NODE_ENV === 'production' && !config.DATABASE_URL.startsWith('postgresql://')) {
    throw new Error('Production environment requires PostgreSQL database');
  }

  return {
    url: config.DATABASE_URL,
    isPostgreSQL: config.DATABASE_URL.startsWith('postgresql://'),
    isProduction: config.NODE_ENV === 'production',
  };
}

/**
 * Get AI service configuration
 */
export function getAIConfig() {
  const config = getEnvironmentConfig();

  return {
    enabled: !!config.OPENAI_API_KEY,
    apiKey: config.OPENAI_API_KEY,
    orgId: config.OPENAI_ORG_ID,
    model: process.env.OPENAI_MODEL || 'gpt-4',
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4000'),
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
    timeout: parseInt(process.env.AI_TIMEOUT || '30000'),
  };
}

/**
 * Get email service configuration
 */
export function getEmailConfig() {
  const config = getEnvironmentConfig();

  return {
    enabled: !!(config.EMAIL_SERVER_HOST && config.EMAIL_SERVER_USER),
    smtp: {
      host: config.EMAIL_SERVER_HOST,
      port: config.EMAIL_SERVER_PORT || 587,
      user: config.EMAIL_SERVER_USER,
      password: config.EMAIL_SERVER_PASSWORD,
    },
    from: config.EMAIL_FROM || config.EMAIL_SERVER_USER,
  };
}

/**
 * Get security configuration
 */
export function getSecurityConfig() {
  const config = getEnvironmentConfig();

  return {
    forceHttps: config.NODE_ENV === 'production',
    rateLimitEnabled: config.RATE_LIMIT_ENABLED ?? true,
    rateLimitWindow: config.RATE_LIMIT_WINDOW || 15 * 60 * 1000, // 15 minutes
    rateLimitMax: config.RATE_LIMIT_MAX || 100,
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [],
    hstsMaxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000'),
  };
}

/**
 * Startup environment check
 */
export function performStartupCheck() {
  console.log('🔧 Checking environment configuration...');

  const validation = validateEnvironment();
  if (!validation.success) {
    console.error('❌ Environment validation failed:');
    validation.errors?.forEach((error) => console.error(`  - ${error}`));

    console.log('\n📝 Required environment variables:');
    console.log('  - DATABASE_URL: PostgreSQL connection string');
    console.log('  - NEXTAUTH_SECRET: Random secret (32+ characters)');
    console.log('  - NEXTAUTH_URL: Application URL (e.g., http://localhost:3000)');

    console.log('\n💡 Generate secrets with:');
    console.log('  openssl rand -base64 32');

    process.exit(1);
  }

  const services = getServiceStatus();
  console.log('✅ Environment validation passed');

  console.log('\n📋 Service Status:');
  console.log(`  Database: ${services.database ? '✅' : '❌'}`);
  console.log(`  Authentication: ${services.authentication ? '✅' : '❌'}`);
  console.log(`  AI Services: ${services.ai ? '✅' : '⚠️  Optional'}`);
  console.log(`  Email: ${services.email ? '✅' : '⚠️  Optional'}`);
  console.log(`  File Storage: ${services.fileStorage ? '✅' : '⚠️  Optional'}`);
  console.log(`  Redis: ${services.redis ? '✅' : '⚠️  Optional'}`);
  console.log(`  Monitoring: ${services.monitoring ? '✅' : '⚠️  Optional'}`);

  return validation.config!;
}

/**
 * Environment template generator
 */
export function generateEnvironmentTemplate(): string {
  return `# FlowVision Environment Configuration
# Copy this file to .env.local and configure with your actual values

# =============================================================================
# REQUIRED CONFIGURATION
# =============================================================================

# Database (PostgreSQL recommended for production)
DATABASE_URL="postgresql://username:password@host:port/database"

# Authentication (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-nextauth-secret-minimum-32-characters"
NEXTAUTH_URL="http://localhost:3000"

# =============================================================================
# OPTIONAL CONFIGURATION
# =============================================================================

# Admin seed user (change in production!)
SEED_ADMIN_EMAIL="admin@yourdomain.com"
SEED_ADMIN_PASSWORD="SecurePassword123!"

# AI Services
OPENAI_API_KEY="sk-your-openai-api-key"
OPENAI_ORG_ID="org-your-organization-id"

# Email SMTP
EMAIL_SERVER_HOST="smtp.yourdomain.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="noreply@yourdomain.com"
EMAIL_SERVER_PASSWORD="your-email-password"
EMAIL_FROM="noreply@yourdomain.com"

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="flowvision-uploads"

# Redis (for caching and rate limiting)
REDIS_URL="redis://localhost:6379"

# Monitoring
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
SENTRY_DSN="your-sentry-dsn"

# =============================================================================
# PRODUCTION SECURITY
# =============================================================================

# Rate limiting
RATE_LIMIT_ENABLED="true"
RATE_LIMIT_WINDOW="900000"  # 15 minutes
RATE_LIMIT_MAX="100"        # Max requests per window

# CORS
CORS_ORIGINS="https://yourdomain.com"

# Security headers
HSTS_MAX_AGE="31536000"
`;
}
