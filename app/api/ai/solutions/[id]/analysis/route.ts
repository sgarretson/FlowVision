import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/rbac';
import { aiSolutionEngine } from '@/lib/ai-solution-engine';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify solution exists and user has access
    const solution = await prisma.initiativeSolution.findUnique({
      where: { id: params.id },
      include: {
        initiative: {
          select: {
            id: true,
            ownerId: true,
            title: true,
          },
        },
      },
    });

    if (!solution) {
      return NextResponse.json({ error: 'Solution not found' }, { status: 404 });
    }

    // Check permissions (owner, admin, or viewer access)
    if (user.role !== 'ADMIN' && solution.initiative.ownerId !== user.id) {
      // Allow viewers to see analysis for transparency
      if (user.role !== 'LEADER') {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    }

    // Generate AI effectiveness analysis
    const analysis = await aiSolutionEngine.analyzeSolutionEffectiveness(params.id);

    // Log analysis access
    await prisma.auditLog.create({
      data: {
        action: 'AI_SOLUTION_ANALYSIS',
        userId: user.id,
        details: {
          solutionId: params.id,
          initiativeId: solution.initiative.id,
          effectivenessScore: analysis.effectivenessScore,
          confidence: analysis.confidence,
        },
      },
    });

    return NextResponse.json({
      success: true,
      solutionId: params.id,
      analysis: {
        effectivenessScore: analysis.effectivenessScore,
        insights: analysis.insights,
        recommendations: analysis.recommendations,
        confidence: analysis.confidence,
        generatedAt: new Date(),
      },
      solution: {
        id: solution.id,
        title: solution.title,
        status: solution.status,
        progress: solution.progress,
      },
    });
  } catch (error) {
    console.error('❌ Error generating solution analysis:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate solution analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
