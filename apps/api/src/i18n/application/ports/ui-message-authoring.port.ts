import type {
  UiMessageCreateData,
  UiMessageQuery,
  UiMessageRevisionView,
  UiMessageView,
} from '../../domain/ui-message';

/**
 * UiMessageAuthoring (ADR 0012) — the write side of localization: draft CRUD, soft-delete/restore,
 * publish, and revision history for UI message strings. Named for the capability, no `Port` suffix.
 */
export abstract class UiMessageAuthoring {
  abstract list(query: UiMessageQuery): Promise<UiMessageView[]>;
  abstract getById(id: string): Promise<UiMessageView | null>;
  abstract existsKey(locale: string, key: string): Promise<boolean>;
  abstract create(data: UiMessageCreateData): Promise<UiMessageView>;
  /** Edit the draft value; returns null when no live (non-deleted) row exists for `id`. */
  abstract updateDraft(id: string, value: string, editedBy?: string): Promise<UiMessageView | null>;
  /** Soft-delete; returns null when the row is absent. */
  abstract softDelete(id: string, editedBy?: string): Promise<UiMessageView | null>;
  abstract restore(id: string, editedBy?: string): Promise<UiMessageView | null>;
  abstract listRevisions(id: string): Promise<UiMessageRevisionView[]>;
  abstract restoreRevision(
    id: string,
    revisionId: string,
    editedBy?: string,
  ): Promise<UiMessageView | null>;
  /**
   * Publish pending drafts (one locale, or all when `locale` is undefined): copy draft→published for
   * live rows, drop published values for soft-deleted rows, bump each affected locale's version.
   * Returns the new version tag for every locale.
   */
  abstract publish(locale: string | undefined, editedBy?: string): Promise<Record<string, string>>;
}
