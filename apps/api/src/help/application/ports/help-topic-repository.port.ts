import type { HelpTopicView, HelpTopicWriteData } from '../../domain/help-topic';

/** HelpTopicRepository (DDD) — persist/read the Info View glossary. */
export abstract class HelpTopicRepository {
  abstract findAll(): Promise<HelpTopicView[]>;
  abstract getBySlug(slug: string): Promise<HelpTopicView | null>;
  abstract exists(slug: string): Promise<boolean>;
  abstract create(data: HelpTopicWriteData): Promise<HelpTopicView>;
  abstract update(slug: string, data: HelpTopicWriteData): Promise<HelpTopicView>;
  abstract delete(slug: string): Promise<void>;
}
