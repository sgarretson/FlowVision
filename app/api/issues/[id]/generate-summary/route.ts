import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AIMigration from '@/lib/ai-migration';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Fetch the issue
    const issue = await prisma.issue.findUnique({
      where: { id: params.id },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Check if AI service is configured
    if (!(await AIMigration.isConfigured())) {
      return NextResponse.json(
        {
          error: 'AI analysis not available - OpenAI not configured',
          fallback: 'AI summary generation requires OpenAI configuration in admin settings.',
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

    // Generate AI summary using optimized service with user context
    const aiAnalysis = await AIMigration.generateIssueSummary(
      issue.description,
      issue.department || undefined,
      issue.category || undefined,
      businessContext,
      user.id
    );

    if (!aiAnalysis) {
      return NextResponse.json(
        {
          error: 'Failed to generate AI summary',
          fallback: 'AI service temporarily unavailable. Please try again later.',
        },
        { status: 500 }
      );
    }

    // Store AI summary in database
    const updatedIssue = await prisma.issue.update({
      where: { id: params.id },
      data: {
        aiSummary: aiAnalysis.summary,
        aiConfidence: aiAnalysis.confidence,
        aiGeneratedAt: new Date(),
        aiVersion: 'gpt-3.5-turbo', // Could be made dynamic based on config
      },
    });

    // Log the AI generation activity
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'AI_SUMMARY_GENERATED',
        details: {
          issueId: params.id,
          confidence: aiAnalysis.confidence,
          model: 'gpt-3.5-turbo',
        },
      },
    });

    // Return complete analysis
    return NextResponse.json({
      issue: updatedIssue,
      analysis: {
        summary: aiAnalysis.summary,
        rootCauses: aiAnalysis.rootCauses,
        impact: aiAnalysis.impact,
        recommendations: aiAnalysis.recommendations,
        confidence: aiAnalysis.confidence,
        generatedAt: updatedIssue.aiGeneratedAt,
      },
    });
  } catch (error) {
    console.error('AI summary generation failed:', error);
    return NextResponse.json({ error: 'Failed to generate AI summary' }, { status: 500 });
  }
}
