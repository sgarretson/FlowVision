/**
 * Enhanced Security Middleware for FlowVision
 * Provides comprehensive security controls including RBAC, input sanitization, and threat protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Security configuration
export const SECURITY_CONFIG = {
  MAX_REQUEST_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_STRING_LENGTH: 50000,
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
  BLOCKED_PATTERNS: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
    /javascript:/gi, // JavaScript URLs
    /vbscript:/gi, // VBScript URLs
    /on\w+\s*=/gi, // Event handlers
    /expression\s*\(/gi, // CSS expressions
    /eval\s*\(/gi, // Eval calls
    /exec\s*\(/gi, // Exec calls
  ],
  SENSITIVE_FIELDS: ['password', 'token', 'secret', 'key', 'apiKey'],
};

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface SecurityContext {
  user: {
    id: string;
    email: string;
    role: 'ADMIN' | 'LEADER';
  };
  clientInfo: {
    ip: string;
    userAgent: string;
    origin?: string;
  };
  permissions: string[];
}

export interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
  securityFlags: {
    containsSuspiciousContent: boolean;
    exceedsLimits: boolean;
    potentialXSS: boolean;
    potentialSQLInjection: boolean;
  };
}

/**
 * Main security middleware factory
 */
export function createSecurityMiddleware(
  options: {
    requireAuth?: boolean;
    requiredRole?: 'ADMIN' | 'LEADER';
    requiredPermissions?: string[];
    validateInput?: boolean;
    rateLimitKey?: string;
    maxRequestSize?: number;
  } = {}
) {
  return async function securityMiddleware(
    req: NextRequest,
    handler: (req: NextRequest, context: SecurityContext) => Promise<NextResponse>
  ): Promise<NextResponse> {
    let securityContext: SecurityContext | null = null;

    try {
      // 1. Rate limiting
      if (options.rateLimitKey) {
        const rateLimitResult = checkRateLimit(req, options.rateLimitKey);
        if (!rateLimitResult.allowed) {
          return NextResponse.json(
            { error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter },
            { status: 429 }
          );
        }
      }

      // 2. Request size validation
      const maxSize = options.maxRequestSize || SECURITY_CONFIG.MAX_REQUEST_SIZE;
      if (req.headers.get('content-length')) {
        const contentLength = parseInt(req.headers.get('content-length')!);
        if (contentLength > maxSize) {
          return NextResponse.json({ error: 'Request too large' }, { status: 413 });
        }
      }

      // 3. Authentication
      if (options.requireAuth !== false) {
        const authResult = await validateAuthentication(req);
        if (!authResult.success) {
          return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        securityContext = authResult.context!;

        // 4. Role-based authorization
        if (options.requiredRole && securityContext.user.role !== options.requiredRole) {
          if (!(options.requiredRole === 'LEADER' && securityContext.user.role === 'ADMIN')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
          }
        }

        // 5. Permission-based authorization
        if (options.requiredPermissions?.length) {
          const hasPermissions = await validatePermissions(
            securityContext.user.id,
            options.requiredPermissions
          );
          if (!hasPermissions) {
            return NextResponse.json({ error: 'Required permissions not met' }, { status: 403 });
          }
        }
      }

      // 6. Input validation and sanitization
      if (options.validateInput && req.method !== 'GET') {
        const validationResult = await validateAndSanitizeInput(req);
        if (!validationResult.isValid) {
          return NextResponse.json(
            {
              error: 'Invalid input',
              details: validationResult.errors,
              securityFlags: validationResult.securityFlags,
            },
            { status: 400 }
          );
        }
      }

      // 7. Security headers
      const response = await handler(req, securityContext!);
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Security middleware error:', error);

      // Log security incidents
      if (securityContext?.user) {
        await logSecurityIncident({
          userId: securityContext.user.id,
          action: 'SECURITY_ERROR',
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            url: req.url,
            method: req.method,
            userAgent: req.headers.get('user-agent'),
          },
        });
      }

      return NextResponse.json({ error: 'Security validation failed' }, { status: 500 });
    }
  };
}

/**
 * Validate authentication and extract user context
 */
async function validateAuthentication(req: NextRequest): Promise<{
  success: boolean;
  error?: string;
  status?: number;
  context?: SecurityContext;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return {
        success: false,
        error: 'Authentication required',
        status: 401,
      };
    }

    // Get full user data with permissions
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        role: true,
        // Add any permission-related fields here
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
        status: 404,
      };
    }

    // Build security context
    const context: SecurityContext = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      clientInfo: {
        ip: req.ip || req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        origin: req.headers.get('origin') || undefined,
      },
      permissions: await getUserPermissions(user.id, user.role),
    };

    return {
      success: true,
      context,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Authentication validation failed',
      status: 500,
    };
  }
}

/**
 * Get user permissions based on role and specific grants
 */
async function getUserPermissions(userId: string, role: 'ADMIN' | 'LEADER'): Promise<string[]> {
  const basePermissions: Record<string, string[]> = {
    ADMIN: [
      'read:all',
      'write:all',
      'delete:all',
      'admin:system',
      'admin:users',
      'admin:audit',
      'ai:configure',
    ],
    LEADER: [
      'read:own',
      'write:own',
      'read:issues',
      'write:issues',
      'read:initiatives',
      'write:initiatives',
      'ai:use',
    ],
  };

  // Start with role-based permissions
  const permissions = [...basePermissions[role]];

  // TODO: Add database-driven permissions if needed
  // const customPermissions = await prisma.userPermission.findMany({
  //   where: { userId },
  //   select: { permission: true },
  // });
  // permissions.push(...customPermissions.map(p => p.permission));

  return permissions;
}

/**
 * Validate specific permissions
 */
async function validatePermissions(
  userId: string,
  requiredPermissions: string[]
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) return false;

  const userPermissions = await getUserPermissions(userId, user.role);

  // Check if user has all required permissions
  return requiredPermissions.every(
    (required) =>
      userPermissions.includes(required) ||
      userPermissions.includes('admin:system') || // Admin override
      userPermissions.some(
        (userPerm) => userPerm.endsWith(':all') && required.startsWith(userPerm.split(':')[0])
      )
  );
}

/**
 * Rate limiting implementation
 */
function checkRateLimit(req: NextRequest, key: string): { allowed: boolean; retryAfter?: number } {
  const clientId = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  const rateLimitKey = `${key}:${clientId}`;
  const now = Date.now();

  const current = rateLimitStore.get(rateLimitKey);

  if (!current || now > current.resetTime) {
    // Reset or initialize counter
    rateLimitStore.set(rateLimitKey, {
      count: 1,
      resetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW,
    });
    return { allowed: true };
  }

  if (current.count >= SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfter: Math.ceil((current.resetTime - now) / 1000),
    };
  }

  current.count++;
  return { allowed: true };
}

/**
 * Input validation and sanitization
 */
async function validateAndSanitizeInput(req: NextRequest): Promise<SecurityValidationResult> {
  const result: SecurityValidationResult = {
    isValid: true,
    errors: [],
    securityFlags: {
      containsSuspiciousContent: false,
      exceedsLimits: false,
      potentialXSS: false,
      potentialSQLInjection: false,
    },
  };

  try {
    const body = await req.json();
    const sanitizedData = sanitizeObject(body, result);

    result.sanitizedData = sanitizedData;
    result.isValid = result.errors.length === 0;

    return result;
  } catch (error) {
    result.isValid = false;
    result.errors.push('Invalid JSON format');
    return result;
  }
}

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any, result: SecurityValidationResult): any {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeValue(obj, result);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, result));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Check for sensitive fields
    if (
      SECURITY_CONFIG.SENSITIVE_FIELDS.some((field) =>
        key.toLowerCase().includes(field.toLowerCase())
      )
    ) {
      sanitized[key] = value; // Don't log or modify sensitive fields
      continue;
    }

    sanitized[key] = sanitizeObject(value, result);
  }

  return sanitized;
}

/**
 * Sanitize individual values
 */
function sanitizeValue(value: any, result: SecurityValidationResult): any {
  if (typeof value !== 'string') {
    return value;
  }

  // Check string length
  if (value.length > SECURITY_CONFIG.MAX_STRING_LENGTH) {
    result.errors.push(`String exceeds maximum length of ${SECURITY_CONFIG.MAX_STRING_LENGTH}`);
    result.securityFlags.exceedsLimits = true;
    return value.substring(0, SECURITY_CONFIG.MAX_STRING_LENGTH);
  }

  // Check for blocked patterns
  for (const pattern of SECURITY_CONFIG.BLOCKED_PATTERNS) {
    if (pattern.test(value)) {
      result.securityFlags.containsSuspiciousContent = true;
      result.securityFlags.potentialXSS = true;
      result.errors.push('Potentially malicious content detected');
    }
  }

  // Check for SQL injection patterns
  const sqlPatterns = [
    /('|\\')|(;)|(--)|(\s*(union|select|insert|update|delete|drop|create|alter|exec|execute)\s)/gi,
    /(\bor\b|\band\b)\s*\w*\s*[=<>]/gi,
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(value)) {
      result.securityFlags.potentialSQLInjection = true;
      result.errors.push('Potential SQL injection detected');
    }
  }

  // Sanitize HTML content
  try {
    const sanitized = DOMPurify.sanitize(value);
    if (sanitized !== value) {
      result.securityFlags.potentialXSS = true;
    }
    return sanitized;
  } catch (error) {
    return value; // Return original if sanitization fails
  }
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.openai.com; frame-ancestors 'none';"
  );

  // Other security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // HSTS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
}

/**
 * Log security incidents
 */
async function logSecurityIncident(incident: { userId?: string; action: string; details: any }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: incident.userId,
        action: `SECURITY_${incident.action}`,
        details: {
          ...incident.details,
          timestamp: new Date().toISOString(),
          severity: 'HIGH',
        },
      },
    });
  } catch (error) {
    console.error('Failed to log security incident:', error);
  }
}

/**
 * Schema validation helpers
 */
export const secureSchemas = {
  // Common field validations
  id: z.string().cuid(),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(10000).trim(),
  url: z.string().url().max(2048),

  // Sanitized string that removes dangerous content
  sanitizedString: z.string().transform((val) => {
    const result: SecurityValidationResult = {
      isValid: true,
      errors: [],
      securityFlags: {
        containsSuspiciousContent: false,
        exceedsLimits: false,
        potentialXSS: false,
        potentialSQLInjection: false,
      },
    };
    return sanitizeValue(val, result);
  }),
};

/**
 * Permission constants
 */
export const PERMISSIONS = {
  // Read permissions
  READ_ALL: 'read:all',
  READ_OWN: 'read:own',
  READ_ISSUES: 'read:issues',
  READ_INITIATIVES: 'read:initiatives',
  READ_USERS: 'read:users',
  READ_AUDIT: 'read:audit',

  // Write permissions
  WRITE_ALL: 'write:all',
  WRITE_OWN: 'write:own',
  WRITE_ISSUES: 'write:issues',
  WRITE_INITIATIVES: 'write:initiatives',
  WRITE_USERS: 'write:users',

  // Admin permissions
  ADMIN_SYSTEM: 'admin:system',
  ADMIN_USERS: 'admin:users',
  ADMIN_AUDIT: 'admin:audit',

  // AI permissions
  AI_USE: 'ai:use',
  AI_CONFIGURE: 'ai:configure',
} as const;

/**
 * Helper function to create secured API handlers
 */
export function createSecuredHandler<T extends Record<string, any>>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  handler: (req: NextRequest, context: SecurityContext, params?: T) => Promise<NextResponse>,
  options: Parameters<typeof createSecurityMiddleware>[0] = {}
) {
  const securityMiddleware = createSecurityMiddleware({
    requireAuth: true,
    validateInput: method !== 'GET',
    rateLimitKey: `api_${method.toLowerCase()}`,
    ...options,
  });

  return async function (req: NextRequest, routeParams?: { params: T }) {
    return securityMiddleware(req, async (req, context) => {
      return handler(req, context, routeParams?.params);
    });
  };
}
