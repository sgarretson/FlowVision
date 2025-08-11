import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const userProfileSchema = z.object({
  name: z.string().min(1).optional(),
  preferences: z
    .object({
      notifications: z.object({
        email: z.boolean(),
        browser: z.boolean(),
        digest: z.enum(['daily', 'weekly', 'none']),
      }),
      theme: z.enum(['light', 'dark', 'system']),
      timezone: z.string(),
    })
    .optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        preferences: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Default preferences if none exist
    const defaultPreferences = {
      notifications: {
        email: true,
        browser: true,
        digest: 'weekly',
      },
      theme: 'light',
      timezone: 'America/New_York',
    };

    return NextResponse.json({
      ...user,
      preferences: user.preferences || defaultPreferences,
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, preferences } = userProfileSchema.parse(body);

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (preferences !== undefined) updateData.preferences = preferences;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        preferences: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_PROFILE_UPDATE',
        details: {
          changes: updateData,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Update user profile error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
  }
}
