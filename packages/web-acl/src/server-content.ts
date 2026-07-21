// Server-only reads for SSR page metadata and sitemaps. These run in the Astro frontmatter / endpoint
// routes (never the browser), so they take an explicit server-reachable `apiBaseUrl` (the compose service
// origin) and a plain `fetch` rather than the browser api-client. web-acl is the only UI-facing package
// allowed to name api-client, so the DTO types are sourced from here to keep the boundary intact (ADR 0037).
import type {
  CatalogueList,
  CollectionDetail,
  CollectionList,
  ContentDetail,
  ContentDetails,
  FaqEntry,
  FaqEntryList,
} from '@TheY2T/tmr-api-client';

/** Where the SSR request should reach the API, plus the locale overlay and (optional) session cookie. */
export interface ServerFetchContext {
  /** Server-reachable API origin (e.g. `http://api:3000`). No trailing slash required. */
  apiBaseUrl: string;
  /** Active locale — forwarded as `?locale=` so per-locale content overlays apply (ADR 0036). */
  locale?: string;
  /** Request cookie to forward, so gated/premium reads resolve the same as the rendered page. */
  cookie?: string;
}

/** A YouTube video embedded in the item, distilled for crawler-visible VideoObject JSON-LD. */
export interface ContentVideoMeta {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  uploadDate?: string;
}

/** The catalogue-item facts a page head needs: enough for `<title>`, description, OG image, and JSON-LD. */
export interface ContentMeta {
  slug: string;
  title: string;
  summary?: string;
  /** Absolute URL of the item's first image asset, for `og:image`. */
  imageUrl?: string;
  type: string;
  details?: ContentDetails;
  updatedAt?: string;
  /** True when premium content the viewer can't access — body/media withheld upstream. */
  locked?: boolean;
  /** YouTube embeds on the item, for VideoObject structured data. */
  videos?: ContentVideoMeta[];
}

/** The collection facts a page head needs. */
export interface CollectionMeta {
  slug: string;
  title: string;
  summary?: string;
}

/** A list-view card (slug + title + summary), cheap to enumerate for the LLM index. */
export interface ContentCard {
  slug: string;
  title: string;
  summary?: string;
}

/** A catalogue item with its prose, for the LLM full-content dump / markdown negotiation. */
export interface ContentFull {
  slug: string;
  title: string;
  summary?: string;
  details?: ContentDetails;
  /** The item's rendered-markdown prose. */
  body?: string;
}

/** A collection with its prose + outcomes, for the LLM full-content dump / markdown negotiation. */
export interface CollectionFull {
  slug: string;
  title: string;
  summary?: string;
  outcomes?: string[];
  body?: string;
}

function trimBase(apiBaseUrl: string): string {
  return apiBaseUrl.replace(/\/$/, '');
}

function withLocale(path: string, locale?: string): string {
  if (!locale) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}locale=${encodeURIComponent(locale)}`;
}

async function getJson<T>(url: string, cookie?: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: cookie ? { cookie } : undefined,
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    // API unreachable → the caller falls back to generic metadata rather than failing the render.
    return null;
  }
}

/** First image media asset URL, used as the social share image when the item has cover art. */
function firstImageUrl(detail: ContentDetail): string | undefined {
  return detail.media?.find((asset) => asset.kind === 'image')?.url;
}

/** Distill the item's YouTube embeds into VideoObject inputs (id/title/thumbnail cached at author time). */
function videoMeta(detail: ContentDetail): ContentVideoMeta[] {
  const videos: ContentVideoMeta[] = [];
  for (const embed of detail.embeds ?? []) {
    if (embed.tool !== 'youtube' || !embed.videoId) continue;
    videos.push({
      videoId: embed.videoId,
      title: embed.title ?? detail.title,
      thumbnailUrl: embed.thumbnailUrl ?? `https://i.ytimg.com/vi/${embed.videoId}/hqdefault.jpg`,
      uploadDate: embed.uploadDate,
    });
  }
  return videos;
}

/** Fetch a single catalogue item's head metadata by slug. Returns null when missing/unreachable. */
export async function fetchContentMeta(
  slug: string,
  ctx: ServerFetchContext,
): Promise<ContentMeta | null> {
  const url = `${trimBase(ctx.apiBaseUrl)}${withLocale(`/catalogue/items/${encodeURIComponent(slug)}`, ctx.locale)}`;
  const detail = await getJson<ContentDetail>(url, ctx.cookie);
  if (!detail?.slug) return null;
  return {
    slug: detail.slug,
    title: detail.title,
    summary: detail.summary,
    imageUrl: firstImageUrl(detail),
    type: detail.type,
    details: detail.details,
    updatedAt: detail.updatedAt,
    locked: detail.locked,
    videos: videoMeta(detail),
  };
}

/** Fetch a catalogue item's full prose (title/summary/details/bodyMdx) for LLM ingestion. */
export async function fetchContentFull(
  slug: string,
  ctx: ServerFetchContext,
): Promise<ContentFull | null> {
  const url = `${trimBase(ctx.apiBaseUrl)}${withLocale(`/catalogue/items/${encodeURIComponent(slug)}`, ctx.locale)}`;
  const detail = await getJson<ContentDetail>(url, ctx.cookie);
  if (!detail?.slug) return null;
  return {
    slug: detail.slug,
    title: detail.title,
    summary: detail.summary,
    details: detail.details,
    body: detail.bodyMdx,
  };
}

/** Fetch a collection's full prose (title/summary/outcomes/bodyMdx) for LLM ingestion. */
export async function fetchCollectionFull(
  slug: string,
  ctx: ServerFetchContext,
): Promise<CollectionFull | null> {
  const url = `${trimBase(ctx.apiBaseUrl)}${withLocale(`/collections/${encodeURIComponent(slug)}`, ctx.locale)}`;
  const detail = await getJson<CollectionDetail>(url, ctx.cookie);
  if (!detail?.slug) return null;
  return {
    slug: detail.slug,
    title: detail.title,
    summary: detail.summary,
    outcomes: detail.outcomes,
    body: detail.bodyMdx,
  };
}

/** Fetch a single collection's head metadata by slug. Returns null when missing/unreachable. */
export async function fetchCollectionMeta(
  slug: string,
  ctx: ServerFetchContext,
): Promise<CollectionMeta | null> {
  const url = `${trimBase(ctx.apiBaseUrl)}${withLocale(`/collections/${encodeURIComponent(slug)}`, ctx.locale)}`;
  const detail = await getJson<CollectionDetail>(url, ctx.cookie);
  if (!detail?.slug) return null;
  return { slug: detail.slug, title: detail.title, summary: detail.summary };
}

/** Every published catalogue slug, paged through the browse endpoint — for the catalogue sitemap. */
export async function listContentSlugs(
  ctx: Pick<ServerFetchContext, 'apiBaseUrl'>,
): Promise<string[]> {
  const base = trimBase(ctx.apiBaseUrl);
  const pageSize = 200;
  const slugs: string[] = [];
  for (let page = 1; page <= 100; page += 1) {
    const list = await getJson<CatalogueList>(
      `${base}/catalogue/items?page=${page}&pageSize=${pageSize}`,
    );
    const items = list?.items ?? [];
    for (const item of items) slugs.push(item.slug);
    const total = list?.total ?? slugs.length;
    if (items.length === 0 || slugs.length >= total) break;
  }
  return slugs;
}

/** Every published catalogue card (slug + title + summary), paged — for the LLM index. */
export async function listContentCards(
  ctx: Pick<ServerFetchContext, 'apiBaseUrl' | 'locale'>,
): Promise<ContentCard[]> {
  const base = trimBase(ctx.apiBaseUrl);
  const pageSize = 200;
  const cards: ContentCard[] = [];
  for (let page = 1; page <= 100; page += 1) {
    const list = await getJson<CatalogueList>(
      `${base}${withLocale(`/catalogue/items?page=${page}&pageSize=${pageSize}`, ctx.locale)}`,
    );
    const items = list?.items ?? [];
    for (const item of items)
      cards.push({ slug: item.slug, title: item.title, summary: item.summary });
    const total = list?.total ?? cards.length;
    if (items.length === 0 || cards.length >= total) break;
  }
  return cards;
}

/** Every published collection card (slug + title + summary) — for the LLM index. */
export async function listCollectionCards(
  ctx: Pick<ServerFetchContext, 'apiBaseUrl' | 'locale'>,
): Promise<ContentCard[]> {
  const list = await getJson<CollectionList>(
    `${trimBase(ctx.apiBaseUrl)}${withLocale('/collections', ctx.locale)}`,
  );
  return (list?.items ?? []).map((item) => ({
    slug: item.slug,
    title: item.title,
    summary: item.summary,
  }));
}

/** All FAQ entries (ordered by category then sort order) for SSR-rendering the /faq page so the
 *  question/answer text is crawler-visible. Empty when the flag is off or the API is unreachable. */
export async function fetchFaqEntries(ctx: ServerFetchContext): Promise<FaqEntry[]> {
  const url = `${trimBase(ctx.apiBaseUrl)}${withLocale('/faq-entries', ctx.locale)}`;
  const list = await getJson<FaqEntryList>(url, ctx.cookie);
  return list?.items ?? [];
}

/** Every published collection slug — for the collections sitemap. */
export async function listCollectionSlugs(
  ctx: Pick<ServerFetchContext, 'apiBaseUrl'>,
): Promise<string[]> {
  const list = await getJson<CollectionList>(`${trimBase(ctx.apiBaseUrl)}/collections`);
  return (list?.items ?? []).map((item) => item.slug);
}
