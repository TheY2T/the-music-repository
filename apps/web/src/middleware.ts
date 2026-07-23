import { FlagDefaults } from '@TheY2T/tmr-flags';
import { evaluateFlag, type FlagSnapshot, HttpSnapshotSource } from '@TheY2T/tmr-flags-eval';
import {
  DEFAULT_LOCALE,
  localePrefix,
  localizedPath,
  preferredLocale,
  splitLocalePath,
} from '@TheY2T/tmr-i18n';
import { FLAG_FIELD_BY_KEY, type Flags } from '@TheY2T/tmr-web-acl';
import { defineMiddleware } from 'astro:middleware';
import type { APIContext } from 'astro';
import { htmlCachePolicy } from './lib/http-cache';
import { ensureCatalogue } from './lib/i18n-catalogue';
import { contentPageMarkdown } from './lib/llms-sources';
import { htmlToMarkdown, MARKDOWN_HEADERS, prefersMarkdown } from './lib/markdown';

// SSR runs on the server, so it needs a server-reachable API origin. In a container that's the compose
// service name (`http://api:3000`), NOT the browser's host-published `PUBLIC_API_BASE_URL`
// (`http://localhost:3000`) — which inside the web container points at the web container itself. Prefer
// the server-only `API_INTERNAL_URL`; fall back to the public URL for local dev where SSR runs on the host.
const API_BASE =
  process.env.API_INTERNAL_URL ?? process.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

// Which feature-flag environment this deployment resolves against (matches a DB environment key; unmatched
// falls back to the default env server-side). Free-form because environments are CRUD-able (ADR 0035).
const APP_ENV = process.env.APP_ENV ?? 'dev';

// The flag snapshot source: fetches `GET /feature-flags/snapshot/:env` from the API and caches it per SSR
// process, revalidating with an ETag (conditional GET → 304). Flags are evaluated in-process by the shared
// engine (`@TheY2T/tmr-flags-eval`), the same engine the API uses, so a flag resolves identically in both.
const snapshotSource = new HttpSnapshotSource(`${API_BASE}/feature-flags/snapshot/${APP_ENV}`);

/**
 * Resolve the session server-side by forwarding the request's cookies to the API's Better Auth
 * `get-session`. Returns null for anonymous requests. The gate this feeds (`/admin`) is UX-only —
 * the API re-authorizes every mutation.
 */
async function resolveSessionUser(cookie: string): Promise<App.Locals['user']> {
  // Cheap short-circuit: no Better Auth cookie → definitely anonymous, skip the network hop.
  if (!cookie.includes('better-auth')) {
    return null;
  }
  try {
    const response = await fetch(`${API_BASE}/api/auth/get-session`, { headers: { cookie } });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as {
      user?: { id: string; email: string; name?: string; role?: string | null };
    } | null;
    if (!data?.user) {
      return null;
    }
    const { id, email, name, role } = data.user;
    return { id, email, name: name ?? '', role: role ?? null };
  } catch {
    // API unreachable → treat as anonymous rather than failing the page render.
    return null;
  }
}

/** Build the OpenFeature-style evaluation context from the resolved user (drives per-env targeting). */
function evalContext(user: App.Locals['user']) {
  if (!user) return {};
  return { targetingKey: user.id, roles: user.role ? [user.role] : [] };
}

/**
 * Evaluate every flag for this request from the snapshot. Returns the typed `Flags` object (for
 * `Astro.locals.flags`, one field per code key via {@link FLAG_FIELD_BY_KEY}) plus a raw `key → boolean`
 * map that also includes admin-created **runtime** keys not in the typed registry. When the snapshot is
 * unavailable (API down) every flag degrades to its code-level {@link FlagDefaults} — the app still renders.
 */
function buildFlags(
  snapshot: FlagSnapshot | null,
  user: App.Locals['user'],
): { flags: Flags; raw: Record<string, boolean> } {
  const ctx = evalContext(user);
  const defaults = FlagDefaults as Record<string, boolean>;
  const raw: Record<string, boolean> = {};

  // Every flag present in the snapshot (code + runtime keys).
  if (snapshot) {
    for (const key of Object.keys(snapshot.flags)) {
      raw[key] = Boolean(evaluateFlag(snapshot, key, ctx, defaults[key] ?? false).value);
    }
  }

  // The typed shape: one field per registered code key (fills any not present in the snapshot).
  const flags = {} as Record<string, boolean>;
  for (const [key, field] of Object.entries(FLAG_FIELD_BY_KEY)) {
    const fallback = defaults[key] ?? false;
    const value =
      key in raw
        ? raw[key]
        : snapshot
          ? Boolean(evaluateFlag(snapshot, key, ctx, fallback).value)
          : fallback;
    flags[field] = value;
    raw[key] = value;
  }

  return { flags: flags as Flags, raw };
}

export const onRequest = defineMiddleware(async (context, next) => {
  // Only serve traffic that arrives through the front door (custom domain via Cloudflare). Render's
  // default `*.onrender.com` URL bypasses Cloudflare (and its Access gate), so refuse it.
  if ((context.request.headers.get('host') ?? '').endsWith('.onrender.com')) {
    return new Response('Not found', { status: 404 });
  }

  // Resolve the user first so flag targeting (roles / percentage rollout) can use it.
  context.locals.user = await resolveSessionUser(context.request.headers.get('cookie') ?? '');

  const snapshot = await snapshotSource.getSnapshot();
  const { flags, raw } = buildFlags(snapshot, context.locals.user);
  context.locals.flags = flags;
  context.locals.flagSnapshot = raw;

  const i18nEnabled = flags.i18nEnabled;

  // Locale resolution + URL-prefix routing. One set of page files serves every locale: a `/zh/…`
  // request is rewritten to its canonical (un-prefixed) path while the browser URL is left unchanged,
  // and the page/islands read `Astro.locals.locale`. See @TheY2T/tmr-i18n + docs/features/i18n.md.
  const url = new URL(context.request.url);
  const { locale: urlLocale, path: canonicalPath } = splitLocalePath(url.pathname);

  if (i18nEnabled && localePrefix(urlLocale)) {
    context.locals.locale = urlLocale;
  } else {
    context.locals.locale = DEFAULT_LOCALE;
    // On the bare root only, honour a saved `locale` cookie / browser language by redirecting to the
    // prefixed URL. Restricted to `/` so assets and deep links are never surprise-redirected.
    if (i18nEnabled && canonicalPath === '/' && context.request.method === 'GET') {
      const preferred = preferredLocale({
        cookie: context.request.headers.get('cookie'),
        acceptLanguage: context.request.headers.get('accept-language'),
      });
      if (preferred !== DEFAULT_LOCALE) {
        return context.redirect(localizedPath(preferred, '/'));
      }
    }
  }

  // Load the DB-backed UI-string catalogue for the active locale (ADR 0034). This populates the i18n
  // engine registry so SSR `t()` resolves from the DB, and yields the blob BaseLayout serializes for the
  // client. Degrades to the engine's bundled fallback if the API is unreachable.
  context.locals.i18nCatalogue = await ensureCatalogue(context.locals.locale);

  // Render the single page-file set, stripping the locale prefix so `/zh/…` reuses the canonical page
  // (the browser URL stays `/zh/…`).
  const render = () =>
    i18nEnabled && localePrefix(urlLocale) ? next(`${canonicalPath}${url.search}`) : next();

  // Content negotiation: when a client (LLM crawler / Cloudflare) prefers markdown, serve markdown and
  // mark the response `Vary: Accept` so caches keep the HTML and markdown variants separate.
  if (context.request.method === 'GET' && prefersMarkdown(context.request.headers.get('accept'))) {
    // Content detail pages → clean source markdown (bodyMdx), skipping embeds/chrome.
    const source = await contentPageMarkdown({
      canonicalPath,
      locale: context.locals.locale,
      cookie: context.request.headers.get('cookie') ?? undefined,
      site: context.site,
      collectionsEnabled: flags.collections,
    });
    if (source) return new Response(source, { headers: MARKDOWN_HEADERS });

    // Any other route → render, then convert its <main> to markdown; fall back to the HTML on failure.
    const res = await render();
    const contentType = res.headers.get('content-type') ?? '';
    if (res.status === 200 && contentType.includes('text/html')) {
      const html = await res.text();
      const markdown = htmlToMarkdown(html);
      if (markdown) return new Response(markdown, { headers: MARKDOWN_HEADERS });
      const headers = new Headers(res.headers);
      addVaryAccept(headers);
      return new Response(html, { status: res.status, headers });
    }
    addVaryAccept(res.headers);
    return res;
  }

  const res = await render();
  addVaryAccept(res.headers);
  applyHtmlCacheControl(res, context, canonicalPath);
  return res;
});

/** Add a token to the response's `Vary` header without dropping an existing value. */
function appendVary(headers: Headers, token: string): void {
  const existing = headers.get('Vary');
  if (!existing) headers.set('Vary', token);
  else if (!new RegExp(`\\b${token}\\b`, 'i').test(existing))
    headers.set('Vary', `${existing}, ${token}`);
}

/** Add `Accept` to the response's `Vary` header (HTML-vs-markdown content negotiation). */
function addVaryAccept(headers: Headers): void {
  appendVary(headers, 'Accept');
}

/** Set `Cache-Control` on an HTML response from the shared policy; tag shared responses `Vary: Cookie`. */
function applyHtmlCacheControl(res: Response, context: APIContext, canonicalPath: string): void {
  const { cacheControl, shared } = htmlCachePolicy({
    method: context.request.method,
    status: res.status,
    authenticated: Boolean(context.locals.user),
    path: canonicalPath,
  });
  res.headers.set('Cache-Control', cacheControl);
  if (shared) appendVary(res.headers, 'Cookie');
}
