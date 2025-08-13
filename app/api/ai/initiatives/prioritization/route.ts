import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/rbac';
import { aiPrioritizationEngine, PrioritizationContext } from '@/lib/ai-prioritization-engine';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const prioritizationRequestSchema = z.object({
  initiativeIds: z.array(z.string()).optional(),
  applyRecommendations: z.boolean().default(false),
  context: z
    .object({
      organizationGoals: z.array(z.string()).default([]),
      currentQuarter: z.string().default('Q1 2025'),
      availableResources: z.object({
        budget: z.number().default(100000),
        teamCapacity: z.number().min(0).max(100).default(80),
        timeline: z.number().default(90),
      }),
      strategicThemes: z.array(z.string()).default([]),
      riskTolerance: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and leaders can reprioritize initiatives
    if (user.role !== 'ADMIN' && user.role !== 'LEADER') {
      return NextResponse.json(
        { error: 'Insufficient permissions for initiative prioritization' },
        { status: 403 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validatedData = prioritizationRequestSchema.parse(body);

    // Build prioritization context with defaults
    const context: PrioritizationContext = {
      organizationGoals: [
        'Improve operational efficiency',
        'Enhance client satisfaction',
        'Reduce project risks',
      ],
      currentQuarter: 'Q1 2025',
      availableResources: {
        budget: 100000,
        teamCapacity: 80,
        timeline: 90,
      },
      strategicThemes: ['Digital transformation', 'Process optimization', 'Quality improvement'],
      riskTolerance: 'MEDIUM',
      ...validatedData.context,
    };

    // Get AI prioritization recommendations
    const priorityScores = await aiPrioritizationEngine.reprioritizeInitiatives(
      context,
      validatedData.initiativeIds
    );

    // Apply recommendations if requested
    let updateResults = null;
    if (validatedData.applyRecommendations && priorityScores.length > 0) {
      updateResults = await aiPrioritizationEngine.applyRecommendedPriorities(
        priorityScores,
        user.id
      );
    }

    // Calculate prioritization insights
    const insights = {
      totalAnalyzed: priorityScores.length,
      significantChanges: priorityScores.filter(
        (score) => Math.abs(score.aiRecommendedPriority - score.currentPriority) >= 20
      ).length,
      averageConfidence:
        priorityScores.length > 0
          ? Math.round(
              priorityScores.reduce((sum, score) => sum + score.confidenceScore, 0) /
                priorityScores.length
            )
          : 0,
      topFactors: getTopFactors(priorityScores),
      priorityDistribution: {
        high: priorityScores.filter((s) => s.aiRecommendedPriority >= 80).length,
        medium: priorityScores.filter(
          (s) => s.aiRecommendedPriority >= 50 && s.aiRecommendedPriority < 80
        ).length,
        low: priorityScores.filter((s) => s.aiRecommendedPriority < 50).length,
      },
    };

    // Log prioritization analysis
    await prisma.auditLog.create({
      data: {
        action: 'AI_INITIATIVE_PRIORITIZATION',
        userId: user.id,
        details: {
          initiativeCount: priorityScores.length,
          significantChanges: insights.significantChanges,
          averageConfidence: insights.averageConfidence,
          appliedRecommendations: validatedData.applyRecommendations,
          updatedCount: updateResults?.updated || 0,
          errorCount: updateResults?.errors?.length || 0,
        },
      },
    });

    return NextResponse.json({
      success: true,
      prioritization: {
        recommendations: priorityScores,
        insights,
        context,
        ...(updateResults && {
          updateResults: {
            updatedInitiatives: updateResults.updated,
            errors: updateResults.errors,
          },
        }),
        generatedAt: new Date(),
        generatedBy: {
          id: user.id,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('❌ Error generating initiative prioritization:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate prioritization analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper function to analyze top factors across initiatives
function getTopFactors(priorityScores: any[]) {
  const factorCounts: { [factor: string]: { count: number; avgWeight: number; avgScore: number } } =
    {};

  priorityScores.forEach((score) => {
    score.reasoningFactors?.forEach((factor: any) => {
      if (!factorCounts[factor.factor]) {
        factorCounts[factor.factor] = { count: 0, avgWeight: 0, avgScore: 0 };
      }
      factorCounts[factor.factor].count++;
      factorCounts[factor.factor].avgWeight += factor.weight;
      factorCounts[factor.factor].avgScore += factor.score;
    });
  });

  return Object.entries(factorCounts)
    .map(([factor, data]) => ({
      factor,
      frequency: data.count,
      avgWeight: Math.round(data.avgWeight / data.count),
      avgScore: Math.round(data.avgScore / data.count),
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and leaders can access prioritization data
    if (user.role !== 'ADMIN' && user.role !== 'LEADER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get basic prioritization status for dashboard
    const initiatives = await prisma.initiative.findMany({
      select: {
        id: true,
        title: true,
        priorityScore: true,
        status: true,
        roi: true,
        difficulty: true,
        addressedIssues: {
          select: {
            heatmapScore: true,
          },
        },
      },
      where: {
        status: {
          in: ['ACTIVE', 'APPROVED', 'PLANNING'],
        },
      },
      orderBy: {
        priorityScore: 'desc',
      },
    });

    // Calculate basic metrics
    const metrics = {
      totalInitiatives: initiatives.length,
      priorityDistribution: {
        high: initiatives.filter((i) => (i.priorityScore || 0) >= 80).length,
        medium: initiatives.filter(
          (i) => (i.priorityScore || 0) >= 50 && (i.priorityScore || 0) < 80
        ).length,
        low: initiatives.filter((i) => (i.priorityScore || 0) < 50).length,
      },
      avgPriority:
        initiatives.length > 0
          ? Math.round(
              initiatives.reduce((sum, i) => sum + (i.priorityScore || 0), 0) / initiatives.length
            )
          : 0,
      lastAnalysis: await getLastAnalysisDate(user.id),
    };

    return NextResponse.json({
      success: true,
      overview: {
        metrics,
        initiatives: initiatives.slice(0, 10), // Top 10 for quick view
        readyForAnalysis: initiatives.length,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('❌ Error retrieving prioritization overview:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve prioritization data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper function to get last analysis date
async function getLastAnalysisDate(userId: string) {
  const lastLog = await prisma.auditLog.findFirst({
    where: {
      userId,
      action: 'AI_INITIATIVE_PRIORITIZATION',
    },
    orderBy: {
      timestamp: 'desc',
    },
  });

  return lastLog?.timestamp || null;
}
