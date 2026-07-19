/** A frequently-asked-question entry shown on the public FAQ page. POJO, no framework/db imports. */
export interface FaqEntryView {
  /** The entry's id — used to key per-locale translations (ADR 0034). */
  id: string;
  slug: string;
  question: string;
  answer: string;
  category: string;
  /** Manual ordering within a category (ascending). */
  sortOrder: number;
}

export interface FaqEntryWriteData {
  slug: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
}
