import type { Meta, StoryObj } from '@storybook/react-vite';
import ContentEmbeds, { type Embed } from './ContentEmbeds';

// Curated example: a spread of the preconfigured interactive tools a catalogue article can embed.
const meta: Meta = { title: 'MusicKit UI/Content/ContentEmbeds' };
export default meta;

const EMBEDS: Embed[] = [
  {
    tool: 'score',
    title: 'The melody',
    caption: 'A four-bar phrase in C major — press play to hear it.',
    tex: ':4 c4 d4 e4 f4 | g4 a4 b4 c5',
  },
  {
    tool: 'chord-diagrams',
    title: 'Open chords',
    caption: 'The shapes this piece uses. Click a diagram to strum it.',
    instrument: 'guitar',
    chords: ['C', 'G', 'Am', 'F'],
  },
  {
    tool: 'progression',
    title: 'Play the progression',
    caption: 'I–V–vi–IV in C, one bar per chord.',
    key: 'C',
    chords: ['C', 'G', 'Am', 'F'],
    tempo: 100,
  },
  {
    tool: 'chord-board',
    title: 'Hear each chord',
    caption: 'Tap a pad to sound the chord.',
    chords: ['C', 'G', 'Am', 'F'],
    labels: ['I', 'V', 'vi', 'IV'],
  },
  {
    tool: 'scale-boxes',
    title: 'C major — fretboard shapes',
    caption: 'The five movable box positions.',
    root: 'C',
    scale: 'major',
  },
  {
    tool: 'keyboard',
    title: 'Explore on the keyboard',
    caption: 'The C major scale lit up on a 49-key board.',
    root: 'C',
    scale: 'major',
    size: 49,
  },
  { tool: 'circle-of-fifths', title: 'Circle of fifths' },
];

export const Default: StoryObj = {
  render: () => <ContentEmbeds embeds={EMBEDS} locale="en" interactive />,
};

export const SingleScore: StoryObj = {
  name: 'Just a score',
  render: () => <ContentEmbeds embeds={[EMBEDS[0] as Embed]} locale="en" interactive />,
};
