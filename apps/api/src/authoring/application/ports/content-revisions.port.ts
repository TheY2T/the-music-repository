/** One saved snapshot's list row. */
export interface ContentRevisionRow {
  id: string;
  title: string;
  authorId?: string;
  createdAt: string;
}

/**
 * ContentRevisions — the authoring capability to snapshot + restore content versions (ADR 0030). A
 * snapshot captures the item's current editable state on publish; restore lifts a snapshot back onto the
 * item. Named for the capability, no `Port` suffix (ADR 0012).
 */
export abstract class ContentRevisions {
  /** Snapshot the content item's current state as a new revision (no-op if the item is missing). */
  abstract snapshot(slug: string, authorId: string | null): Promise<void>;
  /** List the item's revisions, newest first. */
  abstract list(slug: string): Promise<ContentRevisionRow[]>;
  /** Restore a revision's snapshot onto the content item; throws if the revision/item is missing. */
  abstract restore(slug: string, revisionId: string): Promise<void>;
}
