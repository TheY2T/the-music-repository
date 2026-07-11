/** A context-sensitive help topic (Info View). POJO, no framework/db imports. */
export interface HelpTopicView {
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
