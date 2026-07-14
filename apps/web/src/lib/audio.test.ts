import { beforeAll, describe, expect, it } from 'vitest';

// A minimal fake Web Audio graph that records every `connect()` edge, so we can assert that voices
// route through the master bus (masterGain → analyser → destination) rather than straight to the
// destination. happy-dom has no AudioContext, so we install this before importing `audio.ts`.

interface Edge {
  from: FakeNode;
  to: FakeNode;
}
const EDGES: Edge[] = [];

class FakeParam {
  value = 0;
  setValueAtTime() {}
  exponentialRampToValueAtTime() {}
}

class FakeNode {
  context: unknown = null; // mirrors AudioNode.context (the bus caches keyed on it)
  constructor(public kind: string) {}
  connect(target: FakeNode) {
    EDGES.push({ from: this, to: target });
    return target;
  }
  disconnect() {}
}

class FakeGain extends FakeNode {
  gain = new FakeParam();
  constructor() {
    super('gain');
  }
}
class FakeAnalyser extends FakeNode {
  fftSize = 0;
  smoothingTimeConstant = 0;
  get frequencyBinCount() {
    return this.fftSize / 2;
  }
  constructor() {
    super('analyser');
  }
}
class FakeOscillator extends FakeNode {
  frequency = new FakeParam();
  type = 'sine';
  start() {}
  stop() {}
  constructor() {
    super('oscillator');
  }
}

class FakeAudioContext {
  state = 'running';
  currentTime = 0;
  sampleRate = 44100;
  destination = new FakeNode('destination');
  createGain() {
    const n = new FakeGain();
    n.context = this;
    return n;
  }
  createAnalyser() {
    const n = new FakeAnalyser();
    n.context = this;
    return n;
  }
  createOscillator() {
    const n = new FakeOscillator();
    n.context = this;
    return n;
  }
  resume() {
    return Promise.resolve();
  }
}

let audio: typeof import('./audio');

beforeAll(async () => {
  (window as unknown as { AudioContext: unknown }).AudioContext = FakeAudioContext;
  audio = await import('./audio');
});

describe('audio master bus', () => {
  it('exposes a configured analyser tapping the graph', () => {
    const analyser = audio.getAnalyser() as unknown as FakeAnalyser;
    expect(analyser).not.toBeNull();
    expect(analyser.fftSize).toBe(2048);
    expect(analyser.smoothingTimeConstant).toBeCloseTo(0.8);
  });

  it('builds the bus once (idempotent)', () => {
    expect(audio.getAnalyser()).toBe(audio.getAnalyser());
  });

  it('routes the analyser to the destination via a unity master gain', () => {
    const analyser = audio.getAnalyser() as unknown as FakeNode;
    const intoAnalyser = EDGES.find((e) => e.to === analyser);
    expect(intoAnalyser).toBeDefined();
    const masterGain = intoAnalyser?.from as FakeGain;
    expect(masterGain.kind).toBe('gain');
    expect(masterGain.gain.value).toBe(1); // unity → behaviour-preserving
    expect(EDGES.some((e) => e.from === analyser && e.to.kind === 'destination')).toBe(true);
  });

  it('routes a scheduled tone through the master gain, not straight to destination', () => {
    const analyser = audio.getAnalyser() as unknown as FakeNode;
    const masterGain = EDGES.find((e) => e.to === analyser)?.from as FakeGain;
    const before = EDGES.filter((e) => e.to === masterGain).length;
    audio.scheduleTone(440, 0, 0.5);
    const after = EDGES.filter((e) => e.to === masterGain).length;
    expect(after).toBeGreaterThan(before);
  });
});
