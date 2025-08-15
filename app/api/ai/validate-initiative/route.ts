import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiServiceMonitor } from '@/lib/ai-service-monitor';
import { AIMigration } from '@/lib/ai-migration';
import { prisma } from '@/lib/prisma';

interface InitiativeValidationRequest {
  title: string;
  problem: string;
  goal: string;
  options?: {
    includeStrategicAnalysis?: boolean;
    includeCrossImpactAnalysis?: boolean;
  };
}

interface InitiativeValidationResult {
  score: number;
  strategicAlignment: {
    businessValue: number;
    feasibility: number;
    urgency: number;
    resourceRequirement: number;
  };
  completeness: {
    hasClearProblem: boolean;
    hasSpecificGoal: boolean;
    hasMeasurableOutcomes: boolean;
    hasTimelineConsideration: boolean;
    hasResourceEstimation: boolean;
    hasStakeholderImpact: boolean;
    wordCount: {
      title: number;
      problem: number;
      goal: number;
    };
  };
  crossImpactAnalysis: {
    conflictingInitiatives: Array<{
      id: string;
      title: string;
      conflictType: 'resource' | 'timeline' | 'scope' | 'strategic';
      severity: 'low' | 'medium' | 'high';
    }>;
    synergisticOpportunities: Array<{
      id: string;
      title: string;
      synergyType: 'resource' | 'timeline' | 'scope' | 'strategic';
      potential: 'low' | 'medium' | 'high';
    }>;
  };
  feedback: Array<{
    type: 'error' | 'warning' | 'success' | 'info';
    category: 'strategic' | 'tactical' | 'operational' | 'validation';
    message: string;
    suggestion?: string;
  }>;
  aiRecommendations: Array<{
    type: 'strategic' | 'tactical' | 'risk' | 'enhancement';
    priority: 'high' | 'medium' | 'low';
    content: string;
    reasoning: string;
    confidence: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();
    const body: InitiativeValidationRequest = await request.json();
    const { title, problem, goal, options = {} } = body;

    // Input validation
    if (!title?.trim() || !problem?.trim()) {
      return NextResponse.json(
        { error: 'Title and problem statement are required' },
        { status: 400 }
      );
    }

    // Load existing initiatives for cross-impact analysis
    let existingInitiatives: any[] = [];
    if (options.includeCrossImpactAnalysis) {
      existingInitiatives = await prisma.initiative.findMany({
        select: {
          id: true,
          title: true,
          problem: true,
          goal: true,
          status: true,
          timelineStart: true,
          timelineEnd: true,
          budget: true,
          estimatedHours: true,
        },
        where: {
          status: {
            in: ['PLANNING', 'IN_PROGRESS', 'APPROVED'],
          },
        },
        take: 20, // Limit for performance
      });
    }

    // Generate strategic validation prompt
    const validationPrompt = `As a strategic AI consultant, analyze this initiative proposal and provide comprehensive feedback.

INITIATIVE DETAILS:
Title: "${title}"
Problem: "${problem}"
Goal: "${goal || 'Not specified'}"

${
  existingInitiatives.length > 0
    ? `
EXISTING INITIATIVES CONTEXT:
${existingInitiatives.map((init) => `- ${init.title}: ${init.problem}`).join('\n')}
`
    : ''
}

Please provide a detailed analysis in the following JSON format:

{
  "score": [0-100 overall strategic quality score],
  "strategicAlignment": {
    "businessValue": [0-100 score for business value potential],
    "feasibility": [0-100 score for implementation feasibility],
    "urgency": [0-100 score for urgency/timing],
    "resourceRequirement": [0-100 score for resource efficiency - higher means less resource intensive]
  },
  "completeness": {
    "hasClearProblem": [boolean - is the problem clearly defined?],
    "hasSpecificGoal": [boolean - is the goal specific and measurable?],
    "hasMeasurableOutcomes": [boolean - are there measurable outcomes?],
    "hasTimelineConsideration": [boolean - mentions timing/urgency?],
    "hasResourceEstimation": [boolean - mentions resources/effort?],
    "hasStakeholderImpact": [boolean - mentions affected people/teams?],
    "wordCount": {
      "title": ${title.trim().split(/\s+/).length},
      "problem": ${problem.trim().split(/\s+/).length},
      "goal": ${(goal || '').trim().split(/\s+/).length}
    }
  },
  ${
    options.includeCrossImpactAnalysis
      ? `
  "crossImpactAnalysis": {
    "conflictingInitiatives": [
      // Array of initiatives that might conflict with this one
      {
        "id": "existing_initiative_id",
        "title": "Initiative title",
        "conflictType": "resource|timeline|scope|strategic",
        "severity": "low|medium|high"
      }
    ],
    "synergisticOpportunities": [
      // Array of initiatives that could work well together
      {
        "id": "existing_initiative_id", 
        "title": "Initiative title",
        "synergyType": "resource|timeline|scope|strategic",
        "potential": "low|medium|high"
      }
    ]
  },`
      : `
  "crossImpactAnalysis": {
    "conflictingInitiatives": [],
    "synergisticOpportunities": []
  },`
  }
  "feedback": [
    // Array of specific feedback messages
    {
      "type": "error|warning|success|info",
      "category": "strategic|tactical|operational|validation",
      "message": "Specific feedback message",
      "suggestion": "Optional improvement suggestion"
    }
  ],
  "aiRecommendations": [
    // Array of strategic recommendations
    {
      "type": "strategic|tactical|risk|enhancement",
      "priority": "high|medium|low",
      "content": "Recommendation content",
      "reasoning": "Why this recommendation is important",
      "confidence": [0-100 confidence in this recommendation]
    }
  ]
}

Focus on:
1. Strategic alignment with business value
2. Implementation feasibility and resource efficiency
3. Clear problem definition and measurable goals
4. Potential conflicts or synergies with existing initiatives
5. Risk factors and enhancement opportunities

Provide specific, actionable feedback that helps improve the initiative quality.`;

    // Get AI analysis
    const aiResult = await AIMigration.generateStructuredResponse(validationPrompt, {
      maxTokens: 2000,
      temperature: 0.3,
    });

    if (!aiResult) {
      return NextResponse.json(
        { error: 'Failed to generate initiative validation' },
        { status: 500 }
      );
    }

    // Parse the AI response
    let validationResult: InitiativeValidationResult;
    try {
      validationResult = JSON.parse(aiResult);

      // Ensure all required fields are present with defaults
      validationResult = {
        score: validationResult.score || 0,
        strategicAlignment: {
          businessValue: validationResult.strategicAlignment?.businessValue || 0,
          feasibility: validationResult.strategicAlignment?.feasibility || 0,
          urgency: validationResult.strategicAlignment?.urgency || 0,
          resourceRequirement: validationResult.strategicAlignment?.resourceRequirement || 0,
        },
        completeness: {
          hasClearProblem: validationResult.completeness?.hasClearProblem || false,
          hasSpecificGoal: validationResult.completeness?.hasSpecificGoal || false,
          hasMeasurableOutcomes: validationResult.completeness?.hasMeasurableOutcomes || false,
          hasTimelineConsideration:
            validationResult.completeness?.hasTimelineConsideration || false,
          hasResourceEstimation: validationResult.completeness?.hasResourceEstimation || false,
          hasStakeholderImpact: validationResult.completeness?.hasStakeholderImpact || false,
          wordCount: {
            title: title.trim().split(/\s+/).length,
            problem: problem.trim().split(/\s+/).length,
            goal: (goal || '').trim().split(/\s+/).length,
          },
        },
        crossImpactAnalysis: {
          conflictingInitiatives:
            validationResult.crossImpactAnalysis?.conflictingInitiatives || [],
          synergisticOpportunities:
            validationResult.crossImpactAnalysis?.synergisticOpportunities || [],
        },
        feedback: validationResult.feedback || [],
        aiRecommendations: validationResult.aiRecommendations || [],
      };
    } catch (parseError) {
      console.error('Failed to parse AI validation result:', parseError);
      return NextResponse.json({ error: 'Failed to parse AI validation result' }, { status: 500 });
    }

    // Record successful operation
    await aiServiceMonitor.recordOperation(
      'initiative_validation',
      'success',
      Date.now() - startTime
    );

    return NextResponse.json(validationResult);
  } catch (error) {
    console.error('Initiative validation API error:', error);

    // Record failed operation
    await aiServiceMonitor.recordOperation(
      'initiative_validation',
      'error',
      Date.now() - (Date.now() - 1000)
    );

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
