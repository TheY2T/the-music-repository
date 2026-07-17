/** Staff-rendering geometry shared by the music organisms (treble-staff coordinate math). */

/** Even staff steps (ledger lines) needed to reach a note below or above the five lines (0–8). */
export function ledgerSteps(step: number): number[] {
  const lines: number[] = [];
  for (let s = -2; s >= step; s -= 2) {
    lines.push(s);
  }
  for (let s = 10; s <= step; s += 2) {
    lines.push(s);
  }
  return lines;
}
