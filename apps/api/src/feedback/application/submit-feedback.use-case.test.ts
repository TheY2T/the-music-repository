import { describe, expect, it, vi } from 'vitest';
import { FeedbackTypeNotAllowedError } from '../domain/errors/feedback-type-not-allowed.error';
import type { FeedbackRepository } from './ports/feedback-repository.port';
import { SubmitFeedbackUseCase } from './submit-feedback.use-case';

function makeRepo(): FeedbackRepository {
  return {
    create: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'f1', ...data })),
    list: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    listBoard: vi.fn(),
    addVote: vi.fn(),
    removeVote: vi.fn(),
  } as unknown as FeedbackRepository;
}

const ctx = { userId: 'u1', locale: 'en', bugReportsEnabled: true };

describe('SubmitFeedbackUseCase', () => {
  it('trims message/title and stamps the acting user', async () => {
    const repo = makeRepo();
    await new SubmitFeedbackUseCase(repo).execute(
      { type: 'idea', title: '  Add dark mode  ', message: '  please  ' },
      ctx,
    );
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'idea',
        title: 'Add dark mode',
        message: 'please',
        userId: 'u1',
      }),
    );
  });

  it('nulls an empty title', async () => {
    const repo = makeRepo();
    await new SubmitFeedbackUseCase(repo).execute(
      { type: 'praise', title: '   ', message: 'nice' },
      ctx,
    );
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ title: null }));
  });

  it('captures page/user-agent context only for bug reports', async () => {
    const repo = makeRepo();
    const usecase = new SubmitFeedbackUseCase(repo);
    await usecase.execute(
      { type: 'bug', message: 'broken', pageUrl: '/tools/keyboard', userAgent: 'UA' },
      ctx,
    );
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ pageUrl: '/tools/keyboard', userAgent: 'UA' }),
    );
    (repo.create as ReturnType<typeof vi.fn>).mockClear();
    await usecase.execute({ type: 'idea', message: 'x', pageUrl: '/p', userAgent: 'UA' }, ctx);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ pageUrl: null, userAgent: null }),
    );
  });

  it('rejects a bug submission when bug reports are disabled', async () => {
    const repo = makeRepo();
    await expect(
      new SubmitFeedbackUseCase(repo).execute(
        { type: 'bug', message: 'broken' },
        { ...ctx, bugReportsEnabled: false },
      ),
    ).rejects.toBeInstanceOf(FeedbackTypeNotAllowedError);
    expect(repo.create).not.toHaveBeenCalled();
  });
});
