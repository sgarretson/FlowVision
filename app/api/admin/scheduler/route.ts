import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return scheduler status (placeholder for future implementation)
    return NextResponse.json({
      scheduler: {
        status: 'disabled',
        message: 'Background scheduler not yet implemented',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Scheduler status check failed:', error);
    return NextResponse.json({ error: 'Failed to get scheduler status' }, { status: 500 });
  }
}
