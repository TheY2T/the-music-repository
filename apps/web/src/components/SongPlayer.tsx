import type { Locale } from '@TheY2T/tmr-i18n';
import { Select } from '@TheY2T/tmr-ui';
import { useState } from 'react';
import ScorePlayer from '@/components/ScorePlayer';
import { beatsToDuration, midiToAlphaTexPitch, noteNameToMidi } from '@/lib/score/alphatex';

interface Song {
  key: string;
  title: string;
  names: string[];
  beats: number[];
  /** One chord per bar (4 beats). */
  chords: string[];
}

const SONGS: Song[] = [
  {
    key: 'ode',
    title: 'Ode to Joy',
    names: [
      'E4',
      'E4',
      'F4',
      'G4',
      'G4',
      'F4',
      'E4',
      'D4',
      'C4',
      'C4',
      'D4',
      'E4',
      'E4',
      'D4',
      'D4',
    ],
    beats: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, 0.5, 2],
    chords: ['C', 'C', 'G', 'C'],
  },
  {
    key: 'twinkle',
    title: 'Twinkle, Twinkle',
    names: ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4'],
    beats: [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2],
    chords: ['C', 'F', 'C', 'G'],
  },
];

const ROOT_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Voice a chord name (`C`, `Am`, `G`, `F#dim`) as a root-position triad around C3. */
function chordToMidis(name: string): number[] {
  const m = name.match(/^([A-G])([#b]?)(.*)$/);
  if (!m) return [48, 52, 55];
  const [, letter, accidental, quality] = m;
  let pc = ROOT_PC[letter] + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0);
  pc = ((pc % 12) + 12) % 12;
  const intervals = quality.includes('dim')
    ? [0, 3, 6]
    : quality.startsWith('m') && !quality.startsWith('maj')
      ? [0, 3, 7]
      : [0, 4, 7];
  return intervals.map((i) => 48 + pc + i);
}

/** Melody track + (optionally) a chord track voiced from the per-bar chord names. */
function songToAlphaTex(song: Song, withChords: boolean): string {
  const melody = song.names
    .map((name, i) => {
      const { duration, dotted } = beatsToDuration(song.beats[i]);
      return `${midiToAlphaTexPitch(noteNameToMidi(name) ?? 60)}.${duration}${dotted ? '{d}' : ''}`;
    })
    .join(' ');
  const chordTrack = withChords
    ? `
\\track "Chords"
  \\staff{score} \\tuning piano \\instrument acousticguitarsteel
  \\ts (4 4)
  ${song.chords
    .map(
      (c) =>
        `:1 (${chordToMidis(c)
          .map((n) => midiToAlphaTexPitch(n))
          .join(' ')}){ch "${c}"}`,
    )
    .join(' | ')} |`
    : '';
  return `\\title "${song.title}" \\tempo 96
.
\\track "Melody"
  \\staff{score} \\tuning piano \\instrument acousticgrandpiano
  \\ts (4 4)
  ${melody} |${chordTrack}`;
}

/**
 * `/tools/song` — melody + chord accompaniment (ADR 0027; was StaffSequence + per-bar `strumChord`).
 * The melody and the per-bar chords are generated as a two-track alphaTex, so alphaTab renders + plays
 * both in sync. The chord-name row stays as a quick reference; toggle the chord track on/off.
 */
export default function SongPlayer({ locale }: { locale: Locale }) {
  const [songKey, setSongKey] = useState('ode');
  const [chordsOn, setChordsOn] = useState(true);
  const song = SONGS.find((s) => s.key === songKey) ?? SONGS[0];
  const tex = songToAlphaTex(song, chordsOn);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Song</span>
          <Select
            value={songKey}
            onChange={(e) => setSongKey(e.target.value)}
            className="h-auto w-auto px-2 py-1"
          >
            {SONGS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.title}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={chordsOn}
            onChange={(e) => setChordsOn(e.target.checked)}
          />
          Chords
        </label>
      </div>

      <div className="flex gap-2">
        {song.chords.map((name, i) => (
          <div
            key={`${name}-${i}`}
            className="flex-1 rounded-md border border-border px-2 py-1 text-center text-sm font-semibold"
          >
            {name}
          </div>
        ))}
      </div>

      <ScorePlayer
        key={`${songKey}:${chordsOn}`}
        tex={tex}
        mode="standard"
        locale={locale}
        interactive
      />

      <p className="text-xs text-muted-foreground">
        The melody is engraved on the staff; with chords on, alphaTab plays a chord under each bar.
        Turn chords off to practise the melody alone, or slow the tempo to learn it.
      </p>
    </div>
  );
}
