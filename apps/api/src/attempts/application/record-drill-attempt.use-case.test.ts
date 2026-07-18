import { describe, expect, it, vi } from 'vitest';
import type { GradeCardUseCase } from '../../reviews/application/review.use-cases';
import { defaultReviewState } from '../../reviews/domain/sm2';
import type { AttemptLog } from './ports/attempt-log';
import { RecordDrillAttemptUseCase } from './record-drill-attempt.use-case';

function build() {
  const state = defaultReviewState(new Date());
  const attempts = {
    record: vi.fn().mockResolvedValue(undefined),
    listDeck: vi.fn().mockResolvedValue([]),
    listAll: vi.fn(),
    activityDateKeys: vi.fn(),
    attemptsToday: vi.fn(),
  };
  const gradeCard = { execute: vi.fn().mockResolvedValue(state) };
  const useCase = new RecordDrillAttemptUseCase(
    attempts as unknown as AttemptLog,
    gradeCard as unknown as GradeCardUseCase,
  );
  return { useCase, attempts, gradeCard, state };
}

const base = { deck: 'intervals', card: '7', modality: 'ear-identify' as const };

describe('RecordDrillAttemptUseCase', () => {
  it('persists the attempt and delegates SM-2 with a mapped quality (correct → 4/5)', async () => {
    const { useCase, attempts, gradeCard } = build();
    await useCase.execute('user-1', { ...base, accuracy: 1, correct: true, responseMs: 1000 });

    expect(attempts.record).toHaveBeenCalledWith(
      'user-1',
      expect.any(Date),
      expect.objectContaining(base),
    );
    // 1000ms < the 4000ms budget → Easy (5).
    expect(gradeCard.execute).toHaveBeenCalledWith('user-1', 'intervals', '7', 5);
  });

  it('maps a miss to a lapse quality of 2', async () => {
    const { useCase, gradeCard } = build();
    await useCase.execute('user-1', { ...base, accuracy: 0, correct: false });
    expect(gradeCard.execute).toHaveBeenCalledWith('user-1', 'intervals', '7', 2);
  });

  it('records exactly once and does not itself log a review (no double-write)', async () => {
    const { useCase, attempts, gradeCard } = build();
    await useCase.execute('user-1', { ...base, accuracy: 1, correct: true });
    // Streak logging is the reviews context's job (via GradeCardUseCase.recordReview), reached once.
    expect(attempts.record).toHaveBeenCalledTimes(1);
    expect(gradeCard.execute).toHaveBeenCalledTimes(1);
  });

  it('does not flag a personal best without enough history', async () => {
    const { useCase, attempts } = build();
    attempts.listDeck.mockResolvedValue([{ deck: 'intervals', accuracy: 1, correct: true }]);
    const result = await useCase.execute('user-1', { ...base, accuracy: 1, correct: true });
    expect(result.isPersonalBest).toBe(false);
    expect(result.quality).toBe(4);
  });

  it('flags a personal best when rolling mastery reaches a new peak', async () => {
    const { useCase, attempts } = build();
    // A run of misses then a recovery — the latest EWMA exceeds every prior peak.
    attempts.listDeck.mockResolvedValue([
      { deck: 'intervals', accuracy: 0, correct: false },
      { deck: 'intervals', accuracy: 0, correct: false },
      { deck: 'intervals', accuracy: 1, correct: true },
      { deck: 'intervals', accuracy: 1, correct: true },
    ]);
    const result = await useCase.execute('user-1', { ...base, accuracy: 1, correct: true });
    expect(result.isPersonalBest).toBe(true);
  });

  it('reports the deck level and flags a level-up when mastery crosses a tier', async () => {
    const { useCase, attempts } = build();
    // Before this attempt: two correct (mastery 1.0 → expert already). No level-up.
    attempts.listDeck.mockResolvedValue([
      { deck: 'intervals', accuracy: 1, correct: true },
      { deck: 'intervals', accuracy: 1, correct: true },
    ]);
    const steady = await useCase.execute('user-1', { ...base, accuracy: 1, correct: true });
    expect(steady.level).toBe('expert');
    expect(steady.leveledUp).toBe(false);

    // A climbing run: the EWMA crosses the 0.7 (intermediate) threshold on the final attempt.
    attempts.listDeck.mockResolvedValue([
      { deck: 'intervals', accuracy: 0, correct: false },
      { deck: 'intervals', accuracy: 0, correct: false },
      { deck: 'intervals', accuracy: 1, correct: true },
      { deck: 'intervals', accuracy: 1, correct: true },
      { deck: 'intervals', accuracy: 1, correct: true },
      { deck: 'intervals', accuracy: 1, correct: true },
    ]);
    const climbing = await useCase.execute('user-1', { ...base, accuracy: 1, correct: true });
    expect(climbing.leveledUp).toBe(true);
  });
});
