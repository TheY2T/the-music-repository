/**
 * YouTube URL helpers — the single, framework-free implementation shared by the API (author-time
 * enrichment), the seed build script, and the UI (admin inspector + read-side facade). Kept here in
 * content-serde because it is the one pure package every one of those consumers already imports.
 */

/** A YouTube video id is exactly 11 URL-safe base64 characters. */
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/** Ordered patterns capturing the id from each common YouTube URL form (host-anchored). */
const URL_PATTERNS: RegExp[] = [
  /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([A-Za-z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.|m\.)?youtube(?:-nocookie)?\.com\/watch\?(?:[^#]*&)?v=([A-Za-z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.|m\.)?youtube(?:-nocookie)?\.com\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/,
];

/**
 * Extract the 11-character video id from any common YouTube URL form — `youtu.be/<id>`,
 * `watch?v=<id>`, `/embed/<id>`, `/shorts/<id>`, `/live/<id>` — or from a bare id. Returns `null` when
 * the input carries no recognizable id.
 */
export function parseYouTubeId(input: string | undefined | null): string | null {
  if (!input) return null;
  const value = input.trim();
  if (VIDEO_ID.test(value)) return value;
  for (const pattern of URL_PATTERNS) {
    const match = pattern.exec(value);
    if (match?.[1]) return match[1];
  }
  return null;
}

/** Deterministic thumbnail URL for a video id — needs no API call. `hqdefault` always exists. */
export function youTubeThumbnailUrl(
  videoId: string,
  quality: 'hqdefault' | 'mqdefault' | 'maxresdefault' | 'sddefault' = 'hqdefault',
): string {
  return `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;
}
