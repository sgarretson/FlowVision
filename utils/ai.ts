export type BusinessMetrics = {
  billableUtilization?: number; // 0..1
  avgProjectDurationDays?: number;
  [key: string]: unknown;
};

export type BusinessProfile = {
  industry: string;
  size: number;
  metrics: BusinessMetrics;
};

export function scoreDifficulty(description: string, profile: BusinessProfile): number {
  const text = description.toLowerCase();
  let score = 50;

  const hardKeywords = ['integration', 'migration', 'refactor', 'compliance', 'security'];
  const easyKeywords = ['ui', 'content', 'email', 'copy', 'docs'];

  for (const kw of hardKeywords) if (text.includes(kw)) score += 10;
  for (const kw of easyKeywords) if (text.includes(kw)) score -= 10;

  if (profile.size > 100) score += 5;
  if ((profile.metrics.billableUtilization ?? 0.7) > 0.8) score += 5;

  return Math.max(0, Math.min(100, score));
}

export function scoreROI(cost: number, gain: number): number {
  if (cost <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round(((gain - cost) / cost) * 100)));
}

export function scorePriority(difficulty: number, roi: number): number {
  // Higher ROI and lower difficulty => higher priority
  return Math.round(roi - difficulty / 2);
}
