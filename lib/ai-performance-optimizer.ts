/**
 * AI Performance Optimizer for FlowVision
 * Provides intelligent request optimization, prompt engineering, and response enhancement
 */

import { z } from 'zod';
import { aiCacheManager } from './ai-cache-manager';

export interface OptimizationConfig {
  enablePromptOptimization: boolean;
  enableResponseStreaming: boolean;
  enableTokenOptimization: boolean;
  enableContextCompression: boolean;
  maxContextLength: number;
  targetResponseTime: number; // in milliseconds
}

export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  category: string;
  estimatedTokens: number;
  successRate: number;
}

export interface OptimizationResult {
  originalPrompt: string;
  optimizedPrompt: string;
  tokenReduction: number;
  estimatedSavings: number;
  optimizations: string[];
}

export interface PerformanceMetrics {
  avgResponseTime: number;
  tokenEfficiency: number;
  costReduction: number;
  cacheHitRate: number;
  errorRate: number;
  throughput: number; // requests per minute
}

/**
 * AI Performance Optimizer
 */
export class AIPerformanceOptimizer {
  private config: OptimizationConfig;
  private templates: Map<string, PromptTemplate>;
  private metrics: PerformanceMetrics;
  private requestHistory: Array<{
    timestamp: number;
    duration: number;
    tokens: number;
    cost: number;
  }>;

  constructor(config: OptimizationConfig) {
    this.config = config;
    this.templates = new Map();
    this.metrics = {
      avgResponseTime: 0,
      tokenEfficiency: 0,
      costReduction: 0,
      cacheHitRate: 0,
      errorRate: 0,
      throughput: 0,
    };
    this.requestHistory = [];

    this.initializeDefaultTemplates();
  }

  /**
   * Optimize AI request for better performance
   */
  async optimizeRequest(request: {
    prompt: string;
    context?: any;
    userId?: string;
    type: 'analysis' | 'generation' | 'classification' | 'summarization';
  }): Promise<{
    optimizedPrompt: string;
    estimatedTokens: number;
    estimatedCost: number;
    optimizations: string[];
    useStreaming: boolean;
  }> {
    const optimizations: string[] = [];
    let optimizedPrompt = request.prompt;

    // 1. Apply prompt optimization
    if (this.config.enablePromptOptimization) {
      const promptOptimization = this.optimizePrompt(optimizedPrompt, request.type);
      optimizedPrompt = promptOptimization.optimizedPrompt;
      optimizations.push(...promptOptimization.optimizations);
    }

    // 2. Apply context compression
    if (this.config.enableContextCompression && request.context) {
      const compressedContext = this.compressContext(request.context);
      optimizedPrompt = this.injectContext(optimizedPrompt, compressedContext);
      optimizations.push('Context compression applied');
    }

    // 3. Template matching
    const template = this.findBestTemplate(optimizedPrompt, request.type);
    if (template) {
      optimizedPrompt = this.applyTemplate(template, optimizedPrompt);
      optimizations.push(`Applied template: ${template.name}`);
    }

    // 4. Token optimization
    const tokenOptimization = this.optimizeTokens(optimizedPrompt);
    optimizedPrompt = tokenOptimization.optimizedText;
    optimizations.push(...tokenOptimization.optimizations);

    // 5. Estimate performance metrics
    const estimatedTokens = this.estimateTokens(optimizedPrompt);
    const estimatedCost = this.estimateCost(estimatedTokens, 'gpt-4');
    const useStreaming = this.shouldUseStreaming(estimatedTokens, request.type);

    return {
      optimizedPrompt,
      estimatedTokens,
      estimatedCost,
      optimizations,
      useStreaming,
    };
  }

  /**
   * Optimize prompt text for efficiency
   */
  private optimizePrompt(
    prompt: string,
    type: string
  ): { optimizedPrompt: string; optimizations: string[] } {
    const optimizations: string[] = [];
    let optimized = prompt;

    // Remove redundant phrases
    const redundantPhrases = [
      /please\s+/gi,
      /kindly\s+/gi,
      /if\s+you\s+could\s+/gi,
      /would\s+you\s+mind\s+/gi,
      /i\s+would\s+like\s+you\s+to\s+/gi,
    ];

    for (const phrase of redundantPhrases) {
      const before = optimized.length;
      optimized = optimized.replace(phrase, '');
      if (optimized.length < before) {
        optimizations.push('Removed redundant phrases');
        break;
      }
    }

    // Optimize for specific task types
    switch (type) {
      case 'analysis':
        optimized = this.optimizeAnalysisPrompt(optimized);
        optimizations.push('Applied analysis optimization');
        break;
      case 'generation':
        optimized = this.optimizeGenerationPrompt(optimized);
        optimizations.push('Applied generation optimization');
        break;
      case 'classification':
        optimized = this.optimizeClassificationPrompt(optimized);
        optimizations.push('Applied classification optimization');
        break;
      case 'summarization':
        optimized = this.optimizeSummarizationPrompt(optimized);
        optimizations.push('Applied summarization optimization');
        break;
    }

    // Remove extra whitespace
    const beforeWhitespace = optimized.length;
    optimized = optimized.replace(/\s+/g, ' ').trim();
    if (optimized.length < beforeWhitespace) {
      optimizations.push('Normalized whitespace');
    }

    return { optimizedPrompt: optimized, optimizations };
  }

  /**
   * Optimize tokens for cost efficiency
   */
  private optimizeTokens(text: string): { optimizedText: string; optimizations: string[] } {
    const optimizations: string[] = [];
    let optimized = text;

    // Replace verbose phrases with concise alternatives
    const replacements = [
      { from: /in order to/gi, to: 'to', name: 'Simplified phrases' },
      { from: /a large number of/gi, to: 'many', name: 'Reduced wordiness' },
      { from: /it is important to note that/gi, to: 'note:', name: 'Removed filler' },
      { from: /take into consideration/gi, to: 'consider', name: 'Simplified verbs' },
      { from: /make use of/gi, to: 'use', name: 'Simplified verbs' },
      { from: /in the event that/gi, to: 'if', name: 'Simplified conditions' },
    ];

    for (const replacement of replacements) {
      const before = optimized.length;
      optimized = optimized.replace(replacement.from, replacement.to);
      if (optimized.length < before && !optimizations.includes(replacement.name)) {
        optimizations.push(replacement.name);
      }
    }

    // Remove duplicate sentences
    const sentences = optimized.split(/[.!?]+/).filter((s) => s.trim());
    const uniqueSentences = [...new Set(sentences.map((s) => s.trim().toLowerCase()))];

    if (uniqueSentences.length < sentences.length) {
      optimized = uniqueSentences.join('. ') + '.';
      optimizations.push('Removed duplicate sentences');
    }

    return { optimizedText: optimized, optimizations };
  }

  /**
   * Compress context for efficient inclusion
   */
  private compressContext(context: any): any {
    if (typeof context === 'string') {
      return this.compressText(context);
    }

    if (Array.isArray(context)) {
      return context.slice(0, 10).map((item) => this.compressContext(item));
    }

    if (typeof context === 'object' && context !== null) {
      const compressed: any = {};
      const importantKeys = ['id', 'title', 'description', 'status', 'priority', 'category'];

      for (const key of importantKeys) {
        if (context[key] !== undefined) {
          compressed[key] = this.compressContext(context[key]);
        }
      }

      return compressed;
    }

    return context;
  }

  /**
   * Compress text by removing non-essential words
   */
  private compressText(text: string, maxLength: number = 500): string {
    if (text.length <= maxLength) return text;

    // Remove non-essential words
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'very',
      'really',
      'quite',
      'rather',
      'somewhat',
      'totally',
      'completely',
      'absolutely',
    ]);

    const words = text.split(/\s+/);
    const essentialWords = words.filter(
      (word) => !stopWords.has(word.toLowerCase()) || words.indexOf(word) < 10 // Keep first 10 words
    );

    let compressed = essentialWords.join(' ');

    // If still too long, truncate to sentences
    if (compressed.length > maxLength) {
      const sentences = compressed.split(/[.!?]+/);
      compressed = sentences.slice(0, Math.ceil(sentences.length / 2)).join('. ') + '.';
    }

    return compressed.substring(0, maxLength);
  }

  /**
   * Find best matching template for prompt
   */
  private findBestTemplate(prompt: string, type: string): PromptTemplate | null {
    const candidates = Array.from(this.templates.values())
      .filter((template) => template.category === type)
      .sort((a, b) => b.successRate - a.successRate);

    for (const template of candidates) {
      const similarity = this.calculateSimilarity(prompt, template.template);
      if (similarity > 0.6) {
        return template;
      }
    }

    return null;
  }

  /**
   * Apply template to prompt
   */
  private applyTemplate(template: PromptTemplate, prompt: string): string {
    let applied = template.template;

    // Extract variables from prompt
    const variables = this.extractVariables(prompt, template.variables);

    for (const [key, value] of Object.entries(variables)) {
      applied = applied.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }

    return applied;
  }

  /**
   * Determine if streaming should be used
   */
  private shouldUseStreaming(estimatedTokens: number, type: string): boolean {
    if (!this.config.enableResponseStreaming) return false;

    // Use streaming for longer responses
    if (estimatedTokens > 500) return true;

    // Use streaming for generation tasks
    if (type === 'generation') return true;

    return false;
  }

  /**
   * Estimate token count
   */
  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English
    return Math.ceil(text.length / 4);
  }

  /**
   * Estimate cost
   */
  private estimateCost(tokens: number, model: string): number {
    const costs: Record<string, number> = {
      'gpt-4': 0.03,
      'gpt-3.5-turbo': 0.002,
    };

    return (tokens / 1000) * (costs[model] || costs['gpt-3.5-turbo']);
  }

  /**
   * Calculate text similarity
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Extract variables from prompt
   */
  private extractVariables(prompt: string, variableNames: string[]): Record<string, string> {
    const variables: Record<string, string> = {};

    for (const varName of variableNames) {
      // Simple extraction based on common patterns
      const patterns = [
        new RegExp(`${varName}[:\s]+([^.!?]+)`, 'i'),
        new RegExp(`"([^"]*)"`, 'g'),
        new RegExp(`'([^']*)'`, 'g'),
      ];

      for (const pattern of patterns) {
        const match = prompt.match(pattern);
        if (match) {
          variables[varName] = match[1];
          break;
        }
      }
    }

    return variables;
  }

  /**
   * Inject context into prompt
   */
  private injectContext(prompt: string, context: any): string {
    const contextStr = typeof context === 'string' ? context : JSON.stringify(context);
    return `Context: ${contextStr}\n\n${prompt}`;
  }

  /**
   * Task-specific prompt optimizations
   */
  private optimizeAnalysisPrompt(prompt: string): string {
    return `Analyze: ${prompt}. Provide structured insights with key findings, patterns, and recommendations.`;
  }

  private optimizeGenerationPrompt(prompt: string): string {
    return `Generate: ${prompt}. Create comprehensive, actionable content.`;
  }

  private optimizeClassificationPrompt(prompt: string): string {
    return `Classify: ${prompt}. Return category with confidence score.`;
  }

  private optimizeSummarizationPrompt(prompt: string): string {
    return `Summarize: ${prompt}. Extract key points in bullet format.`;
  }

  /**
   * Initialize default prompt templates
   */
  private initializeDefaultTemplates(): void {
    const templates: PromptTemplate[] = [
      {
        id: 'issue-analysis',
        name: 'Issue Analysis',
        template:
          'Analyze the following issue: {{description}}. Identify root causes, impact assessment, and provide 3 actionable solutions.',
        variables: ['description'],
        category: 'analysis',
        estimatedTokens: 200,
        successRate: 0.85,
      },
      {
        id: 'initiative-generation',
        name: 'Initiative Generation',
        template:
          'Create a strategic initiative to address: {{problem}}. Include objectives, timeline, resources, and success metrics.',
        variables: ['problem'],
        category: 'generation',
        estimatedTokens: 300,
        successRate: 0.78,
      },
      {
        id: 'priority-classification',
        name: 'Priority Classification',
        template:
          'Classify the priority of: {{item}}. Consider impact, urgency, and resources. Return: HIGH/MEDIUM/LOW with justification.',
        variables: ['item'],
        category: 'classification',
        estimatedTokens: 150,
        successRate: 0.92,
      },
      {
        id: 'content-summarization',
        name: 'Content Summarization',
        template: 'Summarize: {{content}}. Extract 3-5 key points in bullet format.',
        variables: ['content'],
        category: 'summarization',
        estimatedTokens: 100,
        successRate: 0.88,
      },
    ];

    for (const template of templates) {
      this.templates.set(template.id, template);
    }
  }

  /**
   * Track request performance
   */
  async trackRequest(
    duration: number,
    tokens: number,
    cost: number,
    success: boolean
  ): Promise<void> {
    const request = {
      timestamp: Date.now(),
      duration,
      tokens,
      cost,
    };

    this.requestHistory.push(request);

    // Keep only last 1000 requests
    if (this.requestHistory.length > 1000) {
      this.requestHistory = this.requestHistory.slice(-1000);
    }

    this.updateMetrics();
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    if (this.requestHistory.length === 0) return;

    const recent = this.requestHistory.slice(-100); // Last 100 requests

    this.metrics.avgResponseTime = recent.reduce((sum, r) => sum + r.duration, 0) / recent.length;
    this.metrics.tokenEfficiency = recent.reduce((sum, r) => sum + r.tokens, 0) / recent.length;

    // Calculate throughput (requests per minute)
    const oneMinuteAgo = Date.now() - 60000;
    const recentRequests = this.requestHistory.filter((r) => r.timestamp > oneMinuteAgo);
    this.metrics.throughput = recentRequests.length;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Generate optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.getMetrics();

    if (metrics.avgResponseTime > this.config.targetResponseTime) {
      recommendations.push('Consider using smaller models for faster responses');
      recommendations.push('Enable aggressive prompt optimization');
    }

    if (metrics.cacheHitRate < 0.3) {
      recommendations.push('Increase cache TTL to improve hit rate');
      recommendations.push('Normalize prompts for better caching');
    }

    if (metrics.tokenEfficiency > 1000) {
      recommendations.push('Enable token optimization to reduce costs');
      recommendations.push('Use prompt templates for consistency');
    }

    if (metrics.errorRate > 0.05) {
      recommendations.push('Review and improve error handling');
      recommendations.push('Add request validation');
    }

    return recommendations;
  }
}

/**
 * Create configured performance optimizer
 */
export function createAIPerformanceOptimizer(): AIPerformanceOptimizer {
  const config: OptimizationConfig = {
    enablePromptOptimization: process.env.AI_PROMPT_OPTIMIZATION !== 'false',
    enableResponseStreaming: process.env.AI_RESPONSE_STREAMING === 'true',
    enableTokenOptimization: process.env.AI_TOKEN_OPTIMIZATION !== 'false',
    enableContextCompression: process.env.AI_CONTEXT_COMPRESSION !== 'false',
    maxContextLength: parseInt(process.env.AI_MAX_CONTEXT_LENGTH || '4000'),
    targetResponseTime: parseInt(process.env.AI_TARGET_RESPONSE_TIME || '3000'),
  };

  return new AIPerformanceOptimizer(config);
}

// Global optimizer instance
export const aiPerformanceOptimizer = createAIPerformanceOptimizer();
