import { describe, expect, it, vi } from 'vitest';
import { FeedbackNotFoundError } from '../domain/errors/feedback-not-found.error';
import type { FeedbackSubmissionView } from '../domain/feedback-submission';
import {
  DeleteFeedbackUseCase,
  GetFeedbackUseCase,
  UpdateFeedbackUseCase,
} from './admin-feedback.use-cases';
import { UnvoteFeedbackUseCase, VoteFeedbackUseCase } from './board.use-cases';
import type { FeedbackRepository } from './ports/feedback-repository.port';

function submission(overrides: Partial<FeedbackSubmissionView> = {}): FeedbackSubmissionView {
  return {
    id: 'f1',
    type: 'idea',
    title: null,
    message: 'hi',
    status: 'new',
    userId: 'u1',
    userEmail: 'u1@local.dev',
    locale: null,
    pageUrl: null,
    userAgent: null,
    isPublic: false,
    upvoteCount: 0,
    adminNotes: null,
    createdAt: '2026-07-19T00:00:00.000Z',
    updatedAt: '2026-07-19T00:00:00.000Z',
    ...overrides,
  };
}

function makeRepo(overrides: Partial<FeedbackRepository> = {}): FeedbackRepository {
  return {
    create: vi.fn(),
    list: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    listBoard: vi.fn(),
    addVote: vi.fn(),
    removeVote: vi.fn(),
    ...overrides,
  } as unknown as FeedbackRepository;
}

describe('GetFeedbackUseCase', () => {
  it('returns the submission when found', async () => {
    const repo = makeRepo({ getById: vi.fn().mockResolvedValue(submission()) });
    expect(await new GetFeedbackUseCase(repo).execute('f1')).toMatchObject({ id: 'f1' });
  });
  it('throws when missing', async () => {
    const repo = makeRepo({ getById: vi.fn().mockResolvedValue(null) });
    await expect(new GetFeedbackUseCase(repo).execute('nope')).rejects.toBeInstanceOf(
      FeedbackNotFoundError,
    );
  });
});

describe('UpdateFeedbackUseCase', () => {
  it('returns the updated submission', async () => {
    const repo = makeRepo({
      update: vi.fn().mockResolvedValue(submission({ status: 'planned' })),
    });
    expect(
      await new UpdateFeedbackUseCase(repo).execute('f1', { status: 'planned' }),
    ).toMatchObject({
      status: 'planned',
    });
  });
  it('throws when the row does not exist', async () => {
    const repo = makeRepo({ update: vi.fn().mockResolvedValue(null) });
    await expect(
      new UpdateFeedbackUseCase(repo).execute('nope', { isPublic: true }),
    ).rejects.toBeInstanceOf(FeedbackNotFoundError);
  });
});

describe('DeleteFeedbackUseCase', () => {
  it('deletes an existing submission', async () => {
    const repo = makeRepo({ getById: vi.fn().mockResolvedValue(submission()) });
    await new DeleteFeedbackUseCase(repo).execute('f1');
    expect(repo.delete).toHaveBeenCalledWith('f1');
  });
  it('throws when missing', async () => {
    const repo = makeRepo({ getById: vi.fn().mockResolvedValue(null) });
    await expect(new DeleteFeedbackUseCase(repo).execute('nope')).rejects.toBeInstanceOf(
      FeedbackNotFoundError,
    );
    expect(repo.delete).not.toHaveBeenCalled();
  });
});

describe('vote use-cases', () => {
  const boardItem = {
    id: 'f1',
    type: 'idea' as const,
    title: null,
    message: 'hi',
    status: 'planned' as const,
    upvoteCount: 1,
    hasVoted: true,
    createdAt: '2026-07-19T00:00:00.000Z',
  };

  it('votes and returns the refreshed item', async () => {
    const repo = makeRepo({ addVote: vi.fn().mockResolvedValue(boardItem) });
    expect(await new VoteFeedbackUseCase(repo).execute('f1', 'u1')).toMatchObject({
      hasVoted: true,
    });
  });

  it('throws when the item is not on the board', async () => {
    const repo = makeRepo({ addVote: vi.fn().mockResolvedValue(null) });
    await expect(new VoteFeedbackUseCase(repo).execute('f1', 'u1')).rejects.toBeInstanceOf(
      FeedbackNotFoundError,
    );
  });

  it('unvotes and returns the refreshed item', async () => {
    const repo = makeRepo({
      removeVote: vi.fn().mockResolvedValue({ ...boardItem, upvoteCount: 0, hasVoted: false }),
    });
    expect(await new UnvoteFeedbackUseCase(repo).execute('f1', 'u1')).toMatchObject({
      hasVoted: false,
    });
  });
});
