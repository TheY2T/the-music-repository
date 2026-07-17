import type { Meta, StoryObj } from '@storybook/react-vite';
import AudioVisualizer from './AudioVisualizer';

// AudioVisualizer draws the shared audio-bus analyser. It needs a sized parent (it's `h-full w-full`)
// and live audio to animate — in Storybook it renders its idle canvas (play a tool elsewhere in the
// app to feed the bus).
const meta: Meta = { title: 'MusicKit UI/AudioVisualizer' };
export default meta;

export const Default: StoryObj = {
  render: () => (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Audio-reactive strip — animates when the shared audio bus is playing.
      </p>
      <div className="relative h-32 w-full overflow-hidden rounded-lg border border-border bg-card">
        <AudioVisualizer />
      </div>
    </div>
  ),
};
