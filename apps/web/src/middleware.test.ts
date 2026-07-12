import { describe, expect, it, vi } from 'vitest';

// Astro's virtual middleware module: `defineMiddleware` just returns the handler unchanged.
vi.mock('astro:middleware', () => ({ defineMiddleware: (fn: unknown) => fn }));

// No flagd network hop: the provider is a no-op and every flag resolves to the default passed in
// (mirrors the graceful "flagd unreachable → defaults" behaviour the app relies on).
vi.mock('@openfeature/flagd-provider', () => ({ FlagdProvider: class {} }));
vi.mock('@openfeature/server-sdk', () => {
  const client = {
    getBooleanValue: (_key: string, fallback: boolean) => Promise.resolve(fallback),
  };
  return {
    OpenFeature: {
      setLogger: vi.fn(),
      setProvider: vi.fn(),
      getClient: () => client,
    },
  };
});

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
  it('populates every feature flag into locals (defaults when flagd is unreachable)', async () => {
    const ctx = makeContext('http://localhost:4321/catalogue');
    const next = vi.fn().mockResolvedValue(new Response('ok'));

    await onRequest(ctx as never, next as never);

    expect(ctx.locals.flags).toBeDefined();
    expect((ctx.locals.flags as { premium: boolean }).premium).toBe(true);
    expect((ctx.locals.flags as { i18nEnabled: boolean }).i18nEnabled).toBe(true);
    expect(ctx.locals.locale).toBe('en');
    expect(next).toHaveBeenCalledWith();
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
