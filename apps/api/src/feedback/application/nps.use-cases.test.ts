import { describe, expect, it, vi } from 'vitest';
import {
  DismissNpsUseCase,
  NPS_ACTIVATION_MIN_DAYS,
  NpsEligibilityUseCase,
  NpsScoreOutOfRangeError,
  SubmitNpsUseCase,
} from './nps.use-cases';
import type { NpsRepository } from './ports/nps-repository.port';

const NOW = new Date('2026-07-19T00:00:00.000Z');
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);

function makeRepo(overrides: Partial<NpsRepository> = {}): NpsRepository {
  return {
    getAccountCreatedAt: vi.fn().mockResolvedValue(daysAgo(200)),
    getPromptState: vi.fn().mockResolvedValue(null),
    markShown: vi.fn().mockResolvedValue(undefined),
    markDismissed: vi.fn().mockResolvedValue(undefined),
    recordResponse: vi.fn().mockResolvedValue(undefined),
    listResponses: vi.fn(),
    scorePointsInRange: vi.fn(),
    ...overrides,
  } as NpsRepository;
}

describe('NpsEligibilityUseCase', () => {
  it('is eligible for an activated learner with no prior prompt, and stamps last_shown', async () => {
    const repo = makeRepo();
    const eligible = await new NpsEligibilityUseCase(repo).execute('u1', [], NOW);
    expect(eligible).toBe(true);
    expect(repo.markShown).toHaveBeenCalledWith('u1');
  });

  it('excludes staff (admin/editor)', async () => {
    const repo = makeRepo();
    expect(await new NpsEligibilityUseCase(repo).execute('u1', ['admin'], NOW)).toBe(false);
    expect(await new NpsEligibilityUseCase(repo).execute('u1', ['editor'], NOW)).toBe(false);
    expect(repo.markShown).not.toHaveBeenCalled();
  });

  it('excludes accounts younger than the activation window', async () => {
    const repo = makeRepo({
      getAccountCreatedAt: vi.fn().mockResolvedValue(daysAgo(NPS_ACTIVATION_MIN_DAYS - 1)),
    });
    expect(await new NpsEligibilityUseCase(repo).execute('u1', [], NOW)).toBe(false);
  });

  it('holds off when the user responded recently', async () => {
    const repo = makeRepo({
      getPromptState: vi.fn().mockResolvedValue({
        lastShownAt: null,
        lastDismissedAt: null,
        lastRespondedAt: daysAgo(30),
      }),
    });
    expect(await new NpsEligibilityUseCase(repo).execute('u1', [], NOW)).toBe(false);
  });

  it('holds off when the user dismissed recently', async () => {
    const repo = makeRepo({
      getPromptState: vi.fn().mockResolvedValue({
        lastShownAt: null,
        lastDismissedAt: daysAgo(5),
        lastRespondedAt: null,
      }),
    });
    expect(await new NpsEligibilityUseCase(repo).execute('u1', [], NOW)).toBe(false);
  });

  it('holds off when shown within the re-prompt window', async () => {
    const repo = makeRepo({
      getPromptState: vi.fn().mockResolvedValue({
        lastShownAt: daysAgo(2),
        lastDismissedAt: null,
        lastRespondedAt: null,
      }),
    });
    expect(await new NpsEligibilityUseCase(repo).execute('u1', [], NOW)).toBe(false);
  });

  it('is eligible again once all cooldowns have elapsed', async () => {
    const repo = makeRepo({
      getPromptState: vi.fn().mockResolvedValue({
        lastShownAt: daysAgo(120),
        lastDismissedAt: daysAgo(120),
        lastRespondedAt: daysAgo(120),
      }),
    });
    expect(await new NpsEligibilityUseCase(repo).execute('u1', [], NOW)).toBe(true);
  });
});

describe('SubmitNpsUseCase', () => {
  it('records a valid response with a trimmed comment', async () => {
    const repo = makeRepo();
    await new SubmitNpsUseCase(repo).execute('u1', 9, '  loved it  ', 'dashboard');
    expect(repo.recordResponse).toHaveBeenCalledWith('u1', 9, 'loved it', 'dashboard');
  });

  it('nulls an empty comment', async () => {
    const repo = makeRepo();
    await new SubmitNpsUseCase(repo).execute('u1', 3, '   ', null);
    expect(repo.recordResponse).toHaveBeenCalledWith('u1', 3, null, null);
  });

  it.each([-1, 11, 5.5])('rejects out-of-range score %s', async (score) => {
    const repo = makeRepo();
    await expect(
      new SubmitNpsUseCase(repo).execute('u1', score, null, null),
    ).rejects.toBeInstanceOf(NpsScoreOutOfRangeError);
    expect(repo.recordResponse).not.toHaveBeenCalled();
  });
});

describe('DismissNpsUseCase', () => {
  it('marks the prompt dismissed', async () => {
    const repo = makeRepo();
    await new DismissNpsUseCase(repo).execute('u1');
    expect(repo.markDismissed).toHaveBeenCalledWith('u1');
  });
});
