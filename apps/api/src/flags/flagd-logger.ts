import { Logger as NestLogger } from '@nestjs/common';
import type { Logger } from '@openfeature/server-sdk';

const CONNECTION_ERROR = /deadline|connect|unavailable|initialization/i;

function describe(arg: unknown): string {
  return arg instanceof Error ? arg.message : String(arg);
}

/**
 * OpenFeature logger that replaces flagd's noisy connection stack traces with a single,
 * actionable hint — so a developer who forgot to start the flag daemon knows exactly what to do.
 */
export function createFlagdLogger(endpoint: string): Logger {
  const nest = new NestLogger('FeatureFlags');
  let hintShown = false;

  return {
    error(...args: unknown[]): void {
      if (args.some((arg) => CONNECTION_ERROR.test(describe(arg)))) {
        if (!hintShown) {
          hintShown = true;
          nest.warn(
            `Could not reach flagd at ${endpoint} — feature flags will use their default values. ` +
              'Start the infrastructure first: `pnpm infra:up`.',
          );
        }
        return;
      }
      nest.error(args.map(describe).join(' '));
    },
    warn(...args: unknown[]): void {
      nest.warn(args.map(describe).join(' '));
    },
    info(): void {
      // OpenFeature info/debug chatter is intentionally suppressed.
    },
    debug(): void {
      // no-op
    },
  };
}
