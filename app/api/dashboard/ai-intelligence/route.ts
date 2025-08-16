import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  generatePredictiveTrends,
  detectAnomalies,
  generateSmartRecommendations,
  generateExecutiveAISummary,
} from '@/lib/predictive-analytics';

// Force dynamic server-side rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parallel execution for optimal performance
    const [predictiveTrends, anomalies, smartRecommendations, executiveSummary] = await Promise.all(
      [
        generatePredictiveTrends(),
        detectAnomalies(),
        generateSmartRecommendations(),
        generateExecutiveAISummary(),
      ]
    );

    // AI Intelligence Summary
    const aiIntelligence = {
      trendsAnalysis: {
        totalTrends: predictiveTrends.length,
        positiveTrends: predictiveTrends.filter((t) => t.changePercent > 0).length,
        avgConfidence:
          predictiveTrends.length > 0
            ? Math.round(
                predictiveTrends.reduce((sum, t) => sum + t.confidence, 0) / predictiveTrends.length
              )
            : 0,
        topTrend: predictiveTrends.sort(
          (a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)
        )[0],
      },
      anomalyDetection: {
        totalAnomalies: anomalies.length,
        criticalAnomalies: anomalies.filter((a) => a.severity === 'critical').length,
        highAnomalies: anomalies.filter((a) => a.severity === 'high').length,
        recentAnomaly: anomalies.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())[0],
      },
      recommendationEngine: {
        totalRecommendations: smartRecommendations.length,
        criticalActions: smartRecommendations.filter((r) => r.priority === 'critical').length,
        highImpactActions: smartRecommendations.filter((r) => r.successProbability > 80).length,
        avgSuccessProbability:
          smartRecommendations.length > 0
            ? Math.round(
                smartRecommendations.reduce((sum, r) => sum + r.successProbability, 0) /
                  smartRecommendations.length
              )
            : 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        predictiveTrends,
        anomalies,
        smartRecommendations,
        executiveSummary,
        aiIntelligence,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('AI Intelligence dashboard API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate AI intelligence dashboard',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
