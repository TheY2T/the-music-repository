import type { Locale } from '@TheY2T/tmr-i18n';
import ContentEmbeds, { type Embed, EmbedCard } from './ContentEmbeds';

/**
 * Renders a catalogue article body with interactive tool embeds interleaved **inline** where they were
 * authored. The build (`build-seed-content.mjs`) leaves a `<div data-tmr-embed="N">` marker in the
 * rendered HTML at each embed's position; this splits the HTML on those markers and renders alternating
 * prose chunks (`.prose`) and `EmbedCard`s, so a tool replaces the static example exactly where it sits.
 * If the body has no markers (older content), it falls back to prose + any embeds stacked below.
 */
const MARKER = /<div data-tmr-embed="(\d+)"><\/div>/g;

export default function ContentBody({
  bodyHtml,
  embeds,
  locale,
  interactive,
}: {
  bodyHtml: string;
  embeds: Embed[] | undefined;
  locale: Locale;
  interactive: boolean;
}) {
  const proseClass = 'prose max-w-none prose-headings:font-display';

  // No embeds, or the body carries no inline markers → prose as one block, embeds (if any) stacked below.
  if (!embeds?.length || !MARKER.test(bodyHtml)) {
    MARKER.lastIndex = 0;
    return (
      <>
        {bodyHtml ? (
          // biome-ignore lint/security/noDangerouslySetInnerHtml: rendered from trusted seeded/CMS markdown via marked.
          <section className={proseClass} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        ) : null}
        <ContentEmbeds embeds={embeds} locale={locale} interactive={interactive} />
      </>
    );
  }
  MARKER.lastIndex = 0;

  // Split into [html, index, html, index, …] and interleave prose chunks with inline embed cards.
  const parts = bodyHtml.split(MARKER);
  const seen = new Set<number>();
  const nodes = parts.map((part, i) => {
    if (i % 2 === 0) {
      return part.trim() ? (
        <section
          // biome-ignore lint/suspicious/noArrayIndexKey: static, ordered segments of one rendered body.
          key={`html-${i}`}
          className={proseClass}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: rendered from trusted seeded/CMS markdown via marked.
          dangerouslySetInnerHTML={{ __html: part }}
        />
      ) : null;
    }
    const idx = Number(part);
    const embed = embeds[idx];
    if (!embed) return null;
    seen.add(idx);
    return (
      <EmbedCard key={`embed-${idx}`} embed={embed} locale={locale} interactive={interactive} />
    );
  });

  // Safety: render any embed not referenced by a marker (shouldn't happen) at the end.
  const orphans = embeds.filter((_, i) => !seen.has(i));

  return (
    <div className="space-y-6">
      {nodes}
      {orphans.length ? (
        <ContentEmbeds embeds={orphans} locale={locale} interactive={interactive} />
      ) : null}
    </div>
  );
}
