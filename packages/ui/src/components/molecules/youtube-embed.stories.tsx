import type { Meta, StoryObj } from '@storybook/react-vite';
import { YouTubeEmbed } from './youtube-embed';

const meta: Meta<typeof YouTubeEmbed> = {
  title: 'Molecules/YouTubeEmbed',
  component: YouTubeEmbed,
  args: {
    videoId: 'dQw4w9WgXcQ',
    title: 'A demonstration performance',
    caption: 'Watch it performed',
    playLabel: 'Play video',
  },
};
export default meta;

type Story = StoryObj<typeof YouTubeEmbed>;

/** Facade state — a compact inline preview; the iframe loads only on click. */
export const Facade: Story = {
  render: (args) => (
    <div className="max-w-xl">
      <YouTubeEmbed {...args} />
    </div>
  ),
};

/** Without a supplied thumbnail it falls back to YouTube's deterministic poster for the id. */
export const DefaultThumbnail: Story = {
  args: { thumbnailUrl: undefined },
  render: (args) => (
    <div className="max-w-xl">
      <YouTubeEmbed {...args} />
    </div>
  ),
};
