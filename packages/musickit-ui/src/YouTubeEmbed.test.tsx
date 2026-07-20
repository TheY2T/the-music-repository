import { YouTubeEmbed } from '@TheY2T/tmr-ui';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { EmbedCard, type Embed } from './content/ContentEmbeds';

describe('YouTubeEmbed (facade)', () => {
  it('shows a compact thumbnail + play control and no iframe before interaction', () => {
    render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="A demo" playLabel="Play video" />);
    expect(document.querySelector('img')).toHaveAttribute(
      'src',
      'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    );
    expect(screen.getByRole('button', { name: /Play video/i })).toBeInTheDocument();
    expect(screen.getByText('A demo')).toBeInTheDocument();
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('loads the privacy-friendly iframe only after the viewer presses play', async () => {
    render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="A demo" start={30} playLabel="Play video" />);
    await userEvent.click(screen.getByRole('button', { name: /Play video/i }));
    const iframe = document.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('src')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&start=30',
    );
    expect(iframe?.getAttribute('title')).toBe('A demo');
  });

  it('prefers a supplied thumbnail over the deterministic one', () => {
    render(
      <YouTubeEmbed
        videoId="dQw4w9WgXcQ"
        thumbnailUrl="https://example.com/custom.jpg"
        playLabel="Play video"
      />,
    );
    expect(document.querySelector('img')).toHaveAttribute('src', 'https://example.com/custom.jpg');
  });
});

describe('YouTube embed in the block editor', () => {
  const unconfigured = { tool: 'youtube', videoUrl: '' } as Embed;

  it('shows a hollow placeholder card for an unconfigured video while editing', () => {
    const { container } = render(
      <EmbedCard embed={unconfigured} locale="en" interactive={false} editing />,
    );
    expect(container.querySelector('.border-dashed')).not.toBeNull();
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('renders nothing for an unconfigured video on the public read side', () => {
    const { container } = render(<EmbedCard embed={unconfigured} locale="en" interactive={false} />);
    expect(container.querySelector('.border-dashed')).toBeNull();
    expect(container.textContent?.trim()).toBe('');
  });
});
