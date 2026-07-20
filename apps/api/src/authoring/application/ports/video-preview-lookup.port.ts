/** Resolved preview metadata for an external video. */
export interface VideoPreview {
  videoId: string;
  title?: string;
  author?: string;
  thumbnailUrl: string;
}

/**
 * VideoPreviewLookup — the CMS's requirement: resolve a video's title + thumbnail from its URL so an
 * embed can show a real preview. Named for the capability, no `Port` suffix (ADR 0012). Implementations
 * return `null` when the URL yields no usable preview (offline, private, or unknown video) — callers
 * fall back to a deterministic thumbnail so authoring never blocks on a third party.
 */
export abstract class VideoPreviewLookup {
  abstract lookup(url: string): Promise<VideoPreview | null>;
}
