/**
 * Enhanced Insights Types for Contextual Intelligence
 * FlowVision Phase 1 Enhancement - Team Consensus Implementation
 */

export interface Issue {
  id: string;
  description: string;
  votes: number;
  heatmapScore: number;
  department?: string;
  category?: string;
  clusterId?: string;
  cluster?: {
    name: string;
    severity: string;
  };
  createdAt: Date;
}

export interface Initiative {
  id: string;
  title: string;
  status: string;
  progress: number;
  priority?: number;
  roi?: number;
  difficulty?: number;
  budget?: number;
  timelineEnd?: Date;
  owner?: {
    id: string;
    name: string;
  };
  relatedIssues?: Issue[];
}

export interface ConfidenceReasoning {
  score: number; // 0-100
  reasoning: string[];
  dataQuality: 'high' | 'medium' | 'low';
  sampleSize: number;
  historicalAccuracy?: number;
  uncertaintyFactors?: string[];
}

export interface ActionStep {
  id: string;
  description: string;
  assignee?: string;
  dueDate?: Date;
  estimatedHours?: number;
  priority: 'immediate' | 'short-term' | 'long-term';
  dependencies?: string[];
  expectedOutcome: string;
  successMetrics: string[];
}

export interface BusinessImpact {
  financial: {
    costOfInaction: number;
    potentialSavings: number;
    investmentRequired: number;
  };
  timeline: {
    daysToResolution: number;
    criticalDeadline?: Date;
  };
  resources: {
    peopleRequired: number;
    skillsNeeded: string[];
    toolsRequired: string[];
  };
  stakeholders: {
    id: string;
    name: string;
    role: string;
    impactLevel: 'high' | 'medium' | 'low';
  }[];
}

export interface EnhancedInsight {
  id: string;
  type: 'strategic' | 'operational' | 'financial' | 'risk';
  title: string;
  summary: string;
  impact: 'high' | 'medium' | 'low';
  actionRequired: boolean;

  // Enhanced Context
  context: {
    relatedIssues: Issue[];
    relatedInitiatives: Initiative[];
    historicalPatterns: {
      pattern: string;
      frequency: number;
      lastOccurrence: Date;
      resolution: string;
    }[];
    stakeholders: {
      id: string;
      name: string;
      role: string;
      responsibility: string;
    }[];
    rootCauses: string[];
    contributingFactors: string[];
  };

  // Enhanced Confidence
  confidence: ConfidenceReasoning;

  // Enhanced Recommendations
  actionPlan: {
    immediate: ActionStep[];
    shortTerm: ActionStep[];
    longTerm: ActionStep[];
  };

  // Business Impact
  businessImpact: BusinessImpact;

  // Metadata
  generatedAt: Date;
  lastUpdated: Date;
  version: number;
}

export interface ContextualAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  category: 'timeline' | 'resource' | 'roi' | 'issue' | 'anomaly';
  title: string;
  description: string;

  // Enhanced Context
  context: {
    rootCause: string;
    triggeringEvents: {
      event: string;
      timestamp: Date;
      source: string;
    }[];
    impactRadius: {
      entityType: 'issue' | 'initiative' | 'cluster' | 'user';
      entityId: string;
      entityName: string;
      impactLevel: 'direct' | 'indirect' | 'potential';
    }[];
    precedingAlerts: {
      alertId: string;
      title: string;
      timestamp: Date;
      relationship: 'caused-by' | 'related-to' | 'escalation-of';
    }[];
    relatedEntities: {
      issues: Issue[];
      initiatives: Initiative[];
      users: { id: string; name: string; role: string }[];
    };
  };

  // Enhanced Recommendations
  recommendedActions: {
    immediate: ActionStep[];
    preventive: ActionStep[];
    escalation: {
      level: number;
      criteria: string;
      escalateTo: string;
      timeframe: string;
    }[];
  };

  // Business Impact
  businessImpact: BusinessImpact;

  // Enhanced Confidence
  confidence: ConfidenceReasoning;

  priority: number;
  createdAt: Date;
  relatedId?: string;
  relatedType?: 'initiative' | 'issue' | 'cluster';
}

export interface DrillDownContext {
  entityType: 'health-score' | 'alert' | 'insight' | 'roi' | 'utilization';
  entityId: string;
  relatedData: {
    issues: Issue[];
    initiatives: Initiative[];
    insights: EnhancedInsight[];
    alerts: ContextualAlert[];
    metrics: Record<string, number>;
    trends: {
      period: string;
      value: number;
      change: number;
    }[];
  };
  narrativeContext: {
    summary: string;
    keyFactors: string[];
    implications: string[];
    recommendations: string[];
  };
}
