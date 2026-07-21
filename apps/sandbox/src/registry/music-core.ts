import type { Specimen } from './types';

// The portable engines in @TheY2T/tmr-music-core are headless logic, so they are surfaced through live
// inspector panels rather than a rendered component. Each specimen sets an `inspector` and no `load`;
// the stage renders the matching inspector.
export const musicCoreSpecimens: Specimen[] = [
  {
    id: 'mc-audio-bus',
    name: 'Audio bus & focus',
    pkg: 'music-core',
    domains: ['engines'],
    kind: 'engine',
    inspector: 'audio',
    notes:
      'Master-bus analyser scope, audio-context state, and the single-active audio-focus holder.',
  },
  {
    id: 'mc-soundfont',
    name: 'Soundfont instruments',
    pkg: 'music-core',
    domains: ['engines'],
    kind: 'engine',
    inspector: 'soundfont',
    notes:
      'Per-instrument load status (sampled vs. oscillator fallback) with load + play controls.',
  },
  {
    id: 'mc-music-theory',
    name: 'Music theory tables',
    pkg: 'music-core',
    domains: ['engines', 'theory'],
    kind: 'engine',
    inspector: 'theory',
    notes: 'Browsable SCALES / CHORDS / MODES / intervals / circle-of-fifths / levels tables.',
  },
  {
    id: 'mc-score-engine',
    name: 'alphaTab score engine',
    pkg: 'music-core',
    domains: ['engines', 'scores'],
    kind: 'engine',
    inspector: 'score',
    notes: 'Renders an alphaTex string through the engine and reports its load result.',
  },
  {
    id: 'mc-pixi-env',
    name: 'Pixi / WebGL environment',
    pkg: 'music-core',
    domains: ['engines'],
    kind: 'engine',
    inspector: 'pixi',
    notes: 'WebGL support, reduced-motion preference, and the live theme-colour bridge.',
  },
];
