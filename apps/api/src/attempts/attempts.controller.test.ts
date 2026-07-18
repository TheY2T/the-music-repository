import { describe, expect, it, vi } from 'vitest';
import type { CurrentUser } from '../auth/application/current-user';
import { defaultReviewState } from '../reviews/domain/sm2';
import type {
  GetDeckMasteryUseCase,
  GetDrillStatsUseCase,
} from './application/drill-stats.use-cases';
import type { RecordDrillAttemptUseCase } from './application/record-drill-attempt.use-case';
import { AttemptsController } from './attempts.controller';
import type { RecordDrillAttemptDto } from './dto/attempts.dto';

function build() {
  const currentUser = { require: vi.fn().mockReturnValue({ id: 'user-1' }) };
  const state = defaultReviewState(new Date('2026-07-18T00:00:00.000Z'));
  const recordAttempt = {
    execute: vi.fn().mockResolvedValue({ state, quality: 5, isPersonalBest: true }),
  };
  const getStats = {
    execute: vi.fn().mockResolvedValue({ skills: [], streakDays: 3, attemptsToday: 2 }),
  };
  const getDeckMastery = { execute: vi.fn() };
  const controller = new AttemptsController(
    currentUser as unknown as CurrentUser,
    recordAttempt as unknown as RecordDrillAttemptUseCase,
    getStats as unknown as GetDrillStatsUseCase,
    getDeckMastery as unknown as GetDeckMasteryUseCase,
  );
  return { controller, recordAttempt, getStats, getDeckMastery };
}

describe('AttemptsController', () => {
  it('forwards the attempt to the use-case and serializes the state to the wire shape', async () => {
    const { controller, recordAttempt } = build();
    const body = {
      deck: 'intervals',
      card: '7',
      modality: 'ear-identify',
      accuracy: 1,
      correct: true,
      responseMs: 900,
    } as RecordDrillAttemptDto;

    const result = await controller.record(body);

    expect(recordAttempt.execute).toHaveBeenCalledWith('user-1', {
      deck: 'intervals',
      card: '7',
      modality: 'ear-identify',
      accuracy: 1,
      correct: true,
      responseMs: 900,
    });
    expect(result.quality).toBe(5);
    expect(result.isPersonalBest).toBe(true);
    expect(result.state.card).toBe('7');
    expect(typeof result.state.dueAt).toBe('string'); // ISO-serialized for the wire
  });

  it('returns the per-user stats summary', async () => {
    const { controller } = build();
    expect(await controller.stats()).toEqual({ skills: [], streakDays: 3, attemptsToday: 2 });
  });
});
