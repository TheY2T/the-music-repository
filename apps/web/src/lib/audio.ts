/** Minimal Web Audio note player — a short plucked tone. No dependencies. */

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!context) {
    const Ctor =
      window.AudioContext ??
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    context = Ctor ? new Ctor() : null;
  }
  return context;
}

/** The shared AudioContext, resumed if a user gesture has occurred. Null during SSR / if unsupported. */
export function getAudioContext(): AudioContext | null {
  const ctx = getContext();
  if (ctx?.state === 'suspended') {
    void ctx.resume();
  }
  return ctx;
}

// --- Master bus + analyser -------------------------------------------------------------------
// Every voice below routes through a shared master bus (`masterGain → analyser → destination`)
// instead of connecting straight to `ctx.destination`. `masterGain` is unity, so this is
// behaviour-preserving; the inline `analyser` is a passive tap that lets Pixi visualizers read the
// live waveform/spectrum of everything the app plays. See docs/features/pixi-visualization.md.

let masterGain: GainNode | null = null;
let analyserNode: AnalyserNode | null = null;

/** Lazily build (once) and return the master bus input node. All voices connect here. */
function getMasterBus(ctx: AudioContext): AudioNode {
  if (!masterGain || masterGain.context !== ctx) {
    masterGain = ctx.createGain();
    masterGain.gain.value = 1;
    analyserNode = ctx.createAnalyser();
    analyserNode.fftSize = 2048;
    analyserNode.smoothingTimeConstant = 0.8;
    masterGain.connect(analyserNode).connect(ctx.destination);
  }
  return masterGain;
}

/**
 * The analyser tapping the master bus, or null during SSR / if audio is unsupported. Constructs the
 * bus on first call so a visualizer can attach before any note plays. `fftSize` is 2048 →
 * `frequencyBinCount` 1024; callers may override `fftSize` on the returned node.
 */
export function getAnalyser(): AnalyserNode | null {
  const ctx = getContext();
  if (!ctx) {
    return null;
  }
  getMasterBus(ctx);
  return analyserNode;
}

/**
 * The master-bus input node all voices connect to, or null during SSR. Exposed so the sampled
 * (smplr) engine can route through the same analyser tap as the oscillator, keeping visualizers live
 * for sampled instruments too. See `lib/soundfont.ts`.
 */
export function getDestination(): AudioNode | null {
  const ctx = getContext();
  if (!ctx) {
    return null;
  }
  return getMasterBus(ctx);
}

// --- Held oscillator voices (sustain/note-off) -----------------------------------------------
// The oscillator fallback for the note service: a note rings until released, keyed so note-off can
// stop the exact voice. Used only when a sampled soundfont isn't loaded (offline/SSR/first-load).
const heldVoices = new Map<number, { osc: OscillatorNode; gain: GainNode }>();

/** Start a sustained oscillator voice for `key` (a MIDI note) at `frequency`. `velocity` is 0–1. */
export function oscNoteOn(key: number, frequency: number, velocity = 0.7): void {
  const ctx = getContext();
  if (!ctx) {
    return;
  }
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }
  oscNoteOff(key); // retrigger safety — never leak a voice
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.value = frequency;
  const peak = 0.05 + Math.max(0, Math.min(1, velocity)) * 0.22;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.01);
  oscillator.connect(gain).connect(getMasterBus(ctx));
  oscillator.start(now);
  heldVoices.set(key, { osc: oscillator, gain });
}

/** Release the sustained oscillator voice for `key` with a short fade. */
export function oscNoteOff(key: number): void {
  const ctx = getContext();
  const voice = heldVoices.get(key);
  if (!voice || !ctx) {
    heldVoices.delete(key);
    return;
  }
  heldVoices.delete(key);
  const now = ctx.currentTime;
  try {
    voice.gain.gain.cancelScheduledValues?.(now);
    voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value, 0.0001), now);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    voice.osc.stop(now + 0.14);
  } catch {
    // Voice already stopped — ignore.
  }
}

let noiseBuffer: AudioBuffer | null = null;
function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.3), ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return noiseBuffer;
}

export type DrumVoice = 'kick' | 'snare' | 'hihat';

/** Schedule a synthesised drum hit at an absolute AudioContext time. */
export function scheduleDrum(voice: DrumVoice, atTime: number): void {
  const ctx = getContext();
  if (!ctx) {
    return;
  }
  if (voice === 'kick') {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.frequency.setValueAtTime(150, atTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, atTime + 0.12);
    gain.gain.setValueAtTime(0.9, atTime);
    gain.gain.exponentialRampToValueAtTime(0.001, atTime + 0.16);
    oscillator.connect(gain).connect(getMasterBus(ctx));
    oscillator.start(atTime);
    oscillator.stop(atTime + 0.16);
    return;
  }
  // snare / hihat: filtered noise burst.
  const source = ctx.createBufferSource();
  source.buffer = getNoiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = voice === 'hihat' ? 7000 : 1500;
  const gain = ctx.createGain();
  const duration = voice === 'hihat' ? 0.05 : 0.2;
  gain.gain.setValueAtTime(voice === 'hihat' ? 0.4 : 0.6, atTime);
  gain.gain.exponentialRampToValueAtTime(0.001, atTime + duration);
  source.connect(filter).connect(gain).connect(getMasterBus(ctx));
  source.start(atTime);
  source.stop(atTime + duration);
}

/** Schedule a short metronome click at an absolute AudioContext time. */
export function scheduleClick(atTime: number, accent: boolean): void {
  const ctx = getContext();
  if (!ctx) {
    return;
  }
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.frequency.value = accent ? 1500 : 1000;
  gain.gain.setValueAtTime(accent ? 0.5 : 0.28, atTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, atTime + 0.05);
  oscillator.connect(gain).connect(getMasterBus(ctx));
  oscillator.start(atTime);
  oscillator.stop(atTime + 0.05);
}

/**
 * Schedule a tone at an absolute AudioContext time (for arranged/looped playback). Pass `options.output`
 * to route the voice through a caller-owned node (e.g. a {@link createPlaybackBus} bus) so the whole
 * playback can be silenced on stop — notes scheduled ahead on the timeline can't otherwise be recalled.
 */
export function scheduleTone(
  frequency: number,
  atTime: number,
  duration: number,
  options?: { type?: OscillatorType; gain?: number; output?: AudioNode },
): void {
  const ctx = getContext();
  if (!ctx) {
    return;
  }
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = options?.type ?? 'triangle';
  oscillator.frequency.value = frequency;
  const peak = options?.gain ?? 0.25;
  gain.gain.setValueAtTime(0.0001, atTime);
  gain.gain.exponentialRampToValueAtTime(peak, atTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, atTime + duration);
  oscillator.connect(gain).connect(options?.output ?? getMasterBus(ctx));
  oscillator.start(atTime);
  oscillator.stop(atTime + duration);
}

/**
 * A cancelable output bus for a single playback run. Schedule every voice of the run into `output`
 * (via `scheduleTone(..., { output })`); calling `stop()` fades the bus to silence and disconnects it,
 * immediately muting notes that were already scheduled ahead on the timeline. Returns null during SSR.
 */
export function createPlaybackBus(): { output: GainNode; stop: () => void } | null {
  const ctx = getContext();
  if (!ctx) {
    return null;
  }
  const output = ctx.createGain();
  output.gain.value = 1;
  output.connect(getMasterBus(ctx));
  let stopped = false;
  return {
    output,
    stop() {
      if (stopped) return;
      stopped = true;
      const now = ctx.currentTime;
      try {
        output.gain.cancelScheduledValues?.(now);
        output.gain.setValueAtTime(Math.max(output.gain.value, 0.0001), now);
        output.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
      } catch {
        // Param already settled — ignore.
      }
      // Disconnect after the brief fade so all scheduled voices are fully detached.
      globalThis.setTimeout(() => {
        try {
          output.disconnect();
        } catch {
          // Already disconnected — ignore.
        }
      }, 80);
    },
  };
}

/** Play a tone that glides from `fromFreq` to `toFreq` — for guitar bends and slides. */
export function playGlide(fromFreq: number, toFreq: number, duration = 0.6): void {
  const ctx = getContext();
  if (!ctx) {
    return;
  }
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(fromFreq, now);
  // Reach the target partway through, then hold — reads as a bend/slide into the note.
  oscillator.frequency.exponentialRampToValueAtTime(toFreq, now + duration * 0.5);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain).connect(getMasterBus(ctx));
  oscillator.start(now);
  oscillator.stop(now + duration);
}

/** Play a single tone at `frequency` Hz for `duration` seconds with a soft envelope. */
export function playTone(frequency: number, duration = 0.7): void {
  const ctx = getContext();
  if (!ctx) {
    return;
  }
  // Browsers start the context suspended until a user gesture; clicks resume it.
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain).connect(getMasterBus(ctx));
  oscillator.start(now);
  oscillator.stop(now + duration);
}
