import type { ReactNode } from 'react';
import StaffNotePrompt from '@/components/StaffNotePrompt';
import { playTone } from '@/lib/audio';
import {
  CHORDS,
  chordsByLevel,
  INTERVAL_NAMES,
  midiToFrequency,
  trebleStaffNotes,
} from '@/lib/music-theory';

const BASE_MIDI = 48; // C3

export interface Deck {
  key: string;
  title: string;
  description: string;
  /** All card keys in the deck. */
  cards: string[];
  /** Play the question audio for a card (aural decks). */
  play?: (card: string) => void;
  /** Render a visual question for a card (reading decks). */
  prompt?: (card: string) => ReactNode;
  /** The answer label revealed after "Show answer". */
  answer: (card: string) => string;
}

function randomRoot(range: number): number {
  return BASE_MIDI + Math.floor(Math.random() * range);
}

const STAFF_NOTES = trebleStaffNotes();

const SCALE_DEGREES = [
  { semitones: 0, name: '1 (Tonic)' },
  { semitones: 2, name: '2 (Supertonic)' },
  { semitones: 4, name: '3 (Mediant)' },
  { semitones: 5, name: '4 (Subdominant)' },
  { semitones: 7, name: '5 (Dominant)' },
  { semitones: 9, name: '6 (Submediant)' },
  { semitones: 11, name: '7 (Leading tone)' },
];

export const DECKS: Deck[] = [
  {
    key: 'intervals',
    title: 'Interval recognition',
    description: 'Hear two notes; name the interval.',
    cards: INTERVAL_NAMES.map((_, semitones) => String(semitones)),
    play(card) {
      const semitones = Number(card);
      const root = randomRoot(24);
      playTone(midiToFrequency(root), 0.7);
      window.setTimeout(() => playTone(midiToFrequency(root + semitones), 0.7), 550);
    },
    answer(card) {
      return INTERVAL_NAMES[Number(card)];
    },
  },
  {
    key: 'chord-quality',
    title: 'Chord quality',
    description: 'Hear a chord; name its quality.',
    // Beginner + intermediate qualities only — the advanced/extended chords in CHORDS are too
    // fine-grained to distinguish by ear in a recognition drill.
    cards: chordsByLevel('intermediate').map((chord) => chord.key),
    play(card) {
      const chord = CHORDS.find((c) => c.key === card);
      if (!chord) {
        return;
      }
      const root = randomRoot(12);
      for (const interval of chord.intervals) {
        playTone(midiToFrequency(root + interval), 1.1);
      }
    },
    answer(card) {
      return CHORDS.find((c) => c.key === card)?.name ?? card;
    },
  },
  {
    key: 'scale-degrees',
    title: 'Scale degrees',
    description: 'Hear the tonic then a note; name the scale degree.',
    cards: SCALE_DEGREES.map((d) => String(d.semitones)),
    play(card) {
      const semitones = Number(card);
      const tonic = randomRoot(12);
      playTone(midiToFrequency(tonic), 0.6);
      window.setTimeout(() => playTone(midiToFrequency(tonic + semitones), 0.7), 600);
    },
    answer(card) {
      return SCALE_DEGREES.find((d) => String(d.semitones) === card)?.name ?? card;
    },
  },
  {
    key: 'staff-notes',
    title: 'Note reading',
    description: 'Read a note on the treble staff; name it.',
    cards: STAFF_NOTES.map((note) => note.name),
    prompt(card) {
      const note = STAFF_NOTES.find((n) => n.name === card);
      return <StaffNotePrompt step={note?.step ?? 0} />;
    },
    answer(card) {
      return card;
    },
  },
];

export function findDeck(key: string): Deck | undefined {
  return DECKS.find((d) => d.key === key);
}
