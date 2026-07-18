import { describe, expect, it } from 'vitest';
import {
  answerCelebration,
  COMBO_THRESHOLDS,
  pointsForAnswer,
  starsForAccuracy,
} from './celebration-tiers';

describe('answerCelebration (Tier 1)', () => {
  it('awards a reward burst + points + chime for a correct answer', () => {
    const c = answerCelebration(true, 1);
    expect(c.burst).toBe('correct');
    expect(c.chime).toBe('reward');
    expect(c.scorePoints).toBe(10);
  });

  it('gives a non-punitive wrong cue with no points', () => {
    const c = answerCelebration(false, 0);
    expect(c.burst).toBe('wrong');
    expect(c.chime).toBe('wrong');
    expect(c.scorePoints).toBeNull();
    expect(c.comboMilestone).toBeNull();
  });

  it('flags a combo milestone only at the configured thresholds (Tier 2 hook)', () => {
    expect(answerCelebration(true, 4).comboMilestone).toBeNull();
    for (const threshold of COMBO_THRESHOLDS) {
      expect(answerCelebration(true, threshold).comboMilestone).toBe(threshold);
    }
  });
});

describe('pointsForAnswer', () => {
  it('gives a base of 10 and a capped combo bonus', () => {
    expect(pointsForAnswer(1)).toBe(10);
    expect(pointsForAnswer(2)).toBe(12);
    expect(pointsForAnswer(6)).toBe(20);
    expect(pointsForAnswer(50)).toBe(30); // capped
  });
});

describe('starsForAccuracy (Tier 3)', () => {
  it('maps accuracy to an honest 0–3 star rating', () => {
    expect(starsForAccuracy(1)).toBe(3);
    expect(starsForAccuracy(0.95)).toBe(3);
    expect(starsForAccuracy(0.9)).toBe(2);
    expect(starsForAccuracy(0.7)).toBe(1);
    expect(starsForAccuracy(0.5)).toBe(0);
  });
});
