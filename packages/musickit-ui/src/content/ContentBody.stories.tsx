import type { Meta, StoryObj } from '@storybook/react-vite';
import ContentBody from './ContentBody';
import type { Embed } from './ContentEmbeds';

// Curated example: a catalogue article body with interactive tool embeds interleaved INLINE at the
// `<div data-tmr-embed="N">` markers the content build leaves behind.
const meta: Meta = { title: 'MusicKit UI/Content/ContentBody' };
export default meta;

const EMBEDS: Embed[] = [
  { tool: 'score', title: 'The main theme', tex: ':4 c4 d4 e4 f4 | g4 a4 b4 c5' },
  {
    tool: 'chord-diagrams',
    title: 'The chords',
    instrument: 'guitar',
    chords: ['C', 'G', 'Am', 'F'],
  },
  {
    tool: 'progression',
    title: 'Play along',
    key: 'C',
    chords: ['C', 'G', 'Am', 'F'],
    tempo: 100,
  },
];

const BODY_HTML = `
<h2>A first look at I–V–vi–IV</h2>
<p>This progression powers a huge share of pop songs. We’ll learn the melody, the four chords, and
then play the whole thing along to a click. Start by listening to the theme:</p>
<div data-tmr-embed="0"></div>
<h3>The four chords</h3>
<p>Every bar is one chord. Here are the open shapes — click any diagram to hear it strummed:</p>
<div data-tmr-embed="1"></div>
<blockquote>Tip: keep your strumming hand moving steadily even when a chord changes.</blockquote>
<h3>Putting it together</h3>
<ul>
  <li>Count "1 &amp; 2 &amp; 3 &amp; 4 &amp;" out loud.</li>
  <li>Change chords on beat 1 of each bar.</li>
  <li>Start slow, then raise the tempo.</li>
</ul>
<p>When you’re ready, play along with the backing progression:</p>
<div data-tmr-embed="2"></div>
<p>Nicely done — that’s a complete song section under your fingers.</p>
`;

export const Default: StoryObj = {
  name: 'Article with inline embeds',
  render: () => <ContentBody bodyHtml={BODY_HTML} embeds={EMBEDS} locale="en" interactive />,
};

export const ProseOnly: StoryObj = {
  name: 'Prose only (no embeds)',
  render: () => (
    <ContentBody
      bodyHtml={
        '<h2>About this piece</h2><p>A short prose-only article body with no tool embeds.</p>'
      }
      embeds={undefined}
      locale="en"
      interactive
    />
  ),
};
