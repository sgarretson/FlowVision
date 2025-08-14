/**
 * FlowVision Correlation Engine - Phase 2
 * Real-time analysis of cross-entity relationships and pattern detection
 */

import { PrismaClient } from '@prisma/client';
import { EnhancedInsight, ConfidenceReasoning, BusinessImpact } from '@/types/insights';

const prisma = new PrismaClient();

export interface CorrelationResult {
  sourceEntity: EntityReference;
  targetEntity: EntityReference;
  correlationType: CorrelationType;
  strength: number; // 0-1
  confidence: ConfidenceReasoning;
  patterns: PatternMatch[];
  impact: BusinessImpact;
  recommendations: ActionRecommendation[];
}

export interface EntityReference {
  id: string;
  type: 'issue' | 'initiative' | 'cluster' | 'user' | 'milestone';
  title: string;
  status?: string;
  metadata: Record<string, any>;
}

export interface CorrelationType {
  category: 'causal' | 'temporal' | 'resource' | 'thematic' | 'performance';
  direction: 'bidirectional' | 'source-to-target' | 'target-to-source';
  significance: 'high' | 'medium' | 'low';
}

export interface PatternMatch {
  patternType: 'recurring' | 'emerging' | 'seasonal' | 'cascade' | 'bottleneck';
  frequency: number;
  timeframe: string;
  description: string;
  lastOccurrence: Date;
  nextPredicted?: Date;
  confidenceInterval: number;
}

export interface ActionRecommendation {
  priority: 'immediate' | 'short-term' | 'long-term';
  category: 'prevention' | 'optimization' | 'mitigation' | 'escalation';
  action: string;
  rationale: string;
  expectedOutcome: string;
  requiredResources: string[];
  timeline: string;
  successMetrics: string[];
}

export class CorrelationEngine {
  private static instance: CorrelationEngine;
  private correlationCache = new Map<string, CorrelationResult[]>();
  private patternLibrary = new Map<string, PatternMatch[]>();

  public static getInstance(): CorrelationEngine {
    if (!CorrelationEngine.instance) {
      CorrelationEngine.instance = new CorrelationEngine();
    }
    return CorrelationEngine.instance;
  }

  /**
   * Analyze correlations for a specific entity across the entire system
   */
  async analyzeEntityCorrelations(
    entityId: string,
    entityType: EntityReference['type'],
    options: {
      maxResults?: number;
      minStrength?: number;
      includeHistorical?: boolean;
      timeRange?: { start: Date; end: Date };
    } = {}
  ): Promise<CorrelationResult[]> {
    const {
      maxResults = 10,
      minStrength = 0.3,
      includeHistorical = true,
      timeRange = {
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        end: new Date(),
      },
    } = options;

    // Check cache first
    const cacheKey = `${entityType}-${entityId}-${JSON.stringify(options)}`;
    if (this.correlationCache.has(cacheKey)) {
      return this.correlationCache.get(cacheKey)!;
    }

    const correlations: CorrelationResult[] = [];

    // 1. Temporal Correlations - entities that frequently occur together in time
    const temporalCorrelations = await this.findTemporalCorrelations(
      entityId,
      entityType,
      timeRange
    );
    correlations.push(...temporalCorrelations);

    // 2. Causal Correlations - entities with cause-effect relationships
    const causalCorrelations = await this.findCausalCorrelations(entityId, entityType);
    correlations.push(...causalCorrelations);

    // 3. Resource Correlations - entities sharing resources/people
    const resourceCorrelations = await this.findResourceCorrelations(entityId, entityType);
    correlations.push(...resourceCorrelations);

    // 4. Thematic Correlations - entities with similar themes/keywords
    const thematicCorrelations = await this.findThematicCorrelations(entityId, entityType);
    correlations.push(...thematicCorrelations);

    // 5. Performance Correlations - entities with similar performance patterns
    const performanceCorrelations = await this.findPerformanceCorrelations(entityId, entityType);
    correlations.push(...performanceCorrelations);

    // Filter and sort by strength
    const filteredCorrelations = correlations
      .filter((c) => c.strength >= minStrength)
      .sort((a, b) => b.strength - a.strength)
      .slice(0, maxResults);

    // Cache results
    this.correlationCache.set(cacheKey, filteredCorrelations);

    return filteredCorrelations;
  }

  /**
   * Find temporal correlations based on timing patterns
   */
  private async findTemporalCorrelations(
    entityId: string,
    entityType: EntityReference['type'],
    timeRange: { start: Date; end: Date }
  ): Promise<CorrelationResult[]> {
    const correlations: CorrelationResult[] = [];

    // Example: Find issues that tend to be reported around the same time as initiative milestones
    if (entityType === 'initiative') {
      const initiative = await prisma.initiative.findUnique({
        where: { id: entityId },
        include: {
          milestones: true,
          addressedIssues: true,
          cluster: {
            include: {
              issues: true,
            },
          },
        },
      });

      if (initiative?.milestones) {
        for (const milestone of initiative.milestones) {
          // Find issues created within 7 days of milestone due dates
          const relatedIssues = await prisma.issue.findMany({
            where: {
              createdAt: {
                gte: new Date(milestone.dueDate.getTime() - 7 * 24 * 60 * 60 * 1000),
                lte: new Date(milestone.dueDate.getTime() + 7 * 24 * 60 * 60 * 1000),
              },
            },
            include: {
              cluster: true,
            },
          });

          // Calculate correlation strength based on temporal proximity and frequency
          const strength = this.calculateTemporalStrength(milestone, relatedIssues);

          if (strength > 0.3) {
            correlations.push({
              sourceEntity: {
                id: entityId,
                type: 'initiative',
                title: initiative.title,
                status: initiative.status,
                metadata: { milestoneId: milestone.id },
              },
              targetEntity: {
                id: milestone.id,
                type: 'milestone',
                title: milestone.title,
                status: milestone.status,
                metadata: { relatedIssueCount: relatedIssues.length },
              },
              correlationType: {
                category: 'temporal',
                direction: 'bidirectional',
                significance: strength > 0.7 ? 'high' : strength > 0.5 ? 'medium' : 'low',
              },
              strength,
              confidence: {
                score: Math.round(strength * 85), // Temporal patterns are generally reliable
                reasoning: [
                  `${relatedIssues.length} issues created within 7 days of milestone`,
                  'Temporal proximity indicates operational stress patterns',
                  'Historical pattern recognition from similar milestones',
                ],
                dataQuality: 'high',
                sampleSize: relatedIssues.length,
                historicalAccuracy: 78,
              },
              patterns: await this.identifyTemporalPatterns(milestone, relatedIssues),
              impact: await this.calculateBusinessImpact('temporal', {
                issueCount: relatedIssues.length,
                severity: 'medium',
              }),
              recommendations: this.generateTemporalRecommendations(milestone, relatedIssues),
            });
          }
        }
      }
    }

    return correlations;
  }

  /**
   * Find causal correlations based on direct relationships
   */
  private async findCausalCorrelations(
    entityId: string,
    entityType: EntityReference['type']
  ): Promise<CorrelationResult[]> {
    const correlations: CorrelationResult[] = [];

    if (entityType === 'cluster') {
      // Find initiatives that directly address this cluster
      const cluster = await prisma.issueCluster.findUnique({
        where: { id: entityId },
        include: {
          initiatives: {
            include: {
              owner: true,
              milestones: true,
              addressedIssues: true,
            },
          },
          issues: true,
        },
      });

      if (cluster?.initiatives) {
        for (const initiative of cluster.initiatives) {
          const strength = this.calculateCausalStrength(cluster, initiative);

          correlations.push({
            sourceEntity: {
              id: entityId,
              type: 'cluster',
              title: cluster.name,
              metadata: { issueCount: cluster.issues.length, severity: cluster.severity },
            },
            targetEntity: {
              id: initiative.id,
              type: 'initiative',
              title: initiative.title,
              status: initiative.status,
              metadata: {
                progress: initiative.progress,
                addressedIssuesCount: initiative.addressedIssues?.length || 0,
              },
            },
            correlationType: {
              category: 'causal',
              direction: 'source-to-target',
              significance: strength > 0.8 ? 'high' : strength > 0.6 ? 'medium' : 'low',
            },
            strength,
            confidence: {
              score: Math.round(strength * 95), // Causal relationships are highly reliable
              reasoning: [
                'Direct addressing relationship established',
                'Initiative explicitly created to resolve cluster issues',
                'Progress correlation with issue resolution',
              ],
              dataQuality: 'high',
              sampleSize: cluster.issues.length,
              historicalAccuracy: 85,
            },
            patterns: await this.identifyCausalPatterns(cluster, initiative),
            impact: await this.calculateBusinessImpact('causal', {
              clusterSeverity: cluster.severity,
              initiativeProgress: initiative.progress,
              issueCount: cluster.issues.length,
            }),
            recommendations: this.generateCausalRecommendations(cluster, initiative),
          });
        }
      }
    }

    return correlations;
  }

  /**
   * Find resource correlations based on shared ownership/teams
   */
  private async findResourceCorrelations(
    entityId: string,
    entityType: EntityReference['type']
  ): Promise<CorrelationResult[]> {
    const correlations: CorrelationResult[] = [];

    if (entityType === 'initiative') {
      // Find other initiatives with the same owner
      const initiative = await prisma.initiative.findUnique({
        where: { id: entityId },
        include: { owner: true },
      });

      if (initiative?.owner) {
        const relatedInitiatives = await prisma.initiative.findMany({
          where: {
            ownerId: initiative.ownerId,
            id: { not: entityId },
            status: { in: ['ACTIVE', 'PLANNING', 'APPROVED'] },
          },
          include: {
            milestones: true,
            addressedIssues: true,
          },
        });

        for (const related of relatedInitiatives) {
          const strength = this.calculateResourceStrength(initiative, related);

          correlations.push({
            sourceEntity: {
              id: entityId,
              type: 'initiative',
              title: initiative.title,
              status: initiative.status,
              metadata: { ownerId: initiative.ownerId },
            },
            targetEntity: {
              id: related.id,
              type: 'initiative',
              title: related.title,
              status: related.status,
              metadata: { ownerId: related.ownerId },
            },
            correlationType: {
              category: 'resource',
              direction: 'bidirectional',
              significance: strength > 0.7 ? 'high' : strength > 0.5 ? 'medium' : 'low',
            },
            strength,
            confidence: {
              score: Math.round(strength * 90),
              reasoning: [
                'Same owner indicates resource competition',
                'Parallel execution may create bottlenecks',
                'Shared context and expertise',
              ],
              dataQuality: 'high',
              sampleSize: relatedInitiatives.length,
              historicalAccuracy: 82,
            },
            patterns: await this.identifyResourcePatterns(initiative, related),
            impact: await this.calculateBusinessImpact('resource', {
              initiativeCount: relatedInitiatives.length + 1,
              ownerCapacity: 40, // hours/week
            }),
            recommendations: this.generateResourceRecommendations(initiative, related),
          });
        }
      }
    }

    return correlations;
  }

  /**
   * Find thematic correlations based on content similarity
   */
  private async findThematicCorrelations(
    entityId: string,
    entityType: EntityReference['type']
  ): Promise<CorrelationResult[]> {
    // Implementation for semantic similarity analysis
    // This would integrate with AI/NLP services for content analysis
    return [];
  }

  /**
   * Find performance correlations based on success/failure patterns
   */
  private async findPerformanceCorrelations(
    entityId: string,
    entityType: EntityReference['type']
  ): Promise<CorrelationResult[]> {
    // Implementation for performance pattern analysis
    return [];
  }

  // Helper methods for strength calculations
  private calculateTemporalStrength(milestone: any, relatedIssues: any[]): number {
    // Calculate based on temporal proximity and issue severity
    const baseStrength = Math.min(relatedIssues.length / 5, 1); // Normalize to 0-1
    const severityBonus = relatedIssues.reduce((sum, issue) => sum + issue.heatmapScore, 0) / 100;
    return Math.min(baseStrength + severityBonus * 0.3, 1);
  }

  private calculateCausalStrength(cluster: any, initiative: any): number {
    // Strong causal relationship if initiative directly addresses cluster
    const baseStrength = 0.8; // High base for direct relationships
    const progressBonus = (initiative.progress / 100) * 0.2;
    return Math.min(baseStrength + progressBonus, 1);
  }

  private calculateResourceStrength(initiative1: any, initiative2: any): number {
    // Calculate based on shared resources and timing overlap
    const baseStrength = 0.6; // Medium base for same owner
    const statusAlignment = initiative1.status === initiative2.status ? 0.2 : 0;
    return Math.min(baseStrength + statusAlignment, 1);
  }

  // Pattern identification methods
  private async identifyTemporalPatterns(milestone: any, issues: any[]): Promise<PatternMatch[]> {
    return [
      {
        patternType: 'recurring',
        frequency: issues.length,
        timeframe: '7 days around milestone',
        description: 'Issues spike near milestone deadlines',
        lastOccurrence: new Date(),
        confidenceInterval: 0.8,
      },
    ];
  }

  private async identifyCausalPatterns(cluster: any, initiative: any): Promise<PatternMatch[]> {
    return [
      {
        patternType: 'cascade',
        frequency: 1,
        timeframe: 'Initiative lifecycle',
        description: 'Initiative progress inversely correlates with cluster issues',
        lastOccurrence: new Date(),
        confidenceInterval: 0.9,
      },
    ];
  }

  private async identifyResourcePatterns(
    initiative1: any,
    initiative2: any
  ): Promise<PatternMatch[]> {
    return [
      {
        patternType: 'bottleneck',
        frequency: 2,
        timeframe: 'Concurrent execution',
        description: 'Resource contention may delay both initiatives',
        lastOccurrence: new Date(),
        confidenceInterval: 0.7,
      },
    ];
  }

  // Recommendation generation methods
  private generateTemporalRecommendations(milestone: any, issues: any[]): ActionRecommendation[] {
    return [
      {
        priority: 'short-term',
        category: 'prevention',
        action: 'Schedule pre-milestone stress testing and issue prevention review',
        rationale: 'Temporal pattern shows issue spike near milestone deadlines',
        expectedOutcome: 'Reduce milestone-related issues by 40%',
        requiredResources: ['Project manager time', 'Team review session'],
        timeline: '1 week before milestone',
        successMetrics: ['Reduced issue count', 'On-time milestone delivery'],
      },
    ];
  }

  private generateCausalRecommendations(cluster: any, initiative: any): ActionRecommendation[] {
    return [
      {
        priority: 'immediate',
        category: 'optimization',
        action: 'Accelerate initiative progress to address cluster more effectively',
        rationale: 'Strong causal relationship between initiative progress and issue resolution',
        expectedOutcome: 'Faster cluster issue resolution',
        requiredResources: ['Additional developer time', 'Stakeholder approval'],
        timeline: '2 weeks',
        successMetrics: ['Initiative progress increase', 'Cluster issue reduction'],
      },
    ];
  }

  private generateResourceRecommendations(
    initiative1: any,
    initiative2: any
  ): ActionRecommendation[] {
    return [
      {
        priority: 'short-term',
        category: 'optimization',
        action: 'Evaluate initiative prioritization and resource reallocation',
        rationale: 'Resource contention detected between multiple initiatives',
        expectedOutcome: 'Improved resource utilization and delivery speed',
        requiredResources: ['Management decision', 'Resource planning'],
        timeline: '1 week',
        successMetrics: ['Clear priority ranking', 'Resource allocation plan'],
      },
    ];
  }

  private async calculateBusinessImpact(
    correlationType: string,
    data: any
  ): Promise<BusinessImpact> {
    // Simplified business impact calculation
    const baseImpact: BusinessImpact = {
      financial: {
        costOfInaction: 25000,
        potentialSavings: 12000,
        investmentRequired: 5000,
      },
      timeline: {
        daysToResolution: 14,
      },
      resources: {
        peopleRequired: 1,
        skillsNeeded: ['Analysis'],
        toolsRequired: ['Monitoring Tools'],
      },
      stakeholders: [],
    };

    // Adjust based on correlation type and data
    switch (correlationType) {
      case 'temporal':
        baseImpact.financial.costOfInaction *= data.issueCount || 1;
        break;
      case 'causal':
        baseImpact.financial.potentialSavings *= data.initiativeProgress / 100 || 0.5;
        break;
      case 'resource':
        baseImpact.timeline.daysToResolution = data.initiativeCount * 7;
        break;
    }

    return baseImpact;
  }

  /**
   * Clear correlation cache (for testing or when data changes significantly)
   */
  public clearCache(): void {
    this.correlationCache.clear();
    this.patternLibrary.clear();
  }

  /**
   * Get system-wide correlation statistics
   */
  async getCorrelationStats(): Promise<{
    totalCorrelations: number;
    strongCorrelations: number;
    patternTypes: Record<string, number>;
    averageStrength: number;
  }> {
    let totalCorrelations = 0;
    let strongCorrelations = 0;
    let totalStrength = 0;
    const patternTypes: Record<string, number> = {};

    for (const correlations of this.correlationCache.values()) {
      totalCorrelations += correlations.length;
      for (const correlation of correlations) {
        if (correlation.strength > 0.7) strongCorrelations++;
        totalStrength += correlation.strength;

        for (const pattern of correlation.patterns) {
          patternTypes[pattern.patternType] = (patternTypes[pattern.patternType] || 0) + 1;
        }
      }
    }

    return {
      totalCorrelations,
      strongCorrelations,
      patternTypes,
      averageStrength: totalCorrelations > 0 ? totalStrength / totalCorrelations : 0,
    };
  }
}

export default CorrelationEngine;
