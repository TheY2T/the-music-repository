import type { FaqEntryView, FaqEntryWriteData } from '../../domain/faq-entry';

/** FaqEntryRepository (DDD) — persist/read the FAQ entries. */
export abstract class FaqEntryRepository {
  abstract findAll(): Promise<FaqEntryView[]>;
  abstract getBySlug(slug: string): Promise<FaqEntryView | null>;
  abstract exists(slug: string): Promise<boolean>;
  abstract create(data: FaqEntryWriteData): Promise<FaqEntryView>;
  abstract update(slug: string, data: FaqEntryWriteData): Promise<FaqEntryView>;
  abstract delete(slug: string): Promise<void>;
}
