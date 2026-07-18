/**
 * Localization domain types (ADR 0034). Framework-free POJOs — no Nest/Drizzle imports.
 * A "message" is one localized UI string, addressed by `(locale, key)`, with a draft/published pair.
 */

/** An admin-table view of one message row. */
export interface UiMessageView {
  id: string;
  locale: string;
  key: string;
  draftValue?: string;
  publishedValue?: string;
  status: string; // draft | published
  seeded: boolean;
  deleted: boolean;
  updatedAt: string;
  updatedBy?: string;
}

/** One entry in a message's change history. */
export interface UiMessageRevisionView {
  id: string;
  action: string; // create | update | delete | restore | publish
  value?: string;
  editedBy?: string;
  editedAt: string;
}

/** A locale's fully-assembled published catalogue + its version tag. */
export interface CatalogueSnapshot {
  version: string;
  locale: string;
  messages: Record<string, string>;
}

/** Filters for the admin message list. */
export interface UiMessageQuery {
  search?: string;
  locale?: string;
  status?: string;
  includeDeleted?: boolean;
}

/** A new message string authored in the CMS. */
export interface UiMessageCreateData {
  locale: string;
  key: string;
  value: string;
  editedBy?: string;
}
