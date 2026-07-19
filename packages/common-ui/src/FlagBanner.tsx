import { FlagKeys } from '@TheY2T/tmr-flags';
import { Card, Icon } from '@TheY2T/tmr-ui';
import { OpenFeature, OpenFeatureProvider, useFlag } from '@openfeature/react-sdk';
import { InMemoryProvider } from '@openfeature/web-sdk';

/**
 * OpenFeature React SDK inside an island. The client-side provider is seeded from the
 * SSR-evaluated value (`initial`) so the first client paint matches the server.
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
    <Card className="flex items-center gap-2 border-green-600/40 bg-green-600/10 p-4 text-sm">
      <Icon name="party-popper" className="size-4 shrink-0" />
      <span>
        The new banner is <strong>enabled</strong> (evaluated via OpenFeature react-sdk island).
      </span>
    </Card>
  ) : (
    <Card className="p-4 text-sm text-muted-foreground">
      The <span className="font-mono">demo.new-banner</span> flag is <strong>off</strong>. Enable it
      in <span className="font-mono">flags/flags.json</span> (or target a role) to flip this.
    </Card>
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
