import { describe, expect, it } from 'vitest';
import { computeNpsAnalytics, computeNpsScore, type NpsScorePoint, npsBucket } from './nps';

describe('npsBucket', () => {
  it('classifies scores into promoter/passive/detractor', () => {
    expect(npsBucket(10)).toBe('promoter');
    expect(npsBucket(9)).toBe('promoter');
    expect(npsBucket(8)).toBe('passive');
    expect(npsBucket(7)).toBe('passive');
    expect(npsBucket(6)).toBe('detractor');
    expect(npsBucket(0)).toBe('detractor');
  });
});

describe('computeNpsScore', () => {
  it('returns 0 for an empty set', () => {
    expect(computeNpsScore([])).toBe(0);
  });

  it('is %promoters − %detractors, rounded', () => {
    // 2 promoters, 1 passive, 1 detractor over 4 → (50 − 25) = 25
    const points: NpsScorePoint[] = [
      { score: 10, createdAt: '2026-07-01T00:00:00.000Z' },
      { score: 9, createdAt: '2026-07-02T00:00:00.000Z' },
      { score: 8, createdAt: '2026-07-03T00:00:00.000Z' },
      { score: 3, createdAt: '2026-07-04T00:00:00.000Z' },
    ];
    expect(computeNpsScore(points)).toBe(25);
  });

  it('can be negative when detractors dominate', () => {
    expect(
      computeNpsScore([
        { score: 0, createdAt: '2026-07-01T00:00:00.000Z' },
        { score: 10, createdAt: '2026-07-02T00:00:00.000Z' },
      ]),
    ).toBe(0);
    expect(
      computeNpsScore([
        { score: 2, createdAt: '2026-07-01T00:00:00.000Z' },
        { score: 3, createdAt: '2026-07-02T00:00:00.000Z' },
        { score: 10, createdAt: '2026-07-03T00:00:00.000Z' },
      ]),
    ).toBe(-33);
  });
});

describe('computeNpsAnalytics', () => {
  it('aggregates totals, segment counts, and a per-month trend', () => {
    const points: NpsScorePoint[] = [
      { score: 10, createdAt: '2026-06-10T00:00:00.000Z' },
      { score: 6, createdAt: '2026-06-20T00:00:00.000Z' },
      { score: 9, createdAt: '2026-07-05T00:00:00.000Z' },
      { score: 7, createdAt: '2026-07-06T00:00:00.000Z' },
    ];
    const analytics = computeNpsAnalytics(points);
    expect(analytics.responseCount).toBe(4);
    expect(analytics.promoters).toBe(2);
    expect(analytics.passives).toBe(1);
    expect(analytics.detractors).toBe(1);
    expect(analytics.score).toBe(25);
    expect(analytics.trend).toEqual([
      { period: '2026-06', score: 0, responseCount: 2 },
      { period: '2026-07', score: 50, responseCount: 2 },
    ]);
  });

  it('returns an empty trend for no responses', () => {
    expect(computeNpsAnalytics([])).toEqual({
      score: 0,
      promoters: 0,
      passives: 0,
      detractors: 0,
      responseCount: 0,
      trend: [],
    });
  });
});
