import type { Meta, StoryObj } from '@storybook/react-vite';
import ToolsBrowser from './ToolsBrowser';

// A representative slice of the real /tools taxonomy so the browser shows searchable, filterable cards.
const CATEGORIES = [
  { key: 'keyboard-fretboard', label: 'Keyboard & Fretboard' },
  { key: 'chords', label: 'Chords & Harmony' },
  { key: 'theory', label: 'Theory' },
  { key: 'practice', label: 'Practice & Timing' },
  { key: 'ear', label: 'Ear Training' },
];

const TOOLS = [
  {
    slug: 'keyboard',
    title: 'Piano Keyboard',
    summary: 'Play and explore a labelled, resizable keyboard.',
    iconName: 'piano',
    href: '#',
    category: 'keyboard-fretboard',
  },
  {
    slug: 'fretboard',
    title: 'Guitar Fretboard',
    summary: 'Notes and shapes across the whole neck.',
    iconName: 'guitar',
    href: '#',
    category: 'keyboard-fretboard',
  },
  {
    slug: 'chords',
    title: 'Chord Builder',
    summary: 'Build any chord by root and quality, then hear it.',
    iconName: 'music',
    href: '#',
    category: 'chords',
  },
  {
    slug: 'progression',
    title: 'Progression Builder',
    summary: 'Sketch a chord progression and play it back.',
    iconName: 'music',
    href: '#',
    category: 'chords',
  },
  {
    slug: 'circle-of-fifths',
    title: 'Circle of Fifths',
    summary: 'Keys, signatures, and how they relate.',
    iconName: 'circle',
    href: '#',
    category: 'theory',
  },
  {
    slug: 'scale-explorer',
    title: 'Scale Explorer',
    summary: 'Every scale, on the keyboard and fretboard.',
    iconName: 'music',
    href: '#',
    category: 'theory',
  },
  {
    slug: 'metronome',
    title: 'Metronome',
    summary: 'Keep time with subdivisions and polyrhythms.',
    iconName: 'clock',
    href: '#',
    category: 'practice',
  },
  {
    slug: 'tuner',
    title: 'Tuner',
    summary: 'Tune by ear or with your microphone.',
    iconName: 'music',
    href: '#',
    category: 'practice',
  },
  {
    slug: 'ear-trainer',
    title: 'Ear Trainer',
    summary: 'Recognise intervals, chords, and progressions.',
    iconName: 'music',
    href: '#',
    category: 'ear',
  },
];

const STRINGS = {
  searchPlaceholder: 'Search tools…',
  all: 'All',
  noResults: 'No tools match your search.',
  recentlyViewed: 'Recently viewed',
  recentsClear: 'Clear',
};

const meta: Meta = { title: 'MusicKit UI/ToolsBrowser' };
export default meta;

export const Default: StoryObj = {
  render: () => <ToolsBrowser tools={TOOLS} categories={CATEGORIES} strings={STRINGS} />,
};
