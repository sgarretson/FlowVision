import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, Permission } from '@/lib/rbac';

export interface SecurityRule {
  allowedRoles?: ('ADMIN' | 'LEADER')[];
  requiresPermission?: Permission;
  allowOwnerAccess?: boolean; // For resource-specific access
  publicAccess?: boolean; // For completely public endpoints
}

export class SecurityError extends Error {
  constructor(
    message: string,
    public statusCode: number = 403,
    public code: string = 'FORBIDDEN'
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

/**
 * Enhanced security middleware for API routes
 */
export async function withSecurity(
  req: NextRequest,
  rules: SecurityRule,
  resourceOwnerId?: string
): Promise<{ user: any; session: any }> {
  // Handle public access
  if (rules.publicAccess) {
    const session = await getServerSession(authOptions);
    return { user: null, session };
  }

  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new SecurityError('Authentication required', 401, 'UNAUTHORIZED');
  }

  // Get current user with full details
  const user = await getCurrentUser();
  if (!user) {
    throw new SecurityError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Check role-based access
  if (rules.allowedRoles && !rules.allowedRoles.includes(user.role)) {
    // Check if user is owner of the resource
    if (rules.allowOwnerAccess && resourceOwnerId && user.id === resourceOwnerId) {
      // Allow access for resource owner
    } else {
      throw new SecurityError(
        `Access denied. Required role: ${rules.allowedRoles.join(' or ')}`,
        403,
        'INSUFFICIENT_ROLE'
      );
    }
  }

  // Check permission-based access
  if (rules.requiresPermission) {
    const { hasPermission } = await import('@/lib/rbac');
    const permitted = await hasPermission(rules.requiresPermission);
    if (!permitted) {
      throw new SecurityError(
        `Permission denied. Required permission: ${rules.requiresPermission}`,
        403,
        'INSUFFICIENT_PERMISSION'
      );
    }
  }

  return { user, session };
}

/**
 * Wrapper for API routes with security
 */
export function secureApiRoute(
  handler: (
    req: NextRequest,
    context: { params?: any; user: any; session: any }
  ) => Promise<NextResponse>,
  rules: SecurityRule
) {
  return async (req: NextRequest, context: { params?: any }) => {
    try {
      // Extract resource owner ID if this is a resource-specific route
      let resourceOwnerId: string | undefined;

      // For user routes, check if user is accessing their own data
      if (context.params?.id && req.url.includes('/api/users/')) {
        const targetUser = await prisma.user.findUnique({
          where: { id: context.params.id },
          select: { id: true },
        });
        resourceOwnerId = targetUser?.id;
      }

      // For initiative routes, check initiative ownership
      if (context.params?.id && req.url.includes('/api/initiatives/')) {
        const initiative = await prisma.initiative.findUnique({
          where: { id: context.params.id },
          select: { ownerId: true },
        });
        resourceOwnerId = initiative?.ownerId;
      }

      const { user, session } = await withSecurity(req, rules, resourceOwnerId);

      return await handler(req, { ...context, user, session });
    } catch (error) {
      if (error instanceof SecurityError) {
        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
            timestamp: new Date().toISOString(),
          },
          { status: error.statusCode }
        );
      }

      console.error('Security middleware error:', error);
      return NextResponse.json({ error: 'Internal security error' }, { status: 500 });
    }
  };
}

/**
 * Data filtering based on user role and permissions
 */
export async function filterDataByRole(
  data: any[],
  user: any,
  ownerField: string = 'ownerId'
): Promise<any[]> {
  // Admins see everything
  if (user.role === 'ADMIN') {
    return data;
  }

  // Regular users only see their own data
  return data.filter((item) => item[ownerField] === user.id);
}

/**
 * Audit log for security events
 */
export async function logSecurityEvent(
  event: string,
  userId: string,
  details: Record<string, any> = {},
  severity: 'info' | 'warning' | 'error' = 'info'
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action: `SECURITY_${event.toUpperCase()}`,
        details: {
          event,
          severity,
          timestamp: new Date().toISOString(),
          userAgent: details.userAgent,
          ip: details.ip,
          ...details,
        },
      },
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}
