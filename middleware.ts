/**
 * Enhanced Security Middleware for FlowVision
 * Provides comprehensive security controls for all requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Security configuration
const SECURITY_CONFIG = {
  // Rate limiting (in-memory store for simplicity - use Redis in production)
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
  AUTH_RATE_LIMIT_MAX: 5, // For auth endpoints

  // Request size limits
  MAX_REQUEST_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_JSON_SIZE: 1024 * 1024, // 1MB for JSON

  // Security headers
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      connect-src 'self' https://api.openai.com;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
    `
      .replace(/\s+/g, ' ')
      .trim(),
  },

  // Protected paths that require authentication
  PROTECTED_PATHS: [
    '/admin',
    '/api/admin',
    '/api/ai',
    '/api/issues',
    '/api/initiatives',
    '/api/users',
    '/api/profile',
    '/api/analytics',
    '/api/executive',
  ],

  // Public paths that don't require authentication
  PUBLIC_PATHS: ['/auth', '/api/auth', '/api/health', '/'],

  // Admin-only paths
  ADMIN_ONLY_PATHS: ['/admin', '/api/admin', '/api/users'],
};

// In-memory rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Blocked IPs (use database or external service in production)
const blockedIPs = new Set<string>();

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;

  try {
    // 1. Security headers for all responses
    const response = NextResponse.next();
    addSecurityHeaders(response);

    // 2. Block malicious IPs
    const clientIP = getClientIP(request);
    if (blockedIPs.has(clientIP)) {
      console.warn(`🚫 Blocked request from IP: ${clientIP}`);
      return new NextResponse('Access Denied', { status: 403 });
    }

    // 3. Request size validation
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > SECURITY_CONFIG.MAX_REQUEST_SIZE) {
      console.warn(`🚫 Request too large: ${contentLength} bytes from ${clientIP}`);
      return new NextResponse('Request Entity Too Large', { status: 413 });
    }

    // 4. Rate limiting
    const rateLimitResult = checkRateLimit(request, pathname);
    if (!rateLimitResult.allowed) {
      console.warn(`⚠️ Rate limit exceeded for ${clientIP} on ${pathname}`);
      const response = new NextResponse('Rate Limit Exceeded', {
        status: 429,
        headers: {
          'Retry-After': rateLimitResult.retryAfter?.toString() || '900',
          'X-RateLimit-Limit': SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || '',
        },
      });
      addSecurityHeaders(response);
      return response;
    }

    // 5. Input validation for suspicious patterns
    if (request.method !== 'GET') {
      const suspiciousResult = await checkSuspiciousContent(request);
      if (suspiciousResult.isSuspicious) {
        console.warn(`🚫 Suspicious content detected from ${clientIP}: ${suspiciousResult.reason}`);
        return new NextResponse('Bad Request', { status: 400 });
      }
    }

    // 6. Authentication check for protected routes
    if (isProtectedPath(pathname)) {
      const authResult = await checkAuthentication(request);

      if (!authResult.isAuthenticated) {
        console.warn(`🔒 Unauthenticated access attempt to ${pathname} from ${clientIP}`);

        // Redirect to auth page for UI routes, return 401 for API routes
        if (pathname.startsWith('/api/')) {
          return new NextResponse('Unauthorized', { status: 401 });
        } else {
          return NextResponse.redirect(new URL('/auth', request.url));
        }
      }

      // 7. Admin role check for admin-only routes
      if (isAdminOnlyPath(pathname) && authResult.user?.role !== 'ADMIN') {
        console.warn(
          `🚫 Non-admin access attempt to ${pathname} by ${authResult.user?.email} from ${clientIP}`
        );
        return new NextResponse('Forbidden', { status: 403 });
      }

      // Add user info to response headers for logging
      response.headers.set('X-User-ID', authResult.user?.id || '');
      response.headers.set('X-User-Role', authResult.user?.role || '');
    }

    // 8. Add performance timing
    const processingTime = Date.now() - startTime;
    response.headers.set('X-Response-Time', `${processingTime}ms`);

    // 9. Security event logging for API routes
    if (pathname.startsWith('/api/')) {
      logSecurityEvent(request, response, processingTime);
    }

    return response;
  } catch (error) {
    console.error('❌ Middleware error:', error);

    // Log security incident
    logSecurityIncident(request, error);

    const response = new NextResponse('Internal Server Error', { status: 500 });
    addSecurityHeaders(response);
    return response;
  }
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  return (
    request.ip ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): void {
  Object.entries(SECURITY_CONFIG.SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add HSTS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
}

/**
 * Rate limiting check
 */
function checkRateLimit(
  request: NextRequest,
  pathname: string
): {
  allowed: boolean;
  retryAfter?: number;
  resetTime?: number;
} {
  const clientIP = getClientIP(request);
  const isAuthEndpoint = pathname.startsWith('/api/auth/');
  const maxRequests = isAuthEndpoint
    ? SECURITY_CONFIG.AUTH_RATE_LIMIT_MAX
    : SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS;

  const key = `${clientIP}:${isAuthEndpoint ? 'auth' : 'general'}`;
  const now = Date.now();

  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    // Reset or initialize counter
    const resetTime = now + SECURITY_CONFIG.RATE_LIMIT_WINDOW;
    rateLimitStore.set(key, { count: 1, resetTime });
    return { allowed: true, resetTime };
  }

  if (current.count >= maxRequests) {
    return {
      allowed: false,
      retryAfter: Math.ceil((current.resetTime - now) / 1000),
      resetTime: current.resetTime,
    };
  }

  current.count++;
  return { allowed: true, resetTime: current.resetTime };
}

/**
 * Check for suspicious content patterns
 */
async function checkSuspiciousContent(request: NextRequest): Promise<{
  isSuspicious: boolean;
  reason?: string;
}> {
  try {
    // Check URL for suspicious patterns
    const url = request.url;
    const suspiciousUrlPatterns = [
      /\.\./, // Directory traversal
      /[<>]/, // HTML injection
      /javascript:/i, // JavaScript injection
      /vbscript:/i, // VBScript injection
      /on\w+\s*=/i, // Event handlers
      /eval\s*\(/i, // Eval injection
      /union\s+select/i, // SQL injection
      /(script|iframe|object|embed)/i, // HTML tags
    ];

    for (const pattern of suspiciousUrlPatterns) {
      if (pattern.test(url)) {
        return { isSuspicious: true, reason: 'Suspicious URL pattern' };
      }
    }

    // Check User-Agent for suspicious patterns
    const userAgent = request.headers.get('user-agent') || '';
    const suspiciousUAPatterns = [
      /bot/i,
      /crawler/i,
      /scanner/i,
      /exploit/i,
      /hack/i,
      /sqlmap/i,
      /nikto/i,
      /nessus/i,
    ];

    // Allow legitimate bots but flag suspicious ones
    if (suspiciousUAPatterns.some((pattern) => pattern.test(userAgent))) {
      const isLegitimateBot = /googlebot|bingbot|slurp|duckduckbot/i.test(userAgent);
      if (!isLegitimateBot) {
        return { isSuspicious: true, reason: 'Suspicious User-Agent' };
      }
    }

    // For POST/PUT requests, check body content
    if (
      request.method !== 'GET' &&
      request.headers.get('content-type')?.includes('application/json')
    ) {
      const contentLength = parseInt(request.headers.get('content-length') || '0');

      if (contentLength > SECURITY_CONFIG.MAX_JSON_SIZE) {
        return { isSuspicious: true, reason: 'JSON payload too large' };
      }
    }

    return { isSuspicious: false };
  } catch (error) {
    console.error('Error checking suspicious content:', error);
    return { isSuspicious: false };
  }
}

/**
 * Check authentication status
 */
async function checkAuthentication(request: NextRequest): Promise<{
  isAuthenticated: boolean;
  user?: { id: string; email: string; role: string };
}> {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return { isAuthenticated: false };
    }

    return {
      isAuthenticated: true,
      user: {
        id: token.id as string,
        email: token.email as string,
        role: token.role as string,
      },
    };
  } catch (error) {
    console.error('Authentication check error:', error);
    return { isAuthenticated: false };
  }
}

/**
 * Check if path requires authentication
 */
function isProtectedPath(pathname: string): boolean {
  // Public paths don't require auth
  if (SECURITY_CONFIG.PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return false;
  }

  // Protected paths require auth
  return SECURITY_CONFIG.PROTECTED_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * Check if path requires admin role
 */
function isAdminOnlyPath(pathname: string): boolean {
  return SECURITY_CONFIG.ADMIN_ONLY_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * Log security events
 */
function logSecurityEvent(
  request: NextRequest,
  response: NextResponse,
  processingTime: number
): void {
  const event = {
    timestamp: new Date().toISOString(),
    method: request.method,
    path: request.nextUrl.pathname,
    ip: getClientIP(request),
    userAgent: request.headers.get('user-agent'),
    status: response.status,
    processingTime,
    userId: response.headers.get('X-User-ID') || null,
    userRole: response.headers.get('X-User-Role') || null,
  };

  // Only log significant events in production to reduce noise
  if (process.env.NODE_ENV === 'production') {
    if (response.status >= 400 || request.nextUrl.pathname.startsWith('/api/admin')) {
      console.log('🔍 Security Event:', JSON.stringify(event));
    }
  } else {
    // Log all API requests in development
    if (request.nextUrl.pathname.startsWith('/api/')) {
      console.log('🔍 API Request:', JSON.stringify(event));
    }
  }
}

/**
 * Log security incidents
 */
function logSecurityIncident(request: NextRequest, error: any): void {
  const incident = {
    timestamp: new Date().toISOString(),
    type: 'MIDDLEWARE_ERROR',
    method: request.method,
    path: request.nextUrl.pathname,
    ip: getClientIP(request),
    userAgent: request.headers.get('user-agent'),
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  };

  console.error('🚨 Security Incident:', JSON.stringify(incident));

  // In production, you might want to send this to an external monitoring service
  // like Sentry, DataDog, etc.
}

/**
 * Configure middleware to run on specific paths
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
