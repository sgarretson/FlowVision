import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { scoreDifficulty, scoreROI, scorePriority } from '@/utils/ai';
import openAIService from '@/lib/openai';

type IssueInput = {
  id: string;
  description: string;
  heatmapScore: number;
  votes: number;
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { issues }: { issues: IssueInput[] } = body;

    if (!issues || issues.length === 0) {
      return NextResponse.json({ error: 'At least one issue is required' }, { status: 400 });
    }

    // Get user's business profile for context
    const profile = await prisma.businessProfile.findUnique({
      where: { userId: user.id },
    });

    // Generate comprehensive initiative using centralized OpenAI service
    const aiGeneratedInitiative =
      (await openAIService.generateInitiativeFromIssues(issues, {
        industry: profile?.industry || 'Unknown',
        size: profile?.size || 0,
        metrics: (profile?.metrics as any) || {},
      })) ||
      // Fallback to local generator if AI is disabled/unavailable
      (await generateInitiativeFromIssues(issues, {
        industry: profile?.industry || 'Unknown',
        size: profile?.size || 0,
        metrics: (profile?.metrics as any) || {},
      }));

    // Calculate scores
    const difficulty = scoreDifficulty(
      `${aiGeneratedInitiative.title} ${aiGeneratedInitiative.problem}`,
      {
        industry: profile?.industry || 'Unknown',
        size: profile?.size || 0,
        metrics: (profile?.metrics as any) || {},
      }
    );
    const roi = scoreROI(
      aiGeneratedInitiative.estimatedCost,
      aiGeneratedInitiative.estimatedBenefit
    );
    const priorityScore = scorePriority(difficulty, roi);

    // Get next order index
    const count = await prisma.initiative.count({ where: { ownerId: user.id } });

    // Create the initiative
    const initiative = await prisma.initiative.create({
      data: {
        title: aiGeneratedInitiative.title,
        problem: aiGeneratedInitiative.problem,
        goal: aiGeneratedInitiative.goal,
        kpis: aiGeneratedInitiative.kpis,
        ownerId: user.id,
        status: 'Define',
        progress: 0,
        difficulty,
        roi,
        priorityScore,
        orderIndex: count,
        budget: aiGeneratedInitiative.estimatedCost,
        estimatedHours: aiGeneratedInitiative.estimatedHours,
        type: aiGeneratedInitiative.type || 'operational',
        phase: 'planning',
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_INITIATIVE_FROM_ISSUES',
        details: {
          initiativeId: initiative.id,
          initiativeTitle: initiative.title,
          sourceIssues: issues.map((i) => ({
            id: i.id,
            description: i.description,
            heatmapScore: i.heatmapScore,
            votes: i.votes,
          })),
          issueCount: issues.length,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(initiative);
  } catch (error) {
    console.error('Error creating initiative from issues:', error);
    return NextResponse.json({ error: 'Failed to create initiative from issues' }, { status: 500 });
  }
}

async function generateInitiativeFromIssues(
  issues: IssueInput[],
  businessContext: { industry: string; size: number; metrics: any }
) {
  const issueDescriptions = issues.map((i) => i.description).join('\n• ');
  const totalVotes = issues.reduce((sum, i) => sum + i.votes, 0);
  const avgHeatmapScore = issues.reduce((sum, i) => sum + i.heatmapScore, 0) / issues.length;

  // Deterministic fallback logic (no external AI call)
  const isHighPriority = avgHeatmapScore >= 70;
  const isComplex = issues.length >= 3;

  return {
    title:
      issues.length === 1
        ? `Initiative: ${issues[0].description.substring(0, 40)}...`
        : `${issues.length}-Issue Improvement Initiative`,
    problem: `Multiple operational challenges identified through team input (Industry: ${businessContext.industry}, Size: ${businessContext.size}):\n\n${issues
      .map(
        (issue, i) =>
          `${i + 1}. ${issue.description} (Priority: ${issue.heatmapScore}/100, Votes: ${issue.votes})`
      )
      .join('\n')}`,
    goal: `Systematically address and resolve these ${issues.length} interconnected issues to improve operational efficiency and team satisfaction`,
    kpis: [
      'Issue Resolution Rate',
      'Process Efficiency Improvement',
      'Team Satisfaction Score',
      ...(isHighPriority ? ['Risk Mitigation Score'] : []),
      ...(totalVotes > 10 ? ['Stakeholder Engagement'] : []),
    ],
    type: isHighPriority ? 'strategic' : 'operational',
    estimatedCost: Math.min(
      150000,
      Math.max(15000, 20000 * issues.length + (isComplex ? 10000 : 0))
    ),
    estimatedBenefit: Math.min(
      500000,
      Math.max(50000, 60000 * issues.length + avgHeatmapScore * 1000)
    ),
    estimatedHours: Math.min(800, Math.max(80, 60 * issues.length + (isComplex ? 40 : 0))),
    reasoning: `Combines ${issues.length} related issues for maximum impact and resource efficiency`,
  };
}
