/**
 * Content-translation domain types (ADR 0034, Phase 2). Framework-free POJOs. A translation is one
 * localized value of a content *field*, addressed by `(entityType, entityId, locale, field)`.
 */

export type EntityType = 'content' | 'collection' | 'help';

/** A field→value map of published translations for one entity+locale (the read-time overlay). */
export type TranslationOverlay = Record<string, string>;

export interface EntityTranslationView {
  id: string;
  entityType: string;
  entityId: string;
  locale: string;
  field: string;
  draftValue?: string;
  publishedValue?: string;
  status: string; // draft | published
  deleted: boolean;
  updatedAt: string;
  updatedBy?: string;
}

export interface EntityTranslationRevisionView {
  id: string;
  action: string; // create | update | delete | restore
  value?: string;
  editedBy?: string;
  editedAt: string;
}

export interface UpsertTranslationData {
  entityType: string;
  entityId: string;
  locale: string;
  field: string;
  value: string;
  editedBy?: string;
}

export interface TranslationQuery {
  entityType?: string;
  entityId?: string;
  locale?: string;
  includeDeleted?: boolean;
}
