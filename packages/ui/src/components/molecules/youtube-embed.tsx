import { useState } from 'react';
import { cn } from '../../lib/utils';
import { Icon } from '../ui/icon';

export interface YouTubeEmbedProps {
  /** 11-character YouTube video id. */
  videoId: string;
  /** Video title — shown beside the thumbnail and used as the iframe accessible name. */
  title?: string;
  /** Optional one-line note shown under the title. */
  caption?: string;
  /** Poster image; defaults to YouTube's deterministic thumbnail for the id. */
  thumbnailUrl?: string;
  /** Playback start offset in seconds. */
  start?: number;
  /** Localized accessible label for the play action (e.g. "Play video"). */
  playLabel: string;
  className?: string;
}

/**
 * A privacy-friendly YouTube player: until the viewer presses play it is a compact inline preview — a
 * small thumbnail + title that reads as a video link. On click it expands to the `youtube-nocookie`
 * player, so the page ships none of YouTube's iframe weight (and sets no cookies) until asked.
 * Presentational, i18n-by-prop.
 */
export function YouTubeEmbed({
  videoId,
  title,
  caption,
  thumbnailUrl,
  start,
  playLabel,
  className,
}: YouTubeEmbedProps) {
  const [playing, setPlaying] = useState(false);
  const poster = thumbnailUrl ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1${
    start ? `&start=${start}` : ''
  }`;

  if (playing) {
    return (
      <div
        className={cn(
          'relative aspect-video w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-muted',
          className,
        )}
      >
        <iframe
          className="absolute inset-0 h-full w-full"
          src={src}
          title={title ?? playLabel}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={title ? `${playLabel}: ${title}` : playLabel}
      className={cn(
        'group flex w-full max-w-md items-center gap-3 rounded-lg border border-border p-2 text-left transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <span className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md bg-muted sm:w-36">
        <img
          src={poster}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-8 items-center justify-center rounded-full bg-background/85 shadow-sm transition group-hover:scale-105 group-hover:bg-background">
            <Icon name="play" className="size-4 translate-x-px text-primary" />
          </span>
        </span>
      </span>
      {title || caption ? (
        <span className="min-w-0 flex-1">
          {title ? (
            <span className="line-clamp-2 font-medium leading-snug text-foreground">{title}</span>
          ) : null}
          {caption ? (
            <span className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{caption}</span>
          ) : null}
        </span>
      ) : null}
    </button>
  );
}
