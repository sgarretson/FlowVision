/**
 * Role-Based Access Control (RBAC) System
 * Comprehensive permission management for FlowVision
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type Permission =
  // Data access permissions
  | 'issues:read'
  | 'issues:write'
  | 'issues:delete'
  | 'initiatives:read'
  | 'initiatives:write'
  | 'initiatives:delete'
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'audit:read'
  | 'audit:write'
  | 'analytics:read'

  // System administration
  | 'system:configure'
  | 'system:backup'
  | 'system:monitor'
  | 'ai:configure'
  | 'ai:use'
  | 'ai:monitor'

  // Business operations
  | 'reports:generate'
  | 'reports:export'
  | 'notifications:send'
  | 'integrations:manage'

  // Security operations
  | 'security:audit'
  | 'security:configure'
  | 'roles:manage'
  | 'permissions:manage';

export type Role = 'ADMIN' | 'LEADER' | 'VIEWER' | 'ANALYST';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  permissions: Permission[];
  organizationId?: string;
  departmentId?: string;
  isActive: boolean;
}

export interface ResourceOwnership {
  [key: string]: string | undefined;
  userId?: string;
  organizationId?: string;
  departmentId?: string;
}

export interface AccessContext {
  user: AuthenticatedUser;
  resource?: {
    type: string;
    id: string;
    ownership?: ResourceOwnership;
  };
  action: string;
  clientInfo: {
    ip: string;
    userAgent: string;
    timestamp: Date;
  };
}

/**
 * Role-permission mapping
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    // Full system access
    'issues:read',
    'issues:write',
    'issues:delete',
    'initiatives:read',
    'initiatives:write',
    'initiatives:delete',
    'users:read',
    'users:write',
    'users:delete',
    'audit:read',
    'audit:write',
    'analytics:read',
    'system:configure',
    'system:backup',
    'system:monitor',
    'ai:configure',
    'ai:use',
    'ai:monitor',
    'reports:generate',
    'reports:export',
    'notifications:send',
    'integrations:manage',
    'security:audit',
    'security:configure',
    'roles:manage',
    'permissions:manage',
  ],
  LEADER: [
    // Business user permissions
    'issues:read',
    'issues:write',
    'initiatives:read',
    'initiatives:write',
    'users:read',
    'analytics:read',
    'ai:use',
    'reports:generate',
    'reports:export',
  ],
  ANALYST: [
    // Data analysis permissions
    'issues:read',
    'initiatives:read',
    'analytics:read',
    'ai:use',
    'reports:generate',
    'reports:export',
  ],
  VIEWER: [
    // Read-only access
    'issues:read',
    'initiatives:read',
    'analytics:read',
  ],
};

/**
 * Get current user with permissions
 */
export async function getCurrentUser(req?: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        role: true,
        // Add organization/department when implemented
        // organizationId: true,
        // departmentId: true,
        createdAt: true,
      },
    });

    if (!user) {
      return null;
    }

    // Map existing roles to access control roles
    const userRole: Role = user.role === 'ADMIN' ? 'ADMIN' : 'LEADER';

    return {
      id: user.id,
      email: user.email,
      role: userRole,
      permissions: ROLE_PERMISSIONS[userRole],
      isActive: true,
      // TODO: Add when multi-tenancy is implemented
      // organizationId: user.organizationId,
      // departmentId: user.departmentId,
    };
  } catch (error) {
    console.error('Failed to get authenticated user:', error);
    return null;
  }
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(permission: Permission, req?: NextRequest): Promise<boolean> {
  const user = await getCurrentUser(req);
  if (!user || !user.isActive) {
    return false;
  }

  return user.permissions.includes(permission);
}

/**
 * Check multiple permissions (user must have ALL)
 */
export async function hasAllPermissions(
  permissions: Permission[],
  req?: NextRequest
): Promise<boolean> {
  const user = await getCurrentUser(req);
  if (!user || !user.isActive) {
    return false;
  }

  return permissions.every((permission) => user.permissions.includes(permission));
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(
  permissions: Permission[],
  req?: NextRequest
): Promise<boolean> {
  const user = await getCurrentUser(req);
  if (!user || !user.isActive) {
    return false;
  }

  return permissions.some((permission) => user.permissions.includes(permission));
}

/**
 * Resource-based access control
 */
export async function canAccessResource(
  resourceType: string,
  resourceId: string,
  action: 'read' | 'write' | 'delete',
  req?: NextRequest
): Promise<boolean> {
  const user = await getCurrentUser(req);
  if (!user || !user.isActive) {
    return false;
  }

  // Admin has access to everything
  if (user.role === 'ADMIN') {
    return true;
  }

  // Check permission for resource type and action
  const permission = `${resourceType}:${action}` as Permission;
  if (!user.permissions.includes(permission)) {
    return false;
  }

  // For write/delete operations, check ownership
  if (action === 'write' || action === 'delete') {
    return await isResourceOwner(user, resourceType, resourceId);
  }

  return true;
}

/**
 * Check if user owns or has access to a resource
 */
async function isResourceOwner(
  user: AuthenticatedUser,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  try {
    switch (resourceType) {
      case 'issues':
        // For now, allow all LEADER users to modify issues
        // TODO: Implement proper ownership when user-issue relationships are added
        return user.role === 'LEADER' || user.role === 'ADMIN';

      case 'initiatives':
        const initiative = await prisma.initiative.findUnique({
          where: { id: resourceId },
          select: {
            ownerId: true,
            // TODO: Add organizationId/departmentId when implemented
          },
        });

        if (!initiative) return false;

        // Owner can always access
        if (initiative.ownerId === user.id) return true;

        // TODO: Check organization/department access

        return false;

      case 'users':
        // Users can only modify their own profile
        // Admins can modify any user
        return resourceId === user.id || user.role === 'ADMIN';

      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking resource ownership:', error);
    return false;
  }
}

/**
 * Audit access attempts
 */
export async function auditAccess(context: AccessContext, granted: boolean): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: context.user.id,
        action: `ACCESS_${granted ? 'GRANTED' : 'DENIED'}`,
        details: {
          resource: context.resource
            ? {
                type: context.resource.type,
                id: context.resource.id,
                ownership: context.resource.ownership,
              }
            : undefined,
          action: context.action,
          clientInfo: {
            ip: context.clientInfo.ip,
            userAgent: context.clientInfo.userAgent,
            timestamp: context.clientInfo.timestamp.toISOString(),
          },
          userRole: context.user.role,
          timestamp: context.clientInfo.timestamp.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Failed to audit access:', error);
  }
}

/**
 * Data visibility filters based on user role and permissions
 */
export function getDataVisibilityFilter(user: AuthenticatedUser) {
  // Admin sees everything
  if (user.role === 'ADMIN') {
    return {};
  }

  // For multi-tenancy (future implementation)
  const filter: any = {};

  // TODO: Add organization/department filtering
  // if (user.organizationId) {
  //   filter.organizationId = user.organizationId;
  // }

  // For now, apply minimal filtering based on role
  if (user.role === 'VIEWER') {
    // Viewers might see only public or approved items
    filter.isPublic = true;
  }

  return filter;
}

/**
 * Permission validation decorator/middleware
 */
export function requirePermissions(permissions: Permission[]) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req = args.find((arg) => arg instanceof Request) as NextRequest;

      const hasPermission = await hasAllPermissions(permissions, req);
      if (!hasPermission) {
        throw new Error('Insufficient permissions');
      }

      return method.apply(this, args);
    };
  };
}

/**
 * Role validation
 */
export async function requireRole(requiredRole: Role, req?: NextRequest): Promise<boolean> {
  const user = await getCurrentUser(req);
  if (!user || !user.isActive) {
    return false;
  }

  // Admin can access anything requiring LEADER, ANALYST, or VIEWER
  if (user.role === 'ADMIN') {
    return true;
  }

  // LEADER can access ANALYST and VIEWER level content
  if (user.role === 'LEADER' && (requiredRole === 'ANALYST' || requiredRole === 'VIEWER')) {
    return true;
  }

  // ANALYST can access VIEWER level content
  if (user.role === 'ANALYST' && requiredRole === 'VIEWER') {
    return true;
  }

  return user.role === requiredRole;
}

/**
 * Create access context for auditing
 */
export function createAccessContext(
  user: AuthenticatedUser,
  action: string,
  req: NextRequest,
  resource?: { type: string; id: string; ownership?: ResourceOwnership }
): AccessContext {
  return {
    user,
    resource,
    action,
    clientInfo: {
      ip: req.ip || req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      timestamp: new Date(),
    },
  };
}

/**
 * Rate limiting per user role
 */
export function getRoleLimits(role: Role): {
  requestsPerMinute: number;
  requestsPerHour: number;
  maxRequestSize: number;
} {
  const limits = {
    ADMIN: {
      requestsPerMinute: 120,
      requestsPerHour: 2000,
      maxRequestSize: 20 * 1024 * 1024, // 20MB
    },
    LEADER: {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      maxRequestSize: 10 * 1024 * 1024, // 10MB
    },
    ANALYST: {
      requestsPerMinute: 40,
      requestsPerHour: 500,
      maxRequestSize: 5 * 1024 * 1024, // 5MB
    },
    VIEWER: {
      requestsPerMinute: 20,
      requestsPerHour: 200,
      maxRequestSize: 2 * 1024 * 1024, // 2MB
    },
  };

  return limits[role];
}

/**
 * Security validation for sensitive operations
 */
export async function validateSensitiveOperation(
  operation: string,
  user: AuthenticatedUser,
  req: NextRequest
): Promise<{ allowed: boolean; reason?: string }> {
  // Check if user has required permissions for sensitive operations
  const sensitiveOperations = {
    'user:delete': ['users:delete'],
    'system:configure': ['system:configure'],
    'ai:configure': ['ai:configure'],
    'data:export': ['reports:export'],
    'audit:access': ['audit:read'],
  };

  const requiredPerms = sensitiveOperations[operation as keyof typeof sensitiveOperations];
  if (requiredPerms) {
    const hasPermission = requiredPerms.every((perm) =>
      user.permissions.includes(perm as Permission)
    );

    if (!hasPermission) {
      return { allowed: false, reason: 'Insufficient permissions for sensitive operation' };
    }
  }

  // Additional security checks can be added here
  // - Time-based restrictions
  // - IP whitelist validation
  // - Multi-factor authentication for critical operations

  return { allowed: true };
}
