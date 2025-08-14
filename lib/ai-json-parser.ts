/**
 * Smart JSON Parser for AI Responses
 * Handles different OpenAI model output formats including GPT-4 Turbo
 */

export interface ParsedAIResponse {
  success: boolean;
  data: any;
  raw: string;
  method: 'direct' | 'markdown' | 'regex' | 'fallback';
  confidence: number;
}

export class AIJSONParser {
  /**
   * Parse AI response with multiple fallback strategies
   */
  static parseAIResponse(content: string, expectedFields?: string[]): ParsedAIResponse {
    if (!content || typeof content !== 'string') {
      return {
        success: false,
        data: null,
        raw: content,
        method: 'direct',
        confidence: 0,
      };
    }

    // Strategy 1: Direct JSON parse
    try {
      const parsed = JSON.parse(content);
      const confidence = this.validateFields(parsed, expectedFields);
      return {
        success: true,
        data: parsed,
        raw: content,
        method: 'direct',
        confidence,
      };
    } catch {}

    // Strategy 2: Extract from markdown code blocks (GPT-4 Turbo format)
    const markdownMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (markdownMatch) {
      try {
        const parsed = JSON.parse(markdownMatch[1]);
        const confidence = this.validateFields(parsed, expectedFields);
        return {
          success: true,
          data: parsed,
          raw: content,
          method: 'markdown',
          confidence,
        };
      } catch {}
    }

    // Strategy 3: Find JSON-like structure with regex
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const cleaned = this.cleanJSONString(jsonMatch[0]);
        const parsed = JSON.parse(cleaned);
        const confidence = this.validateFields(parsed, expectedFields);
        return {
          success: true,
          data: parsed,
          raw: content,
          method: 'regex',
          confidence: Math.max(confidence - 20, 0), // Lower confidence for regex extraction
        };
      } catch {}
    }

    // Strategy 4: Fallback to structured text response
    const fallbackData = this.createFallbackResponse(content, expectedFields);
    return {
      success: false,
      data: fallbackData,
      raw: content,
      method: 'fallback',
      confidence: 30,
    };
  }

  /**
   * Clean JSON string by removing common formatting issues
   */
  private static cleanJSONString(jsonStr: string): string {
    return jsonStr
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/,\s*}/g, '}') // Remove trailing commas before }
      .replace(/,\s*]/g, ']') // Remove trailing commas before ]
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
      .trim();
  }

  /**
   * Validate that parsed data contains expected fields
   */
  private static validateFields(data: any, expectedFields?: string[]): number {
    if (!expectedFields || !Array.isArray(expectedFields)) {
      return 100;
    }

    if (!data || typeof data !== 'object') {
      return 0;
    }

    const foundFields = expectedFields.filter((field) => {
      const value = data[field];
      return value !== undefined && value !== null && value !== '';
    });

    return Math.round((foundFields.length / expectedFields.length) * 100);
  }

  /**
   * Create fallback response when JSON parsing fails
   */
  private static createFallbackResponse(content: string, expectedFields?: string[]): any {
    const fallback: any = {
      summary: content.substring(0, 250) + (content.length > 250 ? '...' : ''),
      confidence: 50,
    };

    // Try to extract common fields from text
    if (expectedFields?.includes('rootCauses')) {
      fallback.rootCauses = this.extractListFromText(content, ['cause', 'root', 'reason']);
    }

    if (expectedFields?.includes('recommendations')) {
      fallback.recommendations = this.extractListFromText(content, [
        'recommend',
        'suggest',
        'should',
      ]);
    }

    if (expectedFields?.includes('impact')) {
      const impactMatch = content.match(/impact[:\s]+([^.!?]*[.!?])/i);
      fallback.impact = impactMatch ? impactMatch[1].trim() : 'Impact analysis in summary';
    }

    return fallback;
  }

  /**
   * Extract list items from text based on keywords
   */
  private static extractListFromText(content: string, keywords: string[]): string[] {
    const lines = content.split('\n');
    const items: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Check for bullet points or numbered lists
      if (/^[\d•\-\*]\s*/.test(trimmed)) {
        const cleaned = trimmed.replace(/^[\d•\-\*]\s*/, '').trim();
        if (cleaned.length > 10) {
          items.push(cleaned);
        }
      }
      // Check for keyword-based sentences
      else if (keywords.some((keyword) => trimmed.toLowerCase().includes(keyword))) {
        if (trimmed.length > 10 && trimmed.length < 200) {
          items.push(trimmed);
        }
      }
    }

    return items.length > 0 ? items.slice(0, 5) : ['Analysis available in summary'];
  }

  /**
   * Model-specific parsing strategies
   */
  static parseByModel(
    content: string,
    modelName: string,
    expectedFields?: string[]
  ): ParsedAIResponse {
    // GPT-4 models often wrap JSON in markdown
    if (modelName.includes('gpt-4')) {
      // Try markdown extraction first for GPT-4
      const markdownMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (markdownMatch) {
        try {
          const parsed = JSON.parse(markdownMatch[1]);
          const confidence = this.validateFields(parsed, expectedFields);
          return {
            success: true,
            data: parsed,
            raw: content,
            method: 'markdown',
            confidence,
          };
        } catch {}
      }
    }

    // Fall back to standard parsing
    return this.parseAIResponse(content, expectedFields);
  }

  /**
   * Validate and enhance AI response for specific use cases
   */
  static validateIssueAnalysis(response: ParsedAIResponse): ParsedAIResponse {
    if (!response.success || !response.data) {
      return response;
    }

    const data = response.data;

    // Ensure required fields exist
    if (!data.summary && !data.description) {
      data.summary = data.analysis || data.content || 'AI analysis generated';
    }

    // Ensure arrays are properly formatted
    if (data.rootCauses && !Array.isArray(data.rootCauses)) {
      data.rootCauses = [data.rootCauses];
    }

    if (data.recommendations && !Array.isArray(data.recommendations)) {
      data.recommendations = [data.recommendations];
    }

    // Ensure confidence is a number between 0-100
    if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 100) {
      data.confidence = Math.min(Math.max(response.confidence || 75, 0), 100);
    }

    return {
      ...response,
      data,
      confidence: Math.min(response.confidence + 10, 100), // Boost confidence for validated data
    };
  }

  /**
   * Validate and enhance cluster analysis response
   */
  static validateClusterAnalysis(response: ParsedAIResponse): ParsedAIResponse {
    if (!response.success || !response.data) {
      return response;
    }

    const data = response.data;

    // Ensure cluster-specific fields
    if (!data.consolidatedSummary && data.summary) {
      data.consolidatedSummary = data.summary;
    }

    if (data.crossIssuePatterns && !Array.isArray(data.crossIssuePatterns)) {
      data.crossIssuePatterns = [data.crossIssuePatterns];
    }

    if (data.initiativeRecommendations && !Array.isArray(data.initiativeRecommendations)) {
      data.initiativeRecommendations = [data.initiativeRecommendations];
    }

    // Validate strategic priority
    const validPriorities = ['HIGH', 'MEDIUM', 'LOW'];
    if (!validPriorities.includes(data.strategicPriority)) {
      data.strategicPriority = 'MEDIUM';
    }

    return {
      ...response,
      data,
      confidence: Math.min(response.confidence + 10, 100),
    };
  }
}

export default AIJSONParser;
