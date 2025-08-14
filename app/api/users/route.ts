import { NextRequest, NextResponse } from 'next/server';
import { secureApiRoute, logSecurityEvent } from '@/lib/rbac-middleware';
import { prisma } from '@/lib/prisma';

// Force dynamic server-side rendering for this API route
export const dynamic = 'force-dynamic';

export const GET = secureApiRoute(
  async (req: NextRequest, { user }) => {
    try {
      // Log security event
      await logSecurityEvent('USER_LIST_ACCESS', user.id, {
        userAgent: req.headers.get('user-agent'),
        ip: req.headers.get('x-forwarded-for') || 'unknown',
      });

      // Admin users can see all users, regular users can only see basic info
      if (user.role === 'ADMIN') {
        const users = await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            _count: {
              select: {
                initiatives: true,
                comments: true,
                ideas: true,
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        });

        return NextResponse.json(users);
      } else {
        // Regular users only see basic user list for assignments
        const users = await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
          },
          orderBy: {
            name: 'asc',
          },
        });

        return NextResponse.json(users);
      }
    } catch (error) {
      console.error('Users fetch error:', error);
      await logSecurityEvent(
        'USER_LIST_ERROR',
        user.id,
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        'error'
      );
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
  },
  {
    // Require authentication, no specific role requirement
    allowedRoles: ['ADMIN', 'LEADER'],
  }
);
