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

/** The catalogue-item facts a page head needs: enough for `<title>`, description, OG image, and JSON-LD. */
export interface ContentMeta {
  slug: string;
  title: string;
  summary?: string;
  /** Absolute (presigned) URL of the item's first image asset, for `og:image`. */
  imageUrl?: string;
  type: string;
  details?: ContentDetails;
  updatedAt?: string;
  /** True when premium content the viewer can't access — body/media withheld upstream. */
  locked?: boolean;
}

/** The collection facts a page head needs. */
export interface CollectionMeta {
  slug: string;
  title: string;
  summary?: string;
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

/** Every published collection slug — for the collections sitemap. */
export async function listCollectionSlugs(
  ctx: Pick<ServerFetchContext, 'apiBaseUrl'>,
): Promise<string[]> {
  const list = await getJson<CollectionList>(`${trimBase(ctx.apiBaseUrl)}/collections`);
  return (list?.items ?? []).map((item) => item.slug);
}
