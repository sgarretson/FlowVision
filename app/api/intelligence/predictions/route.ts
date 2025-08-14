import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PredictiveEngine from '@/lib/predictive-engine';

export const dynamic = 'force-dynamic';

/**
 * GET /api/intelligence/predictions
 * Retrieve AI predictions and forecasts
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityTypes = searchParams.get('entityTypes')?.split(',') || [
      'issue',
      'initiative',
      'cluster',
    ];
    const timeHorizon = parseInt(searchParams.get('timeHorizon') || '30');
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0.6');

    const predictiveEngine = PredictiveEngine.getInstance();

    const predictions = await predictiveEngine.generatePredictions({
      entityTypes,
      timeHorizon,
      minConfidence,
    });

    const summary = await predictiveEngine.getPredictiveIntelligenceSummary();

    return NextResponse.json({
      success: true,
      predictions,
      summary,
      metadata: {
        totalPredictions: predictions.length,
        highRiskCount: predictions.filter(
          (p) => p.prediction.severity === 'high' || p.prediction.severity === 'critical'
        ).length,
        averageConfidence:
          predictions.length > 0
            ? predictions.reduce((sum, p) => sum + p.confidence.score, 0) / predictions.length
            : 0,
        analysisTimestamp: new Date(),
        parameters: {
          entityTypes,
          timeHorizon,
          minConfidence,
        },
      },
    });
  } catch (error) {
    console.error('Prediction API error:', error);
    return NextResponse.json({ error: 'Failed to generate predictions' }, { status: 500 });
  }
}

/**
 * POST /api/intelligence/predictions
 * Generate predictions with specific parameters
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      entityTypes = ['issue', 'initiative', 'cluster'],
      timeHorizon = 30,
      minConfidence = 0.6,
      includeAnomalies = true,
      includeRecommendations = true,
    } = body;

    const predictiveEngine = PredictiveEngine.getInstance();

    // Generate predictions
    const predictions = await predictiveEngine.generatePredictions({
      entityTypes,
      timeHorizon,
      minConfidence,
    });

    // Get anomalies if requested
    let anomalies: any[] = [];
    if (includeAnomalies) {
      anomalies = await predictiveEngine.detectAnomalies();
    }

    // Generate enhanced analysis
    const enhancedAnalysis = {
      riskAssessment: {
        highRisk: predictions.filter((p) => p.prediction.severity === 'critical').length,
        mediumRisk: predictions.filter((p) => p.prediction.severity === 'high').length,
        lowRisk: predictions.filter((p) => p.prediction.severity === 'medium').length,
        totalRisk: predictions.reduce((sum, p) => {
          const severityScore = { critical: 4, high: 3, medium: 2, low: 1 };
          return sum + (severityScore[p.prediction.severity] || 1) * p.prediction.probability;
        }, 0),
      },
      timeDistribution: {
        immediate: predictions.filter((p) => p.prediction.timeframe <= 7).length,
        shortTerm: predictions.filter(
          (p) => p.prediction.timeframe > 7 && p.prediction.timeframe <= 30
        ).length,
        longTerm: predictions.filter((p) => p.prediction.timeframe > 30).length,
      },
      outcomeDistribution: predictions.reduce(
        (acc, p) => {
          acc[p.prediction.outcome] = (acc[p.prediction.outcome] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      automationOpportunities: predictions
        .flatMap((p) => p.recommendations)
        .filter((r) => r.automation.canAutomate).length,
    };

    return NextResponse.json({
      success: true,
      predictions,
      anomalies: includeAnomalies ? anomalies : undefined,
      analysis: enhancedAnalysis,
      insights: generatePredictiveInsights(predictions, anomalies),
      recommendations: includeRecommendations
        ? generateSystemRecommendations(predictions)
        : undefined,
      metadata: {
        generatedAt: new Date(),
        parameters: body,
        totalEntitiesAnalyzed: predictions.length + anomalies.length,
      },
    });
  } catch (error) {
    console.error('Enhanced prediction API error:', error);
    return NextResponse.json({ error: 'Failed to generate enhanced predictions' }, { status: 500 });
  }
}

/**
 * Generate insights from predictions and anomalies
 */
function generatePredictiveInsights(predictions: any[], anomalies: any[]): string[] {
  const insights: string[] = [];

  const criticalPredictions = predictions.filter((p) => p.prediction.severity === 'critical');
  if (criticalPredictions.length > 0) {
    insights.push(
      `🚨 ${criticalPredictions.length} critical risk prediction${criticalPredictions.length > 1 ? 's' : ''} requiring immediate attention`
    );
  }

  const emergencePredictions = predictions.filter((p) => p.prediction.outcome === 'emergence');
  if (emergencePredictions.length > 0) {
    insights.push(
      `⚡ ${emergencePredictions.length} new issue${emergencePredictions.length > 1 ? 's' : ''} predicted to emerge in the next 30 days`
    );
  }

  const failurePredictions = predictions.filter((p) => p.prediction.outcome === 'failure');
  if (failurePredictions.length > 0) {
    insights.push(
      `⚠️ ${failurePredictions.length} initiative${failurePredictions.length > 1 ? 's' : ''} at risk of failure - intervention recommended`
    );
  }

  const bottleneckPredictions = predictions.filter((p) => p.prediction.outcome === 'escalation');
  if (bottleneckPredictions.length > 0) {
    insights.push(
      `🔄 ${bottleneckPredictions.length} resource bottleneck${bottleneckPredictions.length > 1 ? 's' : ''} predicted - capacity planning needed`
    );
  }

  const highConfidencePredictions = predictions.filter((p) => p.confidence.score >= 85);
  if (highConfidencePredictions.length > 0) {
    insights.push(
      `✅ ${highConfidencePredictions.length} high-confidence prediction${highConfidencePredictions.length > 1 ? 's' : ''} with >85% accuracy`
    );
  }

  if (anomalies.length > 0) {
    const criticalAnomalies = anomalies.filter((a) => a.severity === 'critical');
    if (criticalAnomalies.length > 0) {
      insights.push(
        `🔍 ${criticalAnomalies.length} critical anomal${criticalAnomalies.length > 1 ? 'ies' : 'y'} detected requiring investigation`
      );
    }
  }

  const automatedActions = predictions
    .flatMap((p) => p.recommendations)
    .filter((r) => r.automation.canAutomate);
  if (automatedActions.length > 0) {
    insights.push(
      `🤖 ${automatedActions.length} automated action${automatedActions.length > 1 ? 's' : ''} available for immediate execution`
    );
  }

  return insights;
}

/**
 * Generate system-wide recommendations
 */
function generateSystemRecommendations(predictions: any[]): string[] {
  const recommendations: string[] = [];

  const riskCount = predictions.filter(
    (p) => p.prediction.severity === 'critical' || p.prediction.severity === 'high'
  ).length;

  if (riskCount > 5) {
    recommendations.push(
      'Consider implementing emergency risk mitigation protocols due to high number of critical predictions'
    );
  }

  const resourceIssues = predictions.filter(
    (p) => p.prediction.outcome === 'escalation' && p.targetEntity.type === 'user'
  ).length;

  if (resourceIssues > 2) {
    recommendations.push('Immediate resource capacity assessment and scaling plan recommended');
  }

  const initiativeRisks = predictions.filter(
    (p) => p.targetEntity.type === 'initiative' && p.prediction.outcome === 'failure'
  ).length;

  if (initiativeRisks > 0) {
    recommendations.push(
      'Review initiative portfolios and consider resource reallocation or scope adjustments'
    );
  }

  const emergingIssues = predictions.filter((p) => p.prediction.outcome === 'emergence').length;

  if (emergingIssues > 3) {
    recommendations.push(
      'Proactive issue prevention measures recommended to address emerging patterns'
    );
  }

  return recommendations;
}
