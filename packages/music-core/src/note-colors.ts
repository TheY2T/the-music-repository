/**
 * A distinct, identifiable colour for each of the 12 pitch classes (0–11 = C … B), so notes are
 * recognisable at a glance — A is red, B is blue, and the rest are spread across clearly-different hues
 * (a categorical palette, not a hue wheel, so semitone neighbours don't look alike). `0xRRGGBB`.
 */
export const NOTE_COLORS: readonly number[] = [
  0x3cb44b, // C  green
  0xf032e6, // C# magenta
  0xffe119, // D  yellow
  0x911eb4, // D# purple
  0xf58231, // E  orange
  0x42d4f4, // F  cyan
  0xfabed4, // F# pink
  0x469990, // G  teal
  0xbfef45, // G# lime
  0xe6194b, // A  red
  0x9a6324, // A# brown
  0x4363d8, // B  blue
];

/** The identifiable colour for a pitch class (0–11), as a `0xRRGGBB` int. */
export const noteColor = (pc: number): number => NOTE_COLORS[((pc % 12) + 12) % 12];

/** The identifiable colour for a pitch class (0–11), as a `#rrggbb` string for SVG/DOM. */
export const noteColorHex = (pc: number): string =>
  `#${noteColor(pc).toString(16).padStart(6, '0')}`;

/** A readable text colour (`#rrggbb`) for a label sitting on that pitch class's colour. */
export const noteTextColorHex = (pc: number): string => {
  const c = noteColor(pc);
  const luminance =
    (0.299 * ((c >> 16) & 0xff) + 0.587 * ((c >> 8) & 0xff) + 0.114 * (c & 0xff)) / 255;
  return luminance > 0.55 ? '#1a1712' : '#f7f2e8';
};
