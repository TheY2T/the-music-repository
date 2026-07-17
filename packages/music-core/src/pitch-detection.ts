/**
 * Monophonic pitch detection for the tuner — autocorrelation (ACF) with parabolic interpolation on a
 * time-domain buffer, plus a helper to map a frequency to the nearest note + cents offset. Pure and
 * dependency-free so it can be unit-tested. See docs/features/pixi-visualization.md.
 */

const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

/**
 * Estimate the fundamental frequency (Hz) of a time-domain buffer, or null if the signal is too
 * quiet / unpitched. Classic ACF: gate on RMS, autocorrelate, take the first strong peak after the
 * initial descent, refine with parabolic interpolation.
 */
export function detectPitchHz(buffer: Float32Array, sampleRate: number): number | null {
  const size = buffer.length;
  let rms = 0;
  for (let i = 0; i < size; i += 1) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / size);
  if (rms < 0.01) {
    return null; // effectively silence
  }

  const correlations = new Float32Array(size);
  for (let lag = 0; lag < size; lag += 1) {
    let sum = 0;
    for (let i = 0; i < size - lag; i += 1) {
      sum += buffer[i] * buffer[i + lag];
    }
    correlations[lag] = sum;
  }

  // Skip the initial descent from lag 0, then find the highest peak.
  let d = 0;
  while (d < size - 1 && correlations[d] > correlations[d + 1]) {
    d += 1;
  }
  let maxLag = -1;
  let maxVal = -1;
  for (let i = d; i < size; i += 1) {
    if (correlations[i] > maxVal) {
      maxVal = correlations[i];
      maxLag = i;
    }
  }
  if (maxLag <= 0) {
    return null;
  }

  // Parabolic interpolation around the peak for sub-sample accuracy.
  let lag = maxLag;
  const x1 = correlations[maxLag - 1] ?? correlations[maxLag];
  const x2 = correlations[maxLag];
  const x3 = correlations[maxLag + 1] ?? correlations[maxLag];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a !== 0) {
    lag = maxLag - b / (2 * a);
  }

  const hz = sampleRate / lag;
  return hz >= 20 && hz <= 5000 ? hz : null;
}

export interface DetectedNote {
  midi: number;
  name: string;
  octave: number;
  /** Signed cents offset from the nearest equal-tempered note (−50…+50). */
  cents: number;
}

/** Map a frequency (Hz) to the nearest note + cents offset (A4 = 440 Hz). */
export function hzToNote(hz: number): DetectedNote {
  const midiFloat = 69 + 12 * Math.log2(hz / 440);
  const midi = Math.round(midiFloat);
  const cents = Math.round((midiFloat - midi) * 100);
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return { midi, name, octave, cents };
}
