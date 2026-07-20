/**
 * Gathers the live content behind `/llms.txt`, `/llms-full.txt`, and the per-page `Accept: text/markdown`
 * negotiation. Uses the server-side content fetchers (`@TheY2T/tmr-web-acl/server-content`) + the tool/flag
 * enumeration already used by the sitemaps. The root llms files are single base-locale (English) documents,
 * matching the catalogue-list/sitemap i18n convention.
 */
import { DEFAULT_LOCALE, type MessageKey, t } from '@TheY2T/tmr-i18n';
import type { Flags } from '@TheY2T/tmr-web-acl';
import {
  fetchCollectionFull,
  fetchContentFull,
  fetchFaqEntries,
  listCollectionCards,
  listContentCards,
} from '@TheY2T/tmr-web-acl/server-content';
import { apiBaseUrl } from './api-base';
import {
  type LlmsFullSection,
  type LlmsItem,
  type LlmsLink,
  type LlmsSection,
  renderItemMarkdown,
} from './llms';
import { enabledToolPaths } from './sitemap';

const LOCALE = DEFAULT_LOCALE;

interface LlmsLocals {
  flags: Flags;
  flagSnapshot: Record<string, boolean>;
}

/** Translate a (possibly-dynamic) key, falling back when it isn't defined (t returns the key itself). */
function tr(key: string, fallback = ''): string {
  const value = t(LOCALE, key as MessageKey);
  return value === key ? fallback : value;
}

function humanize(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function toolLinks(flagSnapshot: Record<string, boolean>): LlmsLink[] {
  return enabledToolPaths(flagSnapshot).map(({ path }) => {
    const slug = path.slice('/tools/'.length);
    return {
      title: tr(`tool.${slug}.title`, humanize(slug)),
      path,
      description: tr(`tool.${slug}.summary`),
    };
  });
}

interface PageDef {
  title: string;
  path: string;
  descKey?: string;
  when?: (flags: Flags) => boolean;
}

const MAIN_PAGES: PageDef[] = [
  { title: 'Home', path: '/', descKey: 'seo.home.description' },
  { title: 'Browse the catalogue', path: '/catalogue', descKey: 'seo.catalogue.description' },
  {
    title: 'Collections',
    path: '/collections',
    descKey: 'seo.collections.description',
    when: (f) => f.collections,
  },
  { title: 'Tools', path: '/tools', descKey: 'seo.tools.description' },
  { title: 'FAQ', path: '/faq', descKey: 'seo.faq.description', when: (f) => f.faq },
  { title: 'About', path: '/about', descKey: 'seo.about.description' },
  { title: 'Support', path: '/support', when: (f) => f.support },
];

const OPTIONAL_PAGES: PageDef[] = [
  { title: 'Feedback', path: '/feedback', when: (f) => f.feedbackForm },
  { title: 'Roadmap & ideas', path: '/roadmap', when: (f) => f.feedbackBoard },
  { title: 'Privacy Policy', path: '/privacy' },
  { title: 'Terms of Service', path: '/terms' },
  { title: 'Cookies', path: '/cookies' },
];

function pageLinks(defs: PageDef[], flags: Flags): LlmsLink[] {
  return defs
    .filter((p) => !p.when || p.when(flags))
    .map((p) => ({
      title: p.title,
      path: p.path,
      description: p.descKey ? tr(p.descKey) || undefined : undefined,
    }));
}

/** Turn the item's `details` facts into label/value pairs for the markdown block. */
function contentDetailPairs(details?: {
  key?: string;
  era?: string;
  form?: string;
  timeSignature?: string;
  composer?: string;
  composerDates?: string;
  composedYear?: string;
}): [string, string][] {
  if (!details) return [];
  const labelled: [string, string | undefined][] = [
    ['Composer', details.composer],
    ['Composed', details.composedYear],
    ['Key', details.key],
    ['Form', details.form],
    ['Era', details.era],
    ['Time signature', details.timeSignature],
  ];
  return labelled
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => [k, String(v)] as [string, string]);
}

/** Sections + optional links for `/llms.txt` (cheap: list endpoints only). */
export async function collectLlmsIndex(
  locals: LlmsLocals,
): Promise<{ sections: LlmsSection[]; optional: LlmsLink[] }> {
  const { flags, flagSnapshot } = locals;
  const ctx = { apiBaseUrl: apiBaseUrl() };
  const [catalogue, collections] = await Promise.all([
    listContentCards(ctx),
    flags.collections ? listCollectionCards(ctx) : Promise.resolve([]),
  ]);

  const sections: LlmsSection[] = [
    {
      heading: 'Catalogue',
      links: catalogue.map((c) => ({
        title: c.title,
        path: `/catalogue/${c.slug}`,
        description: c.summary,
      })),
    },
  ];
  if (collections.length > 0) {
    sections.push({
      heading: 'Collections',
      links: collections.map((c) => ({
        title: c.title,
        path: `/collections/${c.slug}`,
        description: c.summary,
      })),
    });
  }
  const tools = toolLinks(flagSnapshot);
  if (tools.length > 0) sections.push({ heading: 'Tools', links: tools });
  sections.push({ heading: 'Pages', links: pageLinks(MAIN_PAGES, flags) });

  return { sections, optional: pageLinks(OPTIONAL_PAGES, flags) };
}

/** Run `fn` over `items` with at most `limit` in flight. */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** Sections for `/llms-full.txt` (heavy: fetches each item's prose with bounded concurrency). */
export async function collectLlmsFull(locals: LlmsLocals): Promise<LlmsFullSection[]> {
  const { flags, flagSnapshot } = locals;
  const ctx = { apiBaseUrl: apiBaseUrl() };
  const [catalogueCards, collectionCards, faq] = await Promise.all([
    listContentCards(ctx),
    flags.collections ? listCollectionCards(ctx) : Promise.resolve([]),
    flags.faq ? fetchFaqEntries(ctx) : Promise.resolve([]),
  ]);

  const catalogueItems = (await mapLimit(catalogueCards, 8, (c) => fetchContentFull(c.slug, ctx)))
    .filter((c): c is NonNullable<typeof c> => c != null)
    .map<LlmsItem>((c) => ({
      title: c.title,
      path: `/catalogue/${c.slug}`,
      summary: c.summary,
      details: contentDetailPairs(c.details),
      body: c.body,
    }));

  const collectionItems = (
    await mapLimit(collectionCards, 8, (c) => fetchCollectionFull(c.slug, ctx))
  )
    .filter((c): c is NonNullable<typeof c> => c != null)
    .map<LlmsItem>((c) => ({
      title: c.title,
      path: `/collections/${c.slug}`,
      summary: c.summary,
      outcomes: c.outcomes,
      body: c.body,
    }));

  const sections: LlmsFullSection[] = [];
  if (catalogueItems.length > 0) sections.push({ heading: 'Catalogue', items: catalogueItems });
  if (collectionItems.length > 0) sections.push({ heading: 'Collections', items: collectionItems });
  if (faq.length > 0) {
    sections.push({
      heading: 'FAQ',
      items: faq.map((e) => ({ title: e.question, body: e.answer })),
    });
  }
  const tools = toolLinks(flagSnapshot);
  if (tools.length > 0) {
    sections.push({
      heading: 'Tools',
      items: tools.map((tl) => ({ title: tl.title, path: tl.path, summary: tl.description })),
    });
  }
  sections.push({
    heading: 'Pages',
    items: pageLinks(MAIN_PAGES, flags).map((pl) => ({
      title: pl.title,
      path: pl.path,
      summary: pl.description,
    })),
  });
  return sections;
}

/**
 * Clean source markdown for a content detail page (catalogue/collection), for `Accept: text/markdown`.
 * Returns null when the path isn't a content detail route or the item is missing.
 */
export async function contentPageMarkdown(opts: {
  canonicalPath: string;
  locale: string;
  cookie?: string;
  site: URL | undefined;
  collectionsEnabled: boolean;
}): Promise<string | null> {
  const match = opts.canonicalPath.match(/^\/(catalogue|collections)\/([^/]+)\/?$/);
  if (!match) return null;
  const [, kind, rawSlug] = match;
  const slug = decodeURIComponent(rawSlug);
  const ctx = { apiBaseUrl: apiBaseUrl(), locale: opts.locale, cookie: opts.cookie };

  if (kind === 'catalogue') {
    const item = await fetchContentFull(slug, ctx);
    if (!item) return null;
    return renderItemMarkdown(
      {
        title: item.title,
        path: `/catalogue/${item.slug}`,
        summary: item.summary,
        details: contentDetailPairs(item.details),
        body: item.body,
      },
      { site: opts.site },
    );
  }

  if (!opts.collectionsEnabled) return null;
  const item = await fetchCollectionFull(slug, ctx);
  if (!item) return null;
  return renderItemMarkdown(
    {
      title: item.title,
      path: `/collections/${item.slug}`,
      summary: item.summary,
      outcomes: item.outcomes,
      body: item.body,
    },
    { site: opts.site },
  );
}
