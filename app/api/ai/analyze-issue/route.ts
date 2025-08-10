import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { openAIService } from '@/lib/openai';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { description } = body;

    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: 'Issue description is required' }, { status: 400 });
    }

    // Check if OpenAI is configured
    if (!openAIService.isConfigured()) {
      return NextResponse.json({ 
        error: 'AI analysis not available - OpenAI not configured',
        fallback: 'Use the admin panel to configure OpenAI integration for AI-powered insights.'
      }, { status: 503 });
    }

    // Get user's business profile for context
    const businessProfile = await prisma.businessProfile.findUnique({
      where: { userId: user.id }
    });

    const businessContext = businessProfile ? {
      industry: businessProfile.industry,
      size: businessProfile.size,
      metrics: businessProfile.metrics
    } : undefined;

    // Generate AI insights
    const insights = await openAIService.generateIssueInsights(description, businessContext);

    if (!insights) {
      return NextResponse.json({ 
        error: 'Failed to generate AI insights',
        fallback: 'AI analysis temporarily unavailable. Please try again later.'
      }, { status: 500 });
    }

    // Log the AI usage
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'AI_ISSUE_ANALYSIS',
        details: {
          description: description.substring(0, 100) + '...',
          hasInsights: !!insights
        }
      }
    });

    return NextResponse.json({
      insights,
      source: 'openai'
    });

  } catch (error) {
    console.error('AI issue analysis error:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze issue',
      fallback: 'AI analysis temporarily unavailable. Please try again later.'
    }, { status: 500 });
  }
}