import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/rbac';
import { aiRiskAnalyzer } from '@/lib/ai-risk-analyzer';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const riskAnalysisSchema = z.object({
  timeframeDays: z.number().min(7).max(365).default(30),
  systemIds: z.array(z.string()).optional(),
  includeAlerts: z.boolean().default(true),
  riskThreshold: z.number().min(1).max(100).default(75),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and leaders can access risk analysis
    if (user.role !== 'ADMIN' && user.role !== 'LEADER') {
      return NextResponse.json(
        { error: 'Insufficient permissions for risk analysis' },
        { status: 403 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validatedData = riskAnalysisSchema.parse(body);

    // Generate comprehensive risk analysis
    const systemAnalyses = await aiRiskAnalyzer.analyzeSystemRisks(validatedData.timeframeDays);

    // Filter by specific systems if requested
    const filteredAnalyses = validatedData.systemIds
      ? systemAnalyses.filter((analysis) => validatedData.systemIds!.includes(analysis.systemId))
      : systemAnalyses;

    // Get risk alerts if requested
    let riskAlerts: any[] = [];
    if (validatedData.includeAlerts) {
      riskAlerts = await aiRiskAnalyzer.getRiskAlerts(validatedData.riskThreshold);
    }

    // Calculate summary statistics
    const summary = {
      totalSystemsAnalyzed: filteredAnalyses.length,
      highRiskSystems: filteredAnalyses.filter(
        (a) => Math.max(...a.predictions.map((p) => p.predictedRiskScore)) >= 75
      ).length,
      averageRiskScore:
        filteredAnalyses.length > 0
          ? Math.round(
              filteredAnalyses.reduce(
                (sum, analysis) =>
                  sum + Math.max(...analysis.predictions.map((p) => p.predictedRiskScore)),
                0
              ) / filteredAnalyses.length
            )
          : 0,
      trendDistribution: {
        increasing: filteredAnalyses.filter((a) =>
          a.predictions.some((p) => p.riskTrend === 'INCREASING')
        ).length,
        stable: filteredAnalyses.filter((a) => a.predictions.every((p) => p.riskTrend === 'STABLE'))
          .length,
        decreasing: filteredAnalyses.filter((a) =>
          a.predictions.some((p) => p.riskTrend === 'DECREASING')
        ).length,
      },
      avgConfidence:
        filteredAnalyses.length > 0
          ? Math.round(
              filteredAnalyses.reduce(
                (sum, analysis) =>
                  sum +
                  analysis.predictions.reduce((predSum, pred) => predSum + pred.confidence, 0) /
                    analysis.predictions.length,
                0
              ) / filteredAnalyses.length
            )
          : 0,
    };

    // Log risk analysis access
    await prisma.auditLog.create({
      data: {
        action: 'AI_RISK_ANALYSIS',
        userId: user.id,
        details: {
          timeframeDays: validatedData.timeframeDays,
          systemCount: filteredAnalyses.length,
          highRiskCount: summary.highRiskSystems,
          averageRiskScore: summary.averageRiskScore,
          includeAlerts: validatedData.includeAlerts,
          alertCount: riskAlerts.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      analysis: {
        summary,
        systemAnalyses: filteredAnalyses,
        riskAlerts,
        parameters: {
          timeframeDays: validatedData.timeframeDays,
          riskThreshold: validatedData.riskThreshold,
          systemsRequested: validatedData.systemIds?.length || 'all',
        },
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

    console.error('❌ Error generating risk analysis:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate risk analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and leaders can access risk analysis
    if (user.role !== 'ADMIN' && user.role !== 'LEADER') {
      return NextResponse.json(
        { error: 'Insufficient permissions for risk analysis' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeframeDays = parseInt(searchParams.get('timeframeDays') || '30');
    const alertsOnly = searchParams.get('alertsOnly') === 'true';

    if (alertsOnly) {
      // Return only risk alerts for quick dashboard view
      const riskAlerts = await aiRiskAnalyzer.getRiskAlerts(75);

      return NextResponse.json({
        success: true,
        alerts: riskAlerts,
        alertCount: riskAlerts.length,
        generatedAt: new Date(),
      });
    } else {
      // Return basic risk analysis
      const systemAnalyses = await aiRiskAnalyzer.analyzeSystemRisks(timeframeDays);

      // Return simplified view for performance
      const simplified = systemAnalyses.map((analysis) => ({
        systemId: analysis.systemId,
        systemName: analysis.systemName,
        systemType: analysis.systemType,
        maxPredictedRisk: Math.max(...analysis.predictions.map((p) => p.predictedRiskScore)),
        riskTrend: analysis.predictions[0]?.riskTrend || 'STABLE',
        issueCount: analysis.currentMetrics.totalIssues,
        criticalIssues: analysis.currentMetrics.criticalIssues,
      }));

      return NextResponse.json({
        success: true,
        systems: simplified,
        generatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error('❌ Error retrieving risk analysis:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve risk analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
