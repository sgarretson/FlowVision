import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiServiceMonitor } from '@/lib/ai-service-monitor';
import { AIMigration } from '@/lib/ai-migration';

interface ImprovementSuggestionRequest {
  title: string;
  problem: string;
  goal: string;
  validationContext?: any;
}

interface SmartSuggestion {
  id: string;
  type: 'title' | 'problem' | 'goal';
  current: string;
  suggested: string;
  reasoning: string;
  confidence: number;
  improvement: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();
    const body: ImprovementSuggestionRequest = await request.json();
    const { title, problem, goal, validationContext } = body;

    // Input validation
    if (!title?.trim() || !problem?.trim()) {
      return NextResponse.json(
        { error: 'Title and problem statement are required' },
        { status: 400 }
      );
    }

    // Generate improvement suggestions prompt
    const improvementPrompt = `As an AI strategic consultant, analyze this initiative and provide specific improvement suggestions.

CURRENT INITIATIVE:
Title: "${title}"
Problem: "${problem}"
Goal: "${goal || 'Not specified'}"

${
  validationContext
    ? `
VALIDATION CONTEXT:
- Current Score: ${validationContext.score}/100
- Strategic Alignment: Business Value ${validationContext.strategicAlignment?.businessValue}%, Feasibility ${validationContext.strategicAlignment?.feasibility}%
- Completeness Issues: ${JSON.stringify(validationContext.completeness)}
- Feedback: ${validationContext.feedback?.map((f: any) => f.message).join('; ')}
`
    : ''
}

Please provide specific improvement suggestions in the following JSON format:

{
  "suggestions": [
    {
      "id": "unique_suggestion_id",
      "type": "title|problem|goal",
      "current": "exact current text",
      "suggested": "improved version of the text",
      "reasoning": "explanation of why this improvement helps",
      "confidence": [0-100 confidence score],
      "improvement": "specific benefit this change provides"
    }
  ]
}

Focus on providing 2-4 high-impact suggestions that will:

1. **For Title**: Make it more specific, measurable, and strategic
2. **For Problem**: Add business impact, stakeholder effects, quantifiable metrics
3. **For Goal**: Make it SMART (Specific, Measurable, Achievable, Relevant, Time-bound)

Guidelines:
- Only suggest improvements where there's clear value (confidence > 70%)
- Make suggestions specific and actionable
- Focus on strategic value and measurability
- Include business impact and stakeholder considerations
- Ensure suggestions align with enterprise-level thinking

Keep suggestions concise but impactful. Each suggestion should demonstrably improve the initiative's strategic quality and clarity.`;

    // Get AI analysis
    const aiResult = await AIMigration.generateStructuredResponse(improvementPrompt);

    if (!aiResult) {
      return NextResponse.json(
        { error: 'Failed to generate improvement suggestions' },
        { status: 500 }
      );
    }

    // Parse the AI response
    let suggestionData: { suggestions: SmartSuggestion[] };
    try {
      suggestionData = JSON.parse(aiResult);

      // Ensure all required fields are present and generate IDs if missing
      suggestionData.suggestions = (suggestionData.suggestions || [])
        .map((suggestion, index) => ({
          id: suggestion.id || `suggestion_${Date.now()}_${index}`,
          type: suggestion.type || 'problem',
          current: suggestion.current || '',
          suggested: suggestion.suggested || '',
          reasoning: suggestion.reasoning || '',
          confidence: Math.max(0, Math.min(100, suggestion.confidence || 0)),
          improvement: suggestion.improvement || '',
        }))
        .filter((s) => s.current && s.suggested && s.confidence >= 70); // Only high-confidence suggestions
    } catch (parseError) {
      console.error('Failed to parse AI improvement suggestions:', parseError);
      return NextResponse.json({ error: 'Failed to parse AI suggestion result' }, { status: 500 });
    }

    // Record successful operation
    await aiServiceMonitor.recordOperation('improvement_suggestions', true, Date.now() - startTime);

    return NextResponse.json(suggestionData);
  } catch (error) {
    console.error('Improvement suggestions API error:', error);

    // Record failed operation
    await aiServiceMonitor.recordOperation(
      'improvement_suggestions',
      false,
      Date.now() - (Date.now() - 1000)
    );

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
