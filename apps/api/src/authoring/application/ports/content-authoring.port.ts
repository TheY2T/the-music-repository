/** Write-side data for a content item (taxonomy given as slug arrays). */
export interface ContentWriteData {
  slug: string;
  title: string;
  summary?: string | null;
  bodyMdx?: string | null;
  type: string;
  visibility?: string;
  difficulty?: number | null;
  source?: string | null;
  attribution?: string | null;
  license?: string | null;
  genres: string[];
  instruments: string[];
  topics: string[];
  tags: string[];
}

/** Admin list row (any status). */
export interface ContentAdminRow {
  slug: string;
  title: string;
  type: string;
  status: string;
  visibility: string;
  difficulty?: number;
  updatedAt: string;
}

export interface MediaRowInput {
  kind: string;
  filename: string;
  mime: string;
  storageKey: string;
  license?: string | null;
  attribution?: string | null;
}

/**
 * ContentAuthoring — the CMS's requirement: persist and manage content items (writes + admin
 * listing). Reads for display go through the catalogue `ContentRepository`. Named for the capability,
 * no `Port` suffix (ADR 0012).
 */
export abstract class ContentAuthoring {
  abstract listAll(): Promise<ContentAdminRow[]>;
  abstract exists(slug: string): Promise<boolean>;
  abstract create(data: ContentWriteData): Promise<void>;
  abstract update(slug: string, data: ContentWriteData): Promise<void>;
  abstract setStatus(slug: string, status: string): Promise<void>;
  abstract delete(slug: string): Promise<void>;
  /** Insert a media row; returns the new media id. */
  abstract addMedia(slug: string, media: MediaRowInput): Promise<string>;
}
