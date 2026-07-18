import type {
  EntityTranslationRevisionView,
  EntityTranslationView,
  TranslationQuery,
  UpsertTranslationData,
} from '../../domain/entity-translation';

/**
 * EntityTranslationAuthoring (ADR 0012) — the write side of content translations: upsert drafts,
 * soft-delete/restore, publish, and revision history. Named for the capability, no `Port` suffix.
 */
export abstract class EntityTranslationAuthoring {
  abstract list(query: TranslationQuery): Promise<EntityTranslationView[]>;
  abstract getById(id: string): Promise<EntityTranslationView | null>;
  /** Create the `(entityType, entityId, locale, field)` row or edit its draft value. */
  abstract upsertDraft(data: UpsertTranslationData): Promise<EntityTranslationView>;
  abstract softDelete(id: string, editedBy?: string): Promise<EntityTranslationView | null>;
  abstract restore(id: string, editedBy?: string): Promise<EntityTranslationView | null>;
  abstract listRevisions(id: string): Promise<EntityTranslationRevisionView[]>;
  /** Copy draft→published for pending rows (of an entity, or all). Returns the number published. */
  abstract publish(entityType?: string, entityId?: string): Promise<number>;
}
