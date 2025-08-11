import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { scoreDifficulty, scoreROI, scorePriority } from '@/utils/ai';
import { openai } from '@/lib/openai';

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

    // Generate comprehensive initiative using AI
    const aiGeneratedInitiative = await generateInitiativeFromIssues(issues, {
      industry: profile?.industry || 'Unknown',
      size: profile?.size || 0,
      metrics: (profile?.metrics as any) || {},
    });

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
  const maxHeatmapScore = Math.max(...issues.map((i) => i.heatmapScore));

  const prompt = `You are an expert business strategist helping a ${businessContext.industry} company with ${businessContext.size} employees create a comprehensive initiative from multiple related issues.

CONTEXT:
Company Industry: ${businessContext.industry}
Company Size: ${businessContext.size} employees
Number of Issues: ${issues.length}
Total Community Votes: ${totalVotes}
Average Issue Severity: ${avgHeatmapScore.toFixed(1)}/100
Highest Issue Severity: ${maxHeatmapScore}/100

ISSUES TO ADDRESS:
• ${issueDescriptions}

REQUIREMENTS:
Create a strategic initiative that addresses all these issues comprehensively. Consider:
- Root cause analysis across all issues
- Synergies between issue resolutions
- Resource optimization by solving multiple problems together
- Business impact and ROI potential
- Implementation complexity and timeline

RESPONSE FORMAT (JSON):
{
  "title": "Strategic initiative title (60 chars max)",
  "problem": "Comprehensive problem statement connecting all issues",
  "goal": "Specific, measurable goal addressing the root causes",
  "kpis": ["KPI 1", "KPI 2", "KPI 3"],
  "type": "operational|strategic|innovation",
  "estimatedCost": 50000,
  "estimatedBenefit": 200000,
  "estimatedHours": 320,
  "complexity": "low|medium|high",
  "reasoning": "Brief explanation of how this initiative addresses all issues"
}

Focus on creating a cohesive initiative that maximizes impact while addressing the underlying systemic issues, not just symptoms.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and provide defaults
    return {
      title: parsed.title || `Strategic Initiative for ${issues.length} Issues`,
      problem:
        parsed.problem ||
        `Multiple operational issues affecting business performance: ${issueDescriptions}`,
      goal:
        parsed.goal ||
        `Systematically address and resolve ${issues.length} related operational issues`,
      kpis: Array.isArray(parsed.kpis)
        ? parsed.kpis
        : ['Issue Resolution Rate', 'Process Efficiency', 'Customer Satisfaction'],
      type: parsed.type || 'operational',
      estimatedCost:
        typeof parsed.estimatedCost === 'number' ? parsed.estimatedCost : 25000 * issues.length,
      estimatedBenefit:
        typeof parsed.estimatedBenefit === 'number'
          ? parsed.estimatedBenefit
          : 75000 * issues.length,
      estimatedHours:
        typeof parsed.estimatedHours === 'number' ? parsed.estimatedHours : 40 * issues.length,
      reasoning: parsed.reasoning || 'Addresses multiple related issues for maximum impact',
    };
  } catch (error) {
    console.warn('AI generation failed, using fallback logic:', error);

    // Fallback logic if AI fails
    const isHighPriority = avgHeatmapScore >= 70;
    const isComplex = issues.length >= 3;

    return {
      title:
        issues.length === 1
          ? `Initiative: ${issues[0].description.substring(0, 40)}...`
          : `${issues.length}-Issue Improvement Initiative`,
      problem: `Multiple operational challenges identified through team input:\n\n${issues.map((issue, i) => `${i + 1}. ${issue.description} (Priority: ${issue.heatmapScore}/100, Votes: ${issue.votes})`).join('\n')}`,
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
}
