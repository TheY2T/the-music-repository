import { describe, expect, it, vi } from 'vitest';
import { LocaleConflictError } from '../domain/errors/locale-conflict.error';
import { UiMessageKeyConflictError } from '../domain/errors/ui-message-key-conflict.error';
import { UiMessageNotFoundError } from '../domain/errors/ui-message-not-found.error';
import type { UiMessageView } from '../domain/ui-message';
import type { LocaleRegistry } from './ports/locale-registry.port';
import type { UiMessageAuthoring } from './ports/ui-message-authoring.port';
import type { UiMessageCatalogue } from './ports/ui-message-catalogue.port';
import {
  CreateLocaleUseCase,
  CreateUiMessageUseCase,
  DeleteUiMessageUseCase,
  GetLocaleCatalogueUseCase,
  ImportUiMessagesUseCase,
  PublishUiMessagesUseCase,
  RestoreUiMessageUseCase,
  UpdateUiMessageUseCase,
} from './ui-message.use-cases';

const ROW: UiMessageView = {
  id: 'id-1',
  locale: 'en',
  key: 'nav.catalogue',
  draftValue: 'Catalogue',
  publishedValue: 'Catalogue',
  status: 'published',
  seeded: true,
  deleted: false,
  updatedAt: '2026-07-18T00:00:00.000Z',
};

function authoringMock(overrides: Partial<Record<keyof UiMessageAuthoring, unknown>> = {}) {
  return {
    list: vi.fn(),
    getById: vi.fn().mockResolvedValue(ROW),
    existsKey: vi.fn().mockResolvedValue(false),
    create: vi.fn().mockResolvedValue(ROW),
    updateDraft: vi.fn().mockResolvedValue(ROW),
    softDelete: vi.fn().mockResolvedValue(ROW),
    restore: vi.fn().mockResolvedValue(ROW),
    listRevisions: vi.fn().mockResolvedValue([]),
    restoreRevision: vi.fn().mockResolvedValue(ROW),
    publish: vi.fn().mockResolvedValue({ en: '123' }),
    importMany: vi.fn().mockResolvedValue(0),
    ...overrides,
  } as unknown as UiMessageAuthoring;
}

describe('CreateUiMessageUseCase', () => {
  it('throws a conflict when the key already exists for the locale', async () => {
    const authoring = authoringMock({ existsKey: vi.fn().mockResolvedValue(true) });
    const useCase = new CreateUiMessageUseCase(authoring);
    await expect(
      useCase.execute({ locale: 'en', key: 'nav.catalogue', value: 'x' }),
    ).rejects.toBeInstanceOf(UiMessageKeyConflictError);
    expect(authoring.create).not.toHaveBeenCalled();
  });

  it('creates when the key is free', async () => {
    const authoring = authoringMock();
    await new CreateUiMessageUseCase(authoring).execute({
      locale: 'en',
      key: 'new.key',
      value: 'v',
    });
    expect(authoring.create).toHaveBeenCalledWith({ locale: 'en', key: 'new.key', value: 'v' });
  });
});

describe('UpdateUiMessageUseCase', () => {
  it('throws not-found when the row is missing (or deleted)', async () => {
    const authoring = authoringMock({ updateDraft: vi.fn().mockResolvedValue(null) });
    await expect(new UpdateUiMessageUseCase(authoring).execute('id-x', 'v')).rejects.toBeInstanceOf(
      UiMessageNotFoundError,
    );
  });

  it('returns the updated row on success', async () => {
    const authoring = authoringMock();
    const result = await new UpdateUiMessageUseCase(authoring).execute('id-1', 'v', 'editor-1');
    expect(authoring.updateDraft).toHaveBeenCalledWith('id-1', 'v', 'editor-1');
    expect(result).toBe(ROW);
  });
});

describe('DeleteUiMessageUseCase', () => {
  it('throws not-found when nothing was deleted', async () => {
    const authoring = authoringMock({ softDelete: vi.fn().mockResolvedValue(null) });
    await expect(new DeleteUiMessageUseCase(authoring).execute('id-x')).rejects.toBeInstanceOf(
      UiMessageNotFoundError,
    );
  });
});

describe('RestoreUiMessageUseCase', () => {
  it('throws not-found when nothing was restored', async () => {
    const authoring = authoringMock({ restore: vi.fn().mockResolvedValue(null) });
    await expect(new RestoreUiMessageUseCase(authoring).execute('id-x')).rejects.toBeInstanceOf(
      UiMessageNotFoundError,
    );
  });
});

describe('PublishUiMessagesUseCase', () => {
  it('delegates to the port and returns the version map', async () => {
    const authoring = authoringMock();
    const versions = await new PublishUiMessagesUseCase(authoring).execute('en', 'editor-1');
    expect(authoring.publish).toHaveBeenCalledWith('en', 'editor-1');
    expect(versions).toEqual({ en: '123' });
  });
});

describe('GetLocaleCatalogueUseCase', () => {
  it('returns the assembled snapshot from the catalogue port', async () => {
    const snapshot = { version: '1', locale: 'en', messages: { 'nav.catalogue': 'Catalogue' } };
    const catalogue = {
      snapshot: vi.fn().mockResolvedValue(snapshot),
      versions: vi.fn(),
    } as unknown as UiMessageCatalogue;
    const result = await new GetLocaleCatalogueUseCase(catalogue).execute('en');
    expect(result).toBe(snapshot);
  });
});

function registryMock(overrides: Partial<Record<keyof LocaleRegistry, unknown>> = {}) {
  return {
    list: vi.fn().mockResolvedValue([]),
    exists: vi.fn().mockResolvedValue(false),
    create: vi.fn().mockResolvedValue({ code: 'fr', label: 'Français' }),
    ensure: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as LocaleRegistry;
}

describe('CreateLocaleUseCase', () => {
  it('throws a conflict when the locale already exists', async () => {
    const registry = registryMock({ exists: vi.fn().mockResolvedValue(true) });
    await expect(new CreateLocaleUseCase(registry).execute('en', 'English')).rejects.toBeInstanceOf(
      LocaleConflictError,
    );
    expect(registry.create).not.toHaveBeenCalled();
  });

  it('registers a free locale code', async () => {
    const registry = registryMock();
    await new CreateLocaleUseCase(registry).execute('fr', 'Français');
    expect(registry.create).toHaveBeenCalledWith('fr', 'Français');
  });
});

describe('ImportUiMessagesUseCase', () => {
  it('auto-registers the locale, then bulk-imports the entries', async () => {
    const authoring = authoringMock({ importMany: vi.fn().mockResolvedValue(2) });
    const registry = registryMock();
    const count = await new ImportUiMessagesUseCase(authoring, registry).execute(
      'fr',
      { a: '1', b: '2' },
      'editor-1',
      'Français',
    );
    expect(registry.ensure).toHaveBeenCalledWith('fr', 'Français');
    expect(authoring.importMany).toHaveBeenCalledWith('fr', { a: '1', b: '2' }, 'editor-1');
    expect(count).toBe(2);
  });
});
