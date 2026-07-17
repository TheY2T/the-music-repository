import {
  type CollectionPreviewPayload,
  PREVIEW_MESSAGE,
} from '@TheY2T/tmr-web-data/preview-protocol';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import CollectionPreview from './CollectionPreview';

// CollectionPreview is the iframe side of the live block-editor preview — it waits for a `postMessage`
// payload from the editor pane. This story simulates that pane with a real collection payload.
const meta: Meta = { title: 'Common UI/Admin/Block Editor/CollectionPreview' };
export default meta;

const PAYLOAD: CollectionPreviewPayload = {
  title: 'Baroque Keyboard Essentials',
  summary: 'The Bach staples every developing keyboard player should know.',
  bodyMdx: 'Baroque keyboard music teaches independence of the hands like nothing else.',
  kind: 'course',
  featured: true,
  curatorName: 'The Music Repository',
  difficultyMin: 2,
  difficultyMax: 6,
  estMinutes: 360,
  outcomes: ['Voice two independent lines', 'Shape Baroque phrases without a pedal'],
  ungrouped: [],
  sections: [
    {
      title: 'Warming to the Style',
      description: 'Start gentle before the counterpoint.',
      items: [
        {
          slug: 'bach-minuet-in-g',
          title: 'Bach — Minuet in G',
          type: 'score',
          curatorNote: 'Detached left hand, singing right.',
          focusSkills: ['articulation'],
        },
        { slug: 'bach-prelude-c-major-bwv-846', title: 'Prelude in C, BWV 846', type: 'score' },
      ],
    },
  ],
};

export const Default: StoryObj = {
  render: function CollectionPreviewDemo() {
    useEffect(() => {
      const t = setTimeout(
        () =>
          window.postMessage({ type: PREVIEW_MESSAGE, payload: PAYLOAD }, window.location.origin),
        200,
      );
      return () => clearTimeout(t);
    }, []);
    return <CollectionPreview locale="en" />;
  },
};
