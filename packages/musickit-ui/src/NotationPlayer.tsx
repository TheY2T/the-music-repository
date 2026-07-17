import type { Locale } from '@TheY2T/tmr-i18n';
import { pitchName, ROOT_CHOICES } from '@TheY2T/tmr-music-core/music-theory';
import {
  type MelodyNote,
  melodyToAlphaTex,
  midiToAlphaTexPitch,
  noteNameToMidi,
} from '@TheY2T/tmr-music-core/score/alphatex';
import { Select } from '@TheY2T/tmr-ui';
import { useState } from 'react';
import ScorePlayer from './ScorePlayer';

// The pieces are all in C major; transpose from C, staying within ±6 semitones for readability.
const transposeForRoot = (root: number) => (root <= 6 ? root : root - 12);

// Public-domain melodies (single-line, natural notes only), with per-note durations in beats.
const PIECES = [
  {
    key: 'ode',
    title: 'Ode to Joy — Beethoven',
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
  },
  {
    key: 'twinkle',
    title: 'Twinkle, Twinkle',
    names: ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4'],
    beats: [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2],
  },
  {
    key: 'mary',
    title: 'Mary Had a Little Lamb',
    names: ['E4', 'D4', 'C4', 'D4', 'E4', 'E4', 'E4', 'D4', 'D4', 'D4', 'E4', 'G4', 'G4'],
    beats: [1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2],
  },
  {
    key: 'scale',
    title: 'C major scale',
    names: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
    beats: [1, 1, 1, 1, 1, 1, 1, 2],
  },
  {
    key: 'rests',
    title: 'Rhythm study (with rests)',
    names: ['C4', 'R', 'E4', 'R', 'G4', 'R', 'C5'],
    beats: [1, 1, 1, 1, 1, 1, 2],
  },
];

/**
 * `/tools/player` — a public-domain melody player (ADR 0027; was a StaffSequence + setTimeout cursor).
 * The selected piece (optionally transposed) is generated as alphaTex and rendered/played by the shared
 * {@link ScorePlayer}, which brings staff notation, playback cursor, tempo, A–B loop, and metronome.
 */
export default function NotationPlayer({ locale }: { locale: Locale }) {
  const [pieceKey, setPieceKey] = useState('ode');
  const [root, setRoot] = useState(0);

  const piece = PIECES.find((p) => p.key === pieceKey) ?? PIECES[0];
  const transpose = transposeForRoot(root);
  const flats = transpose < 0;

  const melody: MelodyNote[] = piece.names.map((name, i) => {
    if (name === 'R') return { name: null, beats: piece.beats[i] };
    const midi = (noteNameToMidi(name) ?? 60) + transpose;
    return { name: midiToAlphaTexPitch(midi, flats), beats: piece.beats[i] };
  });
  const tex = melodyToAlphaTex(melody, { title: piece.title, tempo: 100 });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Piece</span>
          <Select
            value={pieceKey}
            onChange={(e) => setPieceKey(e.target.value)}
            className="h-auto w-auto px-2 py-1"
          >
            {PIECES.map((p) => (
              <option key={p.key} value={p.key}>
                {p.title}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium" data-help="transpose">
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
      </div>

      {/* Re-key on piece + transpose so the score reloads. ScorePlayer owns play/tempo/loop/metronome. */}
      <ScorePlayer
        key={`${pieceKey}:${root}`}
        tex={tex}
        mode="standard"
        locale={locale}
        interactive
      />
    </div>
  );
}
