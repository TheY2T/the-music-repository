import type { Locale } from '@TheY2T/tmr-i18n';
import { playTone } from '@TheY2T/tmr-music-core/audio';
import {
  diatonicChords,
  midiToFrequency,
  pitchName,
  ROOT_CHOICES,
} from '@TheY2T/tmr-music-core/music-theory';
import { midiToAlphaTexPitch } from '@TheY2T/tmr-music-core/score/alphatex';
import { Button, Select } from '@TheY2T/tmr-ui';
import { useState } from 'react';
import AlphaTexScore from './score/AlphaTexScore';

/** Stack a chord's pitch classes into ascending MIDI notes from the C4 octave up. */
function toAscending(pitchClasses: number[]): number[] {
  const out = [60 + pitchClasses[0]];
  for (let i = 1; i < pitchClasses.length; i += 1) {
    let midi = out[i - 1] - (out[i - 1] % 12) + pitchClasses[i];
    while (midi <= out[i - 1]) midi += 12;
    out.push(midi);
  }
  return out;
}

interface Column {
  roman: string;
  name: string;
  midis: number[];
}

function buildColumns(root: number, flats: boolean): Column[] {
  return diatonicChords(root, flats).map((chord) => ({
    roman: chord.roman,
    name: chord.name,
    midis: toAscending(chord.pitchClasses),
  }));
}

/** The seven diatonic triads engraved as stacked chords (one per bar) in alphaTex. */
function toAlphaTex(columns: Column[], root: number, flats: boolean): string {
  const bars = columns
    .map((col) => {
      const chord = col.midis.map((m) => midiToAlphaTexPitch(m, flats)).join(' ');
      return `:1 (${chord}){ch "${col.roman}"}`;
    })
    .join(' | ');
  return `\\title "Diatonic triads in ${pitchName(root)} major" \\tempo 90
.
\\track "Chords"
  \\staff{score} \\tuning piano
  \\ts (4 4)
  ${bars} |`;
}

export default function MultiVoiceStaff({ locale }: { locale: Locale }) {
  const [root, setRoot] = useState(0);
  const flats = [1, 3, 5, 8, 10].includes(root);
  const columns = buildColumns(root, flats);
  const tex = toAlphaTex(columns, root, flats);

  const playChord = (midis: number[]) => {
    for (const m of midis) playTone(midiToFrequency(m), 1.2);
  };

  return (
    <div className="space-y-4">
      <label className="space-y-1 text-sm">
        <span className="block font-medium" data-help="chords">
          Key
        </span>
        <Select
          value={root}
          onChange={(e) => setRoot(Number(e.target.value))}
          className="h-auto w-auto px-2 py-1"
        >
          {ROOT_CHOICES.map((pc) => (
            <option key={pc} value={pc}>
              {pitchName(pc)} major
            </option>
          ))}
        </Select>
      </label>

      {/* Engraved via alphaTab — proper stacked-chord notation with accidentals + roman-numeral labels.
          Re-keyed on the root so the score reloads when the key changes. Play = hear all seven in turn. */}
      <AlphaTexScore key={root} tex={tex} mode="standard" locale={locale} />

      <div className="flex flex-wrap gap-2">
        {columns.map((col) => (
          <Button
            key={col.roman}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => playChord(col.midis)}
          >
            {col.roman} · {col.name}
          </Button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        The seven diatonic triads of the key, engraved as stacked chords on the staff (with
        accidentals and roman-numeral labels). Click any chord to hear it, or press Play to walk
        through them.
      </p>
    </div>
  );
}
