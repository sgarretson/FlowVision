import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { aiSolutionEngine } from '@/lib/ai-solution-engine';
import { z } from 'zod';

// Request validation schema
const recommendationRequestSchema = z.object({
  initiativeId: z.string().optional(),
  issueIds: z.array(z.string()).optional(),
  maxRecommendations: z.number().min(1).max(10).default(5),
  includeSystemAnalytics: z.boolean().default(true),
  focusAreas: z.array(z.enum(['TECHNOLOGY', 'PROCESS', 'TRAINING', 'POLICY'])).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const validatedData = recommendationRequestSchema.parse(body);

    // Build recommendation context
    const context: any = {
      organizationContext: {
        industry: 'architecture', // TODO: Get from user profile
        size: 'medium',
        existingSolutions: [],
      },
    };

    // Get initiative context if provided
    if (validatedData.initiativeId) {
      const initiative = await prisma.initiative.findUnique({
        where: { id: validatedData.initiativeId },
        include: {
          addressedIssues: {
            include: {
              systemImpacts: {
                include: {
                  systemCategory: true,
                },
              },
            },
          },
        },
      });

      if (!initiative) {
        return NextResponse.json({ error: 'Initiative not found' }, { status: 404 });
      }

      context.initiative = {
        id: initiative.id,
        title: initiative.title,
        problem: initiative.problem,
        goal: initiative.goal,
      };

      // Add addressed issues to context
      if (initiative.addressedIssues && initiative.addressedIssues.length > 0) {
        context.issues = initiative.addressedIssues.map((issue) => ({
          id: issue.id,
          description: issue.description,
          heatmapScore: issue.heatmapScore,
          votes: issue.votes,
          systemImpacts:
            issue.systemImpacts?.map((impact) => ({
              systemCategory: {
                name: impact.systemCategory.name,
                type: impact.systemCategory.type,
              },
              impactLevel: impact.impactLevel,
            })) || [],
        }));
      }
    }

    // Get specific issues if provided
    if (validatedData.issueIds && validatedData.issueIds.length > 0) {
      const issues = await prisma.issue.findMany({
        where: {
          id: { in: validatedData.issueIds },
        },
        include: {
          systemImpacts: {
            include: {
              systemCategory: true,
            },
          },
        },
      });

      context.issues = issues.map((issue) => ({
        id: issue.id,
        description: issue.description,
        heatmapScore: issue.heatmapScore,
        votes: issue.votes,
        systemImpacts:
          issue.systemImpacts?.map((impact) => ({
            systemCategory: {
              name: impact.systemCategory.name,
              type: impact.systemCategory.type,
            },
            impactLevel: impact.impactLevel,
          })) || [],
      }));
    }

    // Include system analytics if requested
    if (validatedData.includeSystemAnalytics) {
      // Get system analytics (reuse logic from systems/analytics endpoint)
      const systemsWithImpacts = await prisma.systemCategory.findMany({
        include: {
          issueImpacts: {
            include: {
              issue: true,
            },
          },
        },
      });

      const riskSystems = systemsWithImpacts
        .filter((system) => {
          const impacts = system.issueImpacts;
          if (impacts.length === 0) return false;

          const criticalImpacts = impacts.filter((i) => i.impactLevel === 'CRITICAL').length;
          const highImpacts = impacts.filter((i) => i.impactLevel === 'HIGH').length;
          const riskScore = criticalImpacts * 25 + highImpacts * 15 + impacts.length * 5;

          return riskScore > 50;
        })
        .map((system) => system.name);

      context.systemAnalytics = {
        riskSystems,
        impactDistribution: {
          critical: systemsWithImpacts.reduce(
            (sum, s) => sum + s.issueImpacts.filter((i) => i.impactLevel === 'CRITICAL').length,
            0
          ),
          high: systemsWithImpacts.reduce(
            (sum, s) => sum + s.issueImpacts.filter((i) => i.impactLevel === 'HIGH').length,
            0
          ),
          medium: systemsWithImpacts.reduce(
            (sum, s) => sum + s.issueImpacts.filter((i) => i.impactLevel === 'MEDIUM').length,
            0
          ),
          low: systemsWithImpacts.reduce(
            (sum, s) => sum + s.issueImpacts.filter((i) => i.impactLevel === 'LOW').length,
            0
          ),
        },
        systemTypeBreakdown: {},
      };
    }

    // Generate AI recommendations
    const recommendations = await aiSolutionEngine.generateSolutionRecommendations(
      context,
      validatedData.maxRecommendations
    );

    // Filter by focus areas if specified
    const filteredRecommendations = validatedData.focusAreas
      ? recommendations.filter((rec) => validatedData.focusAreas!.includes(rec.type))
      : recommendations;

    // Log AI usage for tracking
    await prisma.auditLog.create({
      data: {
        action: 'AI_SOLUTION_RECOMMENDATIONS',
        userId: user.id,
        details: {
          initiativeId: validatedData.initiativeId,
          issueCount: context.issues?.length || 0,
          recommendationCount: filteredRecommendations.length,
          focusAreas: validatedData.focusAreas,
          avgConfidence:
            filteredRecommendations.reduce((sum, r) => sum + r.confidence, 0) /
            filteredRecommendations.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      recommendations: filteredRecommendations,
      context: {
        initiativeId: validatedData.initiativeId,
        issueCount: context.issues?.length || 0,
        systemAnalytics: context.systemAnalytics
          ? {
              riskSystemCount: context.systemAnalytics.riskSystems.length,
              totalImpacts: Object.values(context.systemAnalytics.impactDistribution).reduce(
                (a: number, b: unknown) => a + (b as number),
                0
              ),
            }
          : null,
      },
      generatedAt: new Date(),
      userId: user.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('❌ Error generating AI solution recommendations:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate recommendations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
