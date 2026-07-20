/**
 * Instrument skins — the visual presets a learner can apply to the piano and guitar tools.
 *
 * Three families:
 * - `token`  — follows the live design tokens (the default look; no fixed palette).
 * - `material` — a fixed, theme-independent palette (e.g. ebony & ivory, sunburst) evoking a real
 *   instrument.
 * - `pixi`  — a material palette plus GPU flourishes (gloss / wood grain) the Pixi scenes draw on top.
 *
 * Palettes are the single source of truth here: Pixi scenes read the `0xRRGGBB` numbers directly, and
 * SVG/DOM surfaces read them as `#rrggbb` strings via {@link toHexColor}. An unknown id resolves to the
 * default `theme` skin.
 */

export type SkinKind = 'token' | 'material' | 'pixi';

/** Fixed keyboard-surface colours (0xRRGGBB). Absent on the `theme` skin, which uses live tokens. */
export interface KeyboardSkinPalette {
  whiteKey: number;
  whiteKeyActive: number;
  blackKey: number;
  blackKeyActive: number;
  /** Fill for a key that belongs to the highlighted scale. */
  scale: number;
  border: number;
  label: number;
}

/** Fixed fretboard/chord-surface colours (0xRRGGBB). Absent on the `theme` skin. */
export interface FretboardSkinPalette {
  board: number;
  boardEdge: number;
  string: number;
  fret: number;
  nut: number;
  /** A scale/shape dot. */
  dot: number;
  /** A sounding note. */
  dotActive: number;
  /** The root note. */
  root: number;
  label: number;
  /** Inlay fret markers. */
  marker: number;
}

export interface InstrumentSkin<P> {
  id: string;
  /** i18n message key for the display name (rendered by the consumer via `t(locale, key)`). */
  labelKey: string;
  kind: SkinKind;
  palette?: P;
  /** `pixi`-kind flourishes drawn over the flat palette. */
  effects?: { gloss?: boolean; woodGrain?: boolean };
}

export type KeyboardSkin = InstrumentSkin<KeyboardSkinPalette>;
export type FretboardSkin = InstrumentSkin<FretboardSkinPalette>;

/** The default skin id — the token-driven look shared with the rest of the site. */
export const DEFAULT_SKIN_ID = 'theme';

export const KEYBOARD_SKINS: readonly KeyboardSkin[] = [
  { id: 'theme', labelKey: 'skin.theme', kind: 'token' },
  {
    id: 'classic',
    labelKey: 'skin.classic',
    kind: 'material',
    palette: {
      whiteKey: 0xf6f1e7,
      whiteKeyActive: 0xe8c96a,
      blackKey: 0x191714,
      blackKeyActive: 0xc79a3b,
      scale: 0xd8ad4d,
      border: 0x2a251d,
      label: 0x5a5348,
    },
  },
  {
    id: 'vintage-wood',
    labelKey: 'skin.vintageWood',
    kind: 'material',
    palette: {
      whiteKey: 0xe9dcc2,
      whiteKeyActive: 0xd8b25a,
      blackKey: 0x3b2a1c,
      blackKeyActive: 0x8a5a2b,
      scale: 0xb98a3c,
      border: 0x4a3722,
      label: 0x6b5836,
    },
    effects: { woodGrain: true },
  },
  {
    id: 'neon',
    labelKey: 'skin.neon',
    kind: 'pixi',
    palette: {
      whiteKey: 0x14161c,
      whiteKeyActive: 0x22d3ee,
      blackKey: 0x0a0b0f,
      blackKeyActive: 0xf472b6,
      scale: 0x8b5cf6,
      border: 0x1f2430,
      label: 0x9fb4c7,
    },
    effects: { gloss: true },
  },
];

export const FRETBOARD_SKINS: readonly FretboardSkin[] = [
  { id: 'theme', labelKey: 'skin.theme', kind: 'token' },
  {
    id: 'natural',
    labelKey: 'skin.natural',
    kind: 'material',
    palette: {
      board: 0xdcc19a,
      boardEdge: 0xb8996b,
      string: 0xece3d0,
      fret: 0x9a8a6a,
      nut: 0x5a4a33,
      dot: 0x7a5a2f,
      dotActive: 0xd8ad4d,
      root: 0xb0472e,
      label: 0x3a2c18,
      marker: 0xbfa877,
    },
    effects: { woodGrain: true },
  },
  {
    id: 'sunburst',
    labelKey: 'skin.sunburst',
    kind: 'material',
    palette: {
      board: 0xc9832f,
      boardEdge: 0x7a441a,
      string: 0xf3e6c8,
      fret: 0x8a5a2b,
      nut: 0x3a2410,
      dot: 0x2a1a0d,
      dotActive: 0xffd66b,
      root: 0xd23b2a,
      label: 0x2a1a0d,
      marker: 0xe0a94a,
    },
    effects: { woodGrain: true },
  },
  {
    id: 'ebony',
    labelKey: 'skin.ebony',
    kind: 'material',
    palette: {
      board: 0x1c1a17,
      boardEdge: 0x050505,
      string: 0xd8ccb4,
      fret: 0x6a5f4d,
      nut: 0x9a8a6a,
      dot: 0xd8ad4d,
      dotActive: 0xffe08a,
      root: 0xe06a4d,
      label: 0xece3d0,
      marker: 0x8a7d63,
    },
  },
  {
    id: 'metallic',
    labelKey: 'skin.metallic',
    kind: 'pixi',
    palette: {
      board: 0x3a4048,
      boardEdge: 0x20242a,
      string: 0xd7dde3,
      fret: 0x8a929c,
      nut: 0xc7ced6,
      dot: 0x9fd0ff,
      dotActive: 0x63b3ff,
      root: 0xff7a5c,
      label: 0xe6ebf0,
      marker: 0xa9b2bd,
    },
    effects: { gloss: true },
  },
];

/** The keyboard skin for an id, or the default `theme` skin when the id is unknown. */
export function keyboardSkin(id: string | undefined): KeyboardSkin {
  return KEYBOARD_SKINS.find((s) => s.id === id) ?? KEYBOARD_SKINS[0];
}

/** The fretboard skin for an id, or the default `theme` skin when the id is unknown. */
export function fretboardSkin(id: string | undefined): FretboardSkin {
  return FRETBOARD_SKINS.find((s) => s.id === id) ?? FRETBOARD_SKINS[0];
}

/** A `0xRRGGBB` colour as a `#rrggbb` string, for SVG/DOM surfaces. */
export function toHexColor(n: number): string {
  return `#${(n & 0xffffff).toString(16).padStart(6, '0')}`;
}
