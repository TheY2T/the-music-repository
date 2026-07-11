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
    oscillator.connect(gain).connect(ctx.destination);
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
  source.connect(filter).connect(gain).connect(ctx.destination);
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
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(atTime);
  oscillator.stop(atTime + 0.05);
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
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}
