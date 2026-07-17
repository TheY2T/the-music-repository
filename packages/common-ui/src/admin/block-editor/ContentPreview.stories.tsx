import { PREVIEW_MESSAGE, type PreviewPayload } from '@TheY2T/tmr-web-data/preview-protocol';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import ContentPreview from './ContentPreview';

// ContentPreview is the iframe side of the live block-editor preview — it waits for a `postMessage`
// payload from the editor pane. This story simulates that pane by posting a real article payload.
const meta: Meta = { title: 'Common UI/Admin/Block Editor/ContentPreview' };
export default meta;

const PAYLOAD: PreviewPayload = {
  title: 'Twelve-Bar Blues in A',
  summary: 'Learn the most important form in blues and rock.',
  bodyMdx:
    '## The three chords\n\nIn A, the I–IV–V chords are `A7`, `D7`, and `E7` — dominant sevenths ' +
    'give the blues its bite. Tap each shape below to hear its voicing.\n\n' +
    '## The 12-bar pattern\n\nEach measure gets four beats. Play four bars of A7, two of D7, two of ' +
    'A7, then the turnaround: E7, D7, A7, E7.',
  embeds: [
    { tool: 'chord-diagrams', title: 'The three chords', chords: ['A7', 'D7', 'E7'] },
  ] as unknown as PreviewPayload['embeds'],
};

export const Default: StoryObj = {
  render: function ContentPreviewDemo() {
    // Post the payload once ContentPreview has mounted + signalled ready (it listens for messages).
    useEffect(() => {
      const send = () =>
        window.postMessage({ type: PREVIEW_MESSAGE, payload: PAYLOAD }, window.location.origin);
      const t = setTimeout(send, 200);
      return () => clearTimeout(t);
    }, []);
    return <ContentPreview locale="en" interactive />;
  },
};
