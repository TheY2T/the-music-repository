import { type HelpPreviewPayload, PREVIEW_MESSAGE } from '@TheY2T/tmr-web-acl/preview-protocol';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import HelpPreview from './HelpPreview';

// HelpPreview is the iframe side of the live block-editor preview — it waits for a `postMessage`
// payload from the editor pane. This story simulates that pane with a real help-topic payload.
const meta: Meta = { title: 'Common UI/Admin/Block Editor/HelpPreview' };
export default meta;

const PAYLOAD: HelpPreviewPayload = {
  term: 'Dominant seventh',
  body: 'A major triad with a minor seventh added (e.g. G–B–D–F). Its restless sound wants to resolve down a fifth, which is why it drives blues turnarounds and V–I cadences.',
};

export const Default: StoryObj = {
  render: function HelpPreviewDemo() {
    useEffect(() => {
      const t = setTimeout(
        () =>
          window.postMessage({ type: PREVIEW_MESSAGE, payload: PAYLOAD }, window.location.origin),
        200,
      );
      return () => clearTimeout(t);
    }, []);
    return <HelpPreview locale="en" />;
  },
};
