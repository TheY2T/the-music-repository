import { Injectable } from '@nestjs/common';
import { ContentTranslations } from '../../translations/application/ports/content-translations.port';
import type { TranslationOverlay } from '../../translations/domain/entity-translation';
import { FaqEntryNotFoundError } from '../domain/errors/faq-entry-not-found.error';
import { FaqEntrySlugConflictError } from '../domain/errors/faq-entry-slug-conflict.error';
import type { FaqEntryView, FaqEntryWriteData } from '../domain/faq-entry';
import { FaqEntryRepository } from './ports/faq-entry-repository.port';

/** Overlay published `question`/`answer` translations over a FAQ entry (absent field → base). */
function applyFaqOverlay(entry: FaqEntryView, overlay: TranslationOverlay): FaqEntryView {
  return {
    ...entry,
    question: overlay.question ?? entry.question,
    answer: overlay.answer ?? entry.answer,
  };
}

@Injectable()
export class ListFaqEntriesUseCase {
  constructor(
    private readonly repository: FaqEntryRepository,
    private readonly translations: ContentTranslations,
  ) {}
  async execute(locale?: string): Promise<FaqEntryView[]> {
    const entries = await this.repository.findAll();
    if (!locale || entries.length === 0) {
      return entries;
    }
    const overlays = await this.translations.overlayMany(
      'faq',
      entries.map((entry) => entry.id),
      locale,
    );
    return entries.map((entry) => applyFaqOverlay(entry, overlays.get(entry.id) ?? {}));
  }
}

@Injectable()
export class GetFaqEntryUseCase {
  constructor(
    private readonly repository: FaqEntryRepository,
    private readonly translations: ContentTranslations,
  ) {}
  async execute(slug: string, locale?: string): Promise<FaqEntryView> {
    const entry = await this.repository.getBySlug(slug);
    if (!entry) {
      throw new FaqEntryNotFoundError(slug);
    }
    if (!locale) {
      return entry;
    }
    return applyFaqOverlay(entry, await this.translations.overlay('faq', entry.id, locale));
  }
}

@Injectable()
export class CreateFaqEntryUseCase {
  constructor(private readonly repository: FaqEntryRepository) {}
  async execute(data: FaqEntryWriteData): Promise<FaqEntryView> {
    if (await this.repository.exists(data.slug)) {
      throw new FaqEntrySlugConflictError(data.slug);
    }
    return this.repository.create(data);
  }
}

@Injectable()
export class UpdateFaqEntryUseCase {
  constructor(private readonly repository: FaqEntryRepository) {}
  async execute(slug: string, data: FaqEntryWriteData): Promise<FaqEntryView> {
    if (!(await this.repository.exists(slug))) {
      throw new FaqEntryNotFoundError(slug);
    }
    return this.repository.update(slug, data);
  }
}

@Injectable()
export class DeleteFaqEntryUseCase {
  constructor(private readonly repository: FaqEntryRepository) {}
  async execute(slug: string): Promise<void> {
    if (!(await this.repository.exists(slug))) {
      throw new FaqEntryNotFoundError(slug);
    }
    await this.repository.delete(slug);
  }
}
