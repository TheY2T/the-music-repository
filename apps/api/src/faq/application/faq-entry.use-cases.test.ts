import { describe, expect, it, vi } from 'vitest';
import type { ContentTranslations } from '../../translations/application/ports/content-translations.port';
import { FaqEntryNotFoundError } from '../domain/errors/faq-entry-not-found.error';
import { FaqEntrySlugConflictError } from '../domain/errors/faq-entry-slug-conflict.error';
import type { FaqEntryView } from '../domain/faq-entry';
import {
  CreateFaqEntryUseCase,
  DeleteFaqEntryUseCase,
  GetFaqEntryUseCase,
  ListFaqEntriesUseCase,
  UpdateFaqEntryUseCase,
} from './faq-entry.use-cases';
import type { FaqEntryRepository } from './ports/faq-entry-repository.port';

function entry(overrides: Partial<FaqEntryView> = {}): FaqEntryView {
  return {
    id: 'id-1',
    slug: 'is-it-free',
    question: 'Is it free?',
    answer: 'Yes.',
    category: 'Content & licensing',
    sortOrder: 0,
    ...overrides,
  };
}

function makeRepo(overrides: Partial<FaqEntryRepository> = {}): FaqEntryRepository {
  return {
    findAll: vi.fn(),
    getBySlug: vi.fn(),
    exists: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  } as FaqEntryRepository;
}

function makeTranslations(overrides: Partial<ContentTranslations> = {}): ContentTranslations {
  return {
    overlay: vi.fn().mockResolvedValue({}),
    overlayMany: vi.fn().mockResolvedValue(new Map()),
    ...overrides,
  } as unknown as ContentTranslations;
}

describe('ListFaqEntriesUseCase', () => {
  it('returns entries unchanged for the base locale', async () => {
    const entries = [entry(), entry({ id: 'id-2', slug: 'am-i-too-old' })];
    const repo = makeRepo({ findAll: vi.fn().mockResolvedValue(entries) });
    const translations = makeTranslations();
    const result = await new ListFaqEntriesUseCase(repo, translations).execute();
    expect(result).toEqual(entries);
    expect(translations.overlayMany).not.toHaveBeenCalled();
  });

  it('overlays per-locale question/answer when a locale is given', async () => {
    const repo = makeRepo({ findAll: vi.fn().mockResolvedValue([entry()]) });
    const translations = makeTranslations({
      overlayMany: vi
        .fn()
        .mockResolvedValue(new Map([['id-1', { question: 'Est-ce gratuit ?', answer: 'Oui.' }]])),
    });
    const results = await new ListFaqEntriesUseCase(repo, translations).execute('fr');
    const result = results[0];
    expect(result).toBeDefined();
    expect(result?.question).toBe('Est-ce gratuit ?');
    expect(result?.answer).toBe('Oui.');
    expect(result?.category).toBe('Content & licensing');
  });
});

describe('GetFaqEntryUseCase', () => {
  it('throws FaqEntryNotFoundError when the slug is unknown', async () => {
    const repo = makeRepo({ getBySlug: vi.fn().mockResolvedValue(null) });
    await expect(
      new GetFaqEntryUseCase(repo, makeTranslations()).execute('nope'),
    ).rejects.toBeInstanceOf(FaqEntryNotFoundError);
  });
});

describe('CreateFaqEntryUseCase', () => {
  it('throws FaqEntrySlugConflictError when the slug exists', async () => {
    const repo = makeRepo({ exists: vi.fn().mockResolvedValue(true) });
    await expect(
      new CreateFaqEntryUseCase(repo).execute({
        slug: 'is-it-free',
        question: 'Is it free?',
        answer: 'Yes.',
        category: 'Content & licensing',
        sortOrder: 0,
      }),
    ).rejects.toBeInstanceOf(FaqEntrySlugConflictError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('creates when the slug is free', async () => {
    const created = entry();
    const repo = makeRepo({
      exists: vi.fn().mockResolvedValue(false),
      create: vi.fn().mockResolvedValue(created),
    });
    const result = await new CreateFaqEntryUseCase(repo).execute({
      slug: created.slug,
      question: created.question,
      answer: created.answer,
      category: created.category,
      sortOrder: created.sortOrder,
    });
    expect(result).toEqual(created);
  });
});

describe('UpdateFaqEntryUseCase', () => {
  it('throws when updating a missing entry', async () => {
    const repo = makeRepo({ exists: vi.fn().mockResolvedValue(false) });
    await expect(
      new UpdateFaqEntryUseCase(repo).execute('nope', {
        slug: 'nope',
        question: 'q',
        answer: 'a',
        category: 'Getting started',
        sortOrder: 0,
      }),
    ).rejects.toBeInstanceOf(FaqEntryNotFoundError);
  });
});

describe('DeleteFaqEntryUseCase', () => {
  it('throws when deleting a missing entry', async () => {
    const repo = makeRepo({ exists: vi.fn().mockResolvedValue(false) });
    await expect(new DeleteFaqEntryUseCase(repo).execute('nope')).rejects.toBeInstanceOf(
      FaqEntryNotFoundError,
    );
    expect(repo.delete).not.toHaveBeenCalled();
  });
});
