import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { NextRequest } from 'next/server';

// Input validation schemas
export const emailSchema = z.string().email().max(255);
export const passwordSchema = z
  .string()
  .min(8)
  .max(128)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  );

export const nameSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

// Sanitization functions
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .substring(0, 1000); // Limit length
}

export function sanitizeFileName(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .substring(0, 255); // Limit length
}

// Rate limiting configurations
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many API requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers
export const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob:;
    font-src 'self';
    connect-src 'self';
    frame-ancestors 'none';
  `
    .replace(/\s+/g, ' ')
    .trim(),
};

// IP validation
export function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

// File upload security
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  return { valid: true };
}

// SQL Injection Prevention (Prisma handles this, but additional validation)
export function validateDatabaseInput(input: any): boolean {
  if (typeof input === 'string') {
    // Check for common SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)\b)/i,
      /(['"]);?\s*(DROP|DELETE|INSERT|UPDATE)/i,
      /(UNION\s+SELECT)/i,
      /(-{2}|\/\*|\*\/)/,
    ];

    return !sqlPatterns.some((pattern) => pattern.test(input));
  }

  return true;
}

// CSRF Protection
export function generateCSRFToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken && token.length >= 20;
}

// Request logging for security monitoring
export function logSecurityEvent(event: {
  type: 'AUTH_FAILURE' | 'RATE_LIMIT' | 'INVALID_TOKEN' | 'SUSPICIOUS_REQUEST';
  ip?: string;
  userAgent?: string;
  email?: string;
  details?: any;
}) {
  console.warn(`[SECURITY] ${event.type}:`, {
    timestamp: new Date().toISOString(),
    ip: event.ip,
    userAgent: event.userAgent,
    email: event.email,
    details: event.details,
  });
}

// Environment validation
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  }

  if (!process.env.NEXTAUTH_SECRET) {
    errors.push('NEXTAUTH_SECRET is required');
  }

  if (!process.env.NEXTAUTH_URL) {
    errors.push('NEXTAUTH_URL is required');
  }

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.DATABASE_URL?.startsWith('postgresql://')) {
      errors.push('Production requires PostgreSQL database');
    }

    if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
      errors.push('NEXTAUTH_SECRET should be at least 32 characters in production');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Permission boundary enforcement
export function enforcePermissionBoundary(
  userRole: 'ADMIN' | 'LEADER',
  requiredRole: 'ADMIN' | 'LEADER'
): boolean {
  if (requiredRole === 'ADMIN') {
    return userRole === 'ADMIN';
  }
  return true; // LEADER can access LEADER-level resources
}
