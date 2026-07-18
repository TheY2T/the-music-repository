/** A context-sensitive help topic (Info View). POJO, no framework/db imports. */
export interface HelpTopicView {
  /** The topic's id — used to key per-locale translations (ADR 0034). */
  id: string;
  slug: string;
  term: string;
  body: string;
  linkSlug?: string;
}

export interface HelpTopicWriteData {
  slug: string;
  term: string;
  body: string;
  linkSlug?: string | null;
}
