import type { FlagSnapshot } from '@TheY2T/tmr-flags-eval';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Astro's virtual middleware module: `defineMiddleware` just returns the handler unchanged.
vi.mock('astro:middleware', () => ({ defineMiddleware: (fn: unknown) => fn }));

// Control the DB-backed snapshot the middleware evaluates. `null` ⇒ the API-unreachable path, where every
// flag degrades to its code-level default (the graceful behaviour the app relies on). `evaluateFlag`,
// `FLAG_FIELD_BY_KEY`, and `FlagDefaults` all stay real so the mapping + evaluation are exercised for real.
let mockSnapshot: FlagSnapshot | null = null;
vi.mock('@TheY2T/tmr-flags-eval', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@TheY2T/tmr-flags-eval')>();
  return {
    ...actual,
    HttpSnapshotSource: class {
      getSnapshot() {
        return Promise.resolve(mockSnapshot);
      }
    },
  };
});

// Avoid a real i18n catalogue network hop.
vi.mock('./lib/i18n-catalogue', () => ({
  ensureCatalogue: () => Promise.resolve({ version: '1', locale: 'en', messages: {} }),
}));

// Imported after the mocks so the module picks them up.
const { onRequest } = await import('./middleware');

function makeContext(url: string, headers: Record<string, string> = {}) {
  return {
    request: new Request(url, { headers }),
    locals: {} as Record<string, unknown>,
    redirect: (path: string) => `REDIRECT:${path}` as unknown as Response,
  };
}

describe('web middleware', () => {
  beforeEach(() => {
    mockSnapshot = null;
  });

  it('populates every feature flag into locals (defaults when the snapshot is unavailable)', async () => {
    const ctx = makeContext('http://localhost:4321/catalogue');
    const next = vi.fn().mockResolvedValue(new Response('ok'));

    await onRequest(ctx as never, next as never);

    expect(ctx.locals.flags).toBeDefined();
    // Monetization is deferred — premium + its messaging default OFF (everything free).
    expect((ctx.locals.flags as { premium: boolean }).premium).toBe(false);
    expect((ctx.locals.flags as { monetizationMessaging: boolean }).monetizationMessaging).toBe(
      false,
    );
    expect((ctx.locals.flags as { i18nEnabled: boolean }).i18nEnabled).toBe(true);
    expect(ctx.locals.locale).toBe('en');
    expect(next).toHaveBeenCalledWith();
  });

  it('evaluates flags from the snapshot and exposes runtime keys on flagSnapshot', async () => {
    mockSnapshot = {
      environment: 'dev',
      version: '1',
      flags: {
        'tools.metronome': {
          key: 'tools.metronome',
          enabled: false, // toggled off for this environment
          defaultVariant: 'off',
          variants: { on: true, off: false },
          targeting: null,
          defaultValue: true,
        },
        'experimental.thing': {
          key: 'experimental.thing', // an admin-created runtime key (not in the typed registry)
          enabled: true,
          defaultVariant: 'on',
          variants: { on: true, off: false },
          targeting: null,
          defaultValue: false,
        },
      },
    };
    const ctx = makeContext('http://localhost:4321/tools/metronome');
    const next = vi.fn().mockResolvedValue(new Response('ok'));

    await onRequest(ctx as never, next as never);

    // A registered key toggled off in the snapshot resolves off on the typed shape.
    expect((ctx.locals.flags as { toolMetronome: boolean }).toolMetronome).toBe(false);
    // The raw map carries admin-created runtime keys too.
    expect((ctx.locals.flagSnapshot as Record<string, boolean>)['experimental.thing']).toBe(true);
    expect((ctx.locals.flagSnapshot as Record<string, boolean>)['tools.metronome']).toBe(false);
  });

  it('resolves zh-Hans from the /zh prefix and rewrites to the canonical path', async () => {
    const ctx = makeContext('http://localhost:4321/zh/catalogue');
    const next = vi.fn().mockResolvedValue(new Response('ok'));

    await onRequest(ctx as never, next as never);

    expect(ctx.locals.locale).toBe('zh-Hans');
    expect(next).toHaveBeenCalledWith('/catalogue');
  });

  it('treats a request with no session cookie as anonymous (no network hop)', async () => {
    const ctx = makeContext('http://localhost:4321/catalogue');
    const next = vi.fn().mockResolvedValue(new Response('ok'));

    await onRequest(ctx as never, next as never);

    expect(ctx.locals.user).toBeNull();
  });

  it('shares an anonymous public page at the edge with Vary: Cookie', async () => {
    const ctx = makeContext('http://localhost:4321/catalogue');
    const next = vi.fn().mockResolvedValue(new Response('ok'));

    const res = (await onRequest(ctx as never, next as never)) as Response;

    expect(res.headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=60, stale-while-revalidate=600',
    );
    expect(res.headers.get('Vary')).toMatch(/\bCookie\b/);
  });

  it('never shares a private route, even when anonymous', async () => {
    const ctx = makeContext('http://localhost:4321/admin/feature-flags');
    const next = vi.fn().mockResolvedValue(new Response('ok'));

    const res = (await onRequest(ctx as never, next as never)) as Response;

    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('never shares a page rendered for a signed-in user', async () => {
    // The session check fetches get-session only when a Better Auth cookie is present.
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: 'u1', email: 'a@b.co', role: 'learner' } }),
    });
    vi.stubGlobal('fetch', fetchMock);
    try {
      // `Cookie` is a forbidden header on the Request/Headers API, so back the lookup directly.
      const cookie = 'better-auth.session_token=abc';
      const ctx = {
        request: {
          method: 'GET',
          url: 'http://localhost:4321/catalogue',
          headers: {
            get: (name: string) =>
              name === 'cookie' ? cookie : name === 'host' ? 'localhost:4321' : null,
          },
        },
        locals: {} as Record<string, unknown>,
        redirect: (path: string) => `REDIRECT:${path}`,
      };
      const next = vi.fn().mockResolvedValue(new Response('ok'));

      const res = (await onRequest(ctx as never, next as never)) as Response;

      expect(ctx.locals.user).toEqual({ id: 'u1', email: 'a@b.co', name: '', role: 'learner' });
      expect(fetchMock).toHaveBeenCalled();
      expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
