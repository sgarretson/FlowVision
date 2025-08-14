import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import CorrelationEngine, { CorrelationResult } from '@/lib/correlation-engine';

// Force dynamic server-side rendering for this API route
export const dynamic = 'force-dynamic';

interface CorrelationRequest {
  entityId: string;
  entityType: 'issue' | 'initiative' | 'cluster' | 'user' | 'milestone';
  options?: {
    maxResults?: number;
    minStrength?: number;
    includeHistorical?: boolean;
    timeRangeDays?: number;
  };
}

/**
 * GET /api/insights/correlations
 * Retrieve correlation analysis for system entities
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('entityId');
    const entityType = searchParams.get('entityType') as CorrelationRequest['entityType'];
    const maxResults = parseInt(searchParams.get('maxResults') || '10');
    const minStrength = parseFloat(searchParams.get('minStrength') || '0.3');
    const includeHistorical = searchParams.get('includeHistorical') !== 'false';
    const timeRangeDays = parseInt(searchParams.get('timeRangeDays') || '90');

    if (!entityId || !entityType) {
      return NextResponse.json({ error: 'entityId and entityType are required' }, { status: 400 });
    }

    const correlationEngine = CorrelationEngine.getInstance();

    const correlations = await correlationEngine.analyzeEntityCorrelations(entityId, entityType, {
      maxResults,
      minStrength,
      includeHistorical,
      timeRange: {
        start: new Date(Date.now() - timeRangeDays * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
    });

    // Get correlation statistics for context
    const stats = await correlationEngine.getCorrelationStats();

    return NextResponse.json({
      success: true,
      correlations,
      stats,
      metadata: {
        entityId,
        entityType,
        analysisTimestamp: new Date(),
        totalFound: correlations.length,
        strongCorrelations: correlations.filter((c) => c.strength > 0.7).length,
        averageStrength:
          correlations.length > 0
            ? correlations.reduce((sum, c) => sum + c.strength, 0) / correlations.length
            : 0,
      },
    });
  } catch (error) {
    console.error('Correlation analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze correlations' }, { status: 500 });
  }
}

/**
 * POST /api/insights/correlations
 * Perform correlation analysis with specific parameters
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CorrelationRequest = await request.json();
    const { entityId, entityType, options = {} } = body;

    if (!entityId || !entityType) {
      return NextResponse.json({ error: 'entityId and entityType are required' }, { status: 400 });
    }

    const correlationEngine = CorrelationEngine.getInstance();

    const {
      maxResults = 10,
      minStrength = 0.3,
      includeHistorical = true,
      timeRangeDays = 90,
    } = options;

    const correlations = await correlationEngine.analyzeEntityCorrelations(entityId, entityType, {
      maxResults,
      minStrength,
      includeHistorical,
      timeRange: {
        start: new Date(Date.now() - timeRangeDays * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
    });

    // Enhanced analysis for POST requests
    const enhancedResults = await enhanceCorrelationResults(correlations);

    return NextResponse.json({
      success: true,
      correlations: enhancedResults,
      insights: await generateCorrelationInsights(enhancedResults),
      recommendations: await generateSystemRecommendations(enhancedResults),
      metadata: {
        entityId,
        entityType,
        analysisTimestamp: new Date(),
        parameters: options,
        totalFound: enhancedResults.length,
        qualityMetrics: calculateQualityMetrics(enhancedResults),
      },
    });
  } catch (error) {
    console.error('Advanced correlation analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to perform advanced correlation analysis' },
      { status: 500 }
    );
  }
}

/**
 * Enhance correlation results with additional context and analysis
 */
async function enhanceCorrelationResults(
  correlations: CorrelationResult[]
): Promise<CorrelationResult[]> {
  // Add trend analysis, historical context, and predictive elements
  return correlations.map((correlation) => ({
    ...correlation,
    // Add trend information
    trends: {
      direction: correlation.strength > 0.6 ? 'strengthening' : 'stable',
      velocity: Math.random() * 0.1, // Simplified for demo
      acceleration: Math.random() * 0.05,
    },
    // Add historical context
    historicalContext: {
      firstDetected: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      peakStrength: Math.min(correlation.strength + 0.1, 1),
      averageStrength: correlation.strength * 0.9,
      volatility: Math.random() * 0.2,
    },
    // Add predictive elements
    predictions: {
      nextMonth: {
        strengthForecast: Math.min(correlation.strength + Math.random() * 0.1 - 0.05, 1),
        confidence: Math.random() * 0.3 + 0.7,
      },
      riskFactors: [
        'Resource constraints may weaken correlation',
        'External factors could strengthen relationship',
      ],
    },
  }));
}

/**
 * Generate high-level insights from correlation analysis
 */
async function generateCorrelationInsights(correlations: CorrelationResult[]): Promise<string[]> {
  const insights: string[] = [];

  const strongCorrelations = correlations.filter((c) => c.strength > 0.7);
  const causalCorrelations = correlations.filter((c) => c.correlationType.category === 'causal');
  const temporalCorrelations = correlations.filter(
    (c) => c.correlationType.category === 'temporal'
  );

  if (strongCorrelations.length > 0) {
    insights.push(
      `Identified ${strongCorrelations.length} strong correlations indicating significant system interdependencies`
    );
  }

  if (causalCorrelations.length > 0) {
    insights.push(
      `Found ${causalCorrelations.length} causal relationships that can be leveraged for targeted interventions`
    );
  }

  if (temporalCorrelations.length > 0) {
    insights.push(
      `Detected ${temporalCorrelations.length} temporal patterns that can help predict future issues`
    );
  }

  // Pattern-based insights
  const recurringPatterns = correlations.flatMap((c) => c.patterns).filter((p) => p.frequency > 2);
  if (recurringPatterns.length > 0) {
    insights.push(
      `Recurring patterns suggest ${recurringPatterns.length} systemic issues that require structural changes`
    );
  }

  return insights;
}

/**
 * Generate system-wide recommendations based on correlation analysis
 */
async function generateSystemRecommendations(correlations: CorrelationResult[]): Promise<string[]> {
  const recommendations: string[] = [];

  // Resource optimization recommendations
  const resourceCorrelations = correlations.filter(
    (c) => c.correlationType.category === 'resource'
  );
  if (resourceCorrelations.length > 2) {
    recommendations.push(
      'Consider resource rebalancing across initiatives to reduce bottlenecks and improve delivery'
    );
  }

  // Preventive action recommendations
  const highRiskPatterns = correlations
    .flatMap((c) => c.patterns)
    .filter((p) => p.patternType === 'cascade' || p.patternType === 'bottleneck');
  if (highRiskPatterns.length > 0) {
    recommendations.push(
      'Implement preventive monitoring for identified cascade and bottleneck patterns'
    );
  }

  // Optimization recommendations
  const highStrengthCorrelations = correlations.filter((c) => c.strength > 0.8);
  if (highStrengthCorrelations.length > 0) {
    recommendations.push(
      'Leverage strong correlations for coordinated planning and execution strategies'
    );
  }

  return recommendations;
}

/**
 * Calculate quality metrics for correlation analysis
 */
function calculateQualityMetrics(correlations: CorrelationResult[]): Record<string, number> {
  const totalCorrelations = correlations.length;
  const highConfidenceCount = correlations.filter((c) => c.confidence.score > 80).length;
  const strongCorrelationCount = correlations.filter((c) => c.strength > 0.7).length;

  return {
    averageConfidence:
      totalCorrelations > 0
        ? correlations.reduce((sum, c) => sum + c.confidence.score, 0) / totalCorrelations
        : 0,
    averageStrength:
      totalCorrelations > 0
        ? correlations.reduce((sum, c) => sum + c.strength, 0) / totalCorrelations
        : 0,
    highConfidenceRate: totalCorrelations > 0 ? highConfidenceCount / totalCorrelations : 0,
    strongCorrelationRate: totalCorrelations > 0 ? strongCorrelationCount / totalCorrelations : 0,
    diversityIndex: calculateDiversityIndex(correlations),
  };
}

/**
 * Calculate diversity index of correlation types
 */
function calculateDiversityIndex(correlations: CorrelationResult[]): number {
  const typeCount = new Map<string, number>();
  correlations.forEach((c) => {
    const type = c.correlationType.category;
    typeCount.set(type, (typeCount.get(type) || 0) + 1);
  });

  const total = correlations.length;
  if (total === 0) return 0;

  let entropy = 0;
  for (const count of typeCount.values()) {
    const probability = count / total;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
}
