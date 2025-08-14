import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { openAIService } from '@/lib/openai';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get OpenAI usage statistics
    const usageStats = await openAIService.getUsageEstimate();

    return NextResponse.json({
      usage: usageStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('OpenAI usage check failed:', error);
    return NextResponse.json({ error: 'Failed to get OpenAI usage stats' }, { status: 500 });
  }
}
