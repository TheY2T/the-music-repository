import { playTone } from '@/lib/audio';
import { CHORDS, INTERVAL_NAMES, midiToFrequency } from '@/lib/music-theory';

const BASE_MIDI = 48; // C3

export interface Deck {
  key: string;
  title: string;
  description: string;
  /** All card keys in the deck. */
  cards: string[];
  /** Play the question audio for a card (question is aural; the label is the answer). */
  play: (card: string) => void;
  /** The answer label revealed after "Show answer". */
  answer: (card: string) => string;
}

function randomRoot(range: number): number {
  return BASE_MIDI + Math.floor(Math.random() * range);
}

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
    cards: CHORDS.map((chord) => chord.key),
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
];

export function findDeck(key: string): Deck | undefined {
  return DECKS.find((d) => d.key === key);
}
