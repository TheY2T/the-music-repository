import { Injectable } from '@nestjs/common';
import { ContentTranslations } from '../../translations/application/ports/content-translations.port';
import type { TranslationOverlay } from '../../translations/domain/entity-translation';
import { HelpTopicNotFoundError } from '../domain/errors/help-topic-not-found.error';
import { HelpTopicSlugConflictError } from '../domain/errors/help-topic-slug-conflict.error';
import type { HelpTopicView, HelpTopicWriteData } from '../domain/help-topic';
import { HelpTopicRepository } from './ports/help-topic-repository.port';

/** Overlay published `term`/`body` translations over a help topic (absent field → base). */
function applyHelpOverlay(topic: HelpTopicView, overlay: TranslationOverlay): HelpTopicView {
  return { ...topic, term: overlay.term ?? topic.term, body: overlay.body ?? topic.body };
}

@Injectable()
export class ListHelpTopicsUseCase {
  constructor(
    private readonly repository: HelpTopicRepository,
    private readonly translations: ContentTranslations,
  ) {}
  async execute(locale?: string): Promise<HelpTopicView[]> {
    const topics = await this.repository.findAll();
    if (!locale || topics.length === 0) {
      return topics;
    }
    const overlays = await this.translations.overlayMany(
      'help',
      topics.map((topic) => topic.id),
      locale,
    );
    return topics.map((topic) => applyHelpOverlay(topic, overlays.get(topic.id) ?? {}));
  }
}

@Injectable()
export class GetHelpTopicUseCase {
  constructor(
    private readonly repository: HelpTopicRepository,
    private readonly translations: ContentTranslations,
  ) {}
  async execute(slug: string, locale?: string): Promise<HelpTopicView> {
    const topic = await this.repository.getBySlug(slug);
    if (!topic) {
      throw new HelpTopicNotFoundError(slug);
    }
    if (!locale) {
      return topic;
    }
    return applyHelpOverlay(topic, await this.translations.overlay('help', topic.id, locale));
  }
}

@Injectable()
export class CreateHelpTopicUseCase {
  constructor(private readonly repository: HelpTopicRepository) {}
  async execute(data: HelpTopicWriteData): Promise<HelpTopicView> {
    if (await this.repository.exists(data.slug)) {
      throw new HelpTopicSlugConflictError(data.slug);
    }
    return this.repository.create(data);
  }
}

@Injectable()
export class UpdateHelpTopicUseCase {
  constructor(private readonly repository: HelpTopicRepository) {}
  async execute(slug: string, data: HelpTopicWriteData): Promise<HelpTopicView> {
    if (!(await this.repository.exists(slug))) {
      throw new HelpTopicNotFoundError(slug);
    }
    return this.repository.update(slug, data);
  }
}

@Injectable()
export class DeleteHelpTopicUseCase {
  constructor(private readonly repository: HelpTopicRepository) {}
  async execute(slug: string): Promise<void> {
    if (!(await this.repository.exists(slug))) {
      throw new HelpTopicNotFoundError(slug);
    }
    await this.repository.delete(slug);
  }
}
