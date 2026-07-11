import { FlagDefaults, FlagKeys } from '@TheY2T/tmr-flags';
import { defineMiddleware } from 'astro:middleware';
import { FlagdProvider } from '@openfeature/flagd-provider';
import { type Logger, OpenFeature } from '@openfeature/server-sdk';

const FLAGD_HOST = process.env.FLAGD_HOST ?? 'localhost';
const FLAGD_PORT = Number(process.env.FLAGD_PORT ?? 8013);
const CONNECTION_ERROR = /deadline|connect|unavailable|initialization/i;

/** Replaces flagd's noisy connection stack traces with a single actionable hint. */
function createFlagdLogger(endpoint: string): Logger {
  let hintShown = false;
  const describe = (arg: unknown) => (arg instanceof Error ? arg.message : String(arg));
  return {
    error(...args: unknown[]) {
      if (args.some((arg) => CONNECTION_ERROR.test(describe(arg)))) {
        if (!hintShown) {
          hintShown = true;
          console.warn(
            `[flags] Could not reach flagd at ${endpoint} — flags will use their default values. ` +
              'Start the infrastructure first: `pnpm infra:up`.',
          );
        }
        return;
      }
      console.error('[flags]', ...args);
    },
    warn: (...args: unknown[]) => console.warn('[flags]', ...args),
    info: () => {},
    debug: () => {},
  };
}

// Set the OpenFeature provider once for the SSR process. Phase 3 can add live client sync;
// Phase 1 will build the per-request evaluation context from the authenticated session.
let providerConfigured = false;
function ensureProvider(): void {
  if (providerConfigured) {
    return;
  }
  providerConfigured = true;
  OpenFeature.setLogger(createFlagdLogger(`${FLAGD_HOST}:${FLAGD_PORT}`));
  OpenFeature.setProvider(
    new FlagdProvider({ host: FLAGD_HOST, port: FLAGD_PORT, resolverType: 'rpc', deadlineMs: 500 }),
  );
}

export const onRequest = defineMiddleware(async (context, next) => {
  ensureProvider();
  const client = OpenFeature.getClient();

  const demoNewBanner = await client.getBooleanValue(
    FlagKeys.DemoNewBanner,
    FlagDefaults[FlagKeys.DemoNewBanner],
  );

  context.locals.flags = { demoNewBanner };
  return next();
});
