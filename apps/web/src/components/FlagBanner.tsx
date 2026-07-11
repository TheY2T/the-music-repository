import { FlagKeys } from '@TheY2T/tmr-flags';
import { OpenFeature, OpenFeatureProvider, useFlag } from '@openfeature/react-sdk';
import { InMemoryProvider } from '@openfeature/web-sdk';

/**
 * Demonstrates the OpenFeature React SDK inside an island. The client-side provider is seeded
 * from the SSR-evaluated value (`initial`) so first paint matches the server. Phase 3 swaps this
 * InMemoryProvider for the OFREP web provider to get live updates from flagd in the browser.
 */
let providerConfigured = false;
function ensureProvider(initial: boolean): void {
  if (providerConfigured) {
    return;
  }
  providerConfigured = true;
  OpenFeature.setProvider(
    new InMemoryProvider({
      [FlagKeys.DemoNewBanner]: {
        disabled: false,
        variants: { on: true, off: false },
        defaultVariant: initial ? 'on' : 'off',
      },
    }),
  );
}

function Banner() {
  const { value } = useFlag(FlagKeys.DemoNewBanner, false);
  return value ? (
    <div className="rounded-lg border border-green-600/40 bg-green-600/10 p-4 text-sm">
      🎉 The new banner is <strong>enabled</strong> (evaluated via OpenFeature react-sdk island).
    </div>
  ) : (
    <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
      The <span className="font-mono">demo.new-banner</span> flag is <strong>off</strong>. Enable it
      in <span className="font-mono">flags/flags.json</span> (or target a role) to flip this.
    </div>
  );
}

export default function FlagBanner({ initial }: { initial: boolean }) {
  ensureProvider(initial);
  return (
    <OpenFeatureProvider>
      <Banner />
    </OpenFeatureProvider>
  );
}
