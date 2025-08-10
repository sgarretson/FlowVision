import { scoreDifficulty, scoreROI, scorePriority } from '@/utils/ai';

describe('AI heuristics', () => {
  test('scores ROI correctly and clamps to [0,100]', () => {
    expect(scoreROI(100, 200)).toBe(100); // (200-100)/100 = 1 -> 100
    expect(scoreROI(100, 50)).toBe(0); // (50-100)/100 = -0.5 -> 0 after clamp
    expect(scoreROI(0, 999)).toBe(100); // guard: cost <= 0 -> 100
  });

  test('bounds difficulty between 0 and 100', () => {
    const score = scoreDifficulty('massive integration and security refactor', {
      industry: 'A&E',
      size: 200,
      metrics: { billableUtilization: 0.9 },
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('computes priority as roi - difficulty/2', () => {
    const p = scorePriority(40, 80);
    expect(p).toBe(60);
  });
});
