import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AIMigration from '@/lib/ai-migration';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
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
    const { title, problem, mode } = body;

    if (mode === 'recommendations' && (!title || !problem)) {
      return NextResponse.json(
        { error: 'Title and problem are required for recommendations' },
        { status: 400 }
      );
    }

    if (mode === 'requirements' && !problem) {
      return NextResponse.json(
        { error: 'Description is required for requirements generation' },
        { status: 400 }
      );
    }

    // Check if AI service is configured
    if (!(await AIMigration.isConfigured())) {
      return NextResponse.json(
        {
          error: 'AI generation not available - OpenAI not configured',
          fallback: 'Use the admin panel to configure OpenAI integration for AI-powered features.',
        },
        { status: 503 }
      );
    }

    // Get user's business profile for context
    const businessProfile = await prisma.businessProfile.findUnique({
      where: { userId: user.id },
    });

    const businessContext = businessProfile
      ? {
          industry: businessProfile.industry,
          size: businessProfile.size,
          metrics: businessProfile.metrics,
        }
      : undefined;

    let result = null;

    if (mode === 'recommendations') {
      // Generate initiative recommendations using optimized service
      result = await AIMigration.generateInitiativeRecommendations(
        title,
        problem,
        businessContext,
        user.id
      );
    } else if (mode === 'requirements') {
      // Generate structured requirements from description using optimized service
      result = await AIMigration.generateRequirementsFromDescription(problem, user.id);
    }

    if (!result) {
      return NextResponse.json(
        {
          error: 'Failed to generate AI content',
          fallback: 'AI generation temporarily unavailable. Please try again later.',
        },
        { status: 500 }
      );
    }

    // Log the AI usage
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: `AI_INITIATIVE_${mode.toUpperCase()}`,
        details: {
          title: title?.substring(0, 100),
          problem: problem?.substring(0, 100) + '...',
          mode,
          hasResult: !!result,
        },
      },
    });

    return NextResponse.json({
      result,
      mode,
      source: 'openai',
    });
  } catch (error) {
    console.error('AI initiative generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate initiative content',
        fallback: 'AI generation temporarily unavailable. Please try again later.',
      },
      { status: 500 }
    );
  }
}
