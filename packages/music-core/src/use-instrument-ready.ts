import { useEffect, useState } from 'react';
import { DEFAULT_INSTRUMENT, loadInstrument, type SoundfontStatus } from './soundfont';

/**
 * Load a sampled instrument on mount and report when it's ready. Tools that play notes via `playNote`
 * gate their UI on `ready` (with `InstrumentLoading`) so the first tap doesn't lag on sample-fetch
 * latency — mirroring `PianoKeyboard`. `ready` also flips true on `'fallback'` (offline → oscillator),
 * so the tool never gets stuck behind a spinner. Loads are cached per instrument in the note service,
 * so the gate only shows the first time an instrument is used in a session.
 */
export function useInstrumentReady(instrument: string = DEFAULT_INSTRUMENT): {
  ready: boolean;
  status: SoundfontStatus;
} {
  const [status, setStatus] = useState<SoundfontStatus>('idle');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    loadInstrument(instrument).then((s) => {
      if (!cancelled) {
        setStatus(s);
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [instrument]);

  return { ready, status };
}
