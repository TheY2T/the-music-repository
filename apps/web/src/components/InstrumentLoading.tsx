import { Icon } from '@TheY2T/tmr-ui';

/**
 * The spinner shown while a tool's sampled instrument loads. Pair with `useInstrumentReady`:
 * `if (!ready) return <InstrumentLoading />;` before the tool's main render, so the controls only
 * appear once the sampler is ready (or the offline fallback kicks in).
 */
export default function InstrumentLoading({ label = 'Loading instrument…' }: { label?: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-border bg-muted text-muted-foreground">
      <Icon name="loader" className="size-6 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
