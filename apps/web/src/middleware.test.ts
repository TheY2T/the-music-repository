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
});
