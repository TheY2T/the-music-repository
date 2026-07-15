import type { ContentDetail as ContentDetailDto } from '@TheY2T/tmr-api-client';
import { type Locale, type MessageKey, t } from '@TheY2T/tmr-i18n';
import { ChordDiagram } from '@TheY2T/tmr-ui/music';
import { lazy, Suspense } from 'react';
import { playTone } from '@/lib/audio';
import { findChordShape, noteNameToPitchClass, tuningFor } from '@/lib/embeds';
import { midiToFrequency } from '@/lib/music-theory';

/**
 * Renders the preconfigured interactive tools authored on a catalogue article (`item.embeds`), in
 * order, below the prose. Each embed is a titled card hosting one tool island. Tools are lazy-loaded so
 * a page only ships the islands its embeds actually use. Presentational + i18n-by-prop (ADR: content
 * embeds); the embed → tool mapping is the single registry below.
 */
export type Embed = NonNullable<ContentDetailDto['embeds']>[number];

const ScorePlayer = lazy(() => import('@/components/ScorePlayer'));
const PianoKeyboard = lazy(() => import('@/components/PianoKeyboard'));
const ScaleBoxes = lazy(() => import('@/components/ScaleBoxes'));
const ProgressionPlayer = lazy(() => import('@/components/ProgressionPlayer'));
const CircleOfFifths = lazy(() => import('@/components/CircleOfFifths'));
const StrumPattern = lazy(() => import('@/components/StrumPattern'));
const ChordBoard = lazy(() => import('@/components/ChordBoard'));
const Rhythm = lazy(() => import('@/components/Rhythm'));
const Intervals = lazy(() => import('@/components/Intervals'));
const Fingering = lazy(() => import('@/components/Fingering'));

/** Fallback heading per tool when an embed doesn't author its own `title`. */
const DEFAULT_TITLE: Record<Embed['tool'], MessageKey> = {
  score: 'embed.score',
  keyboard: 'embed.keyboard',
  'scale-boxes': 'embed.scaleBoxes',
  'chord-diagrams': 'embed.chords',
  progression: 'embed.progression',
  'circle-of-fifths': 'embed.circleOfFifths',
  strum: 'embed.strum',
  rhythm: 'embed.rhythm',
  'chord-board': 'embed.chordBoard',
  intervals: 'embed.intervals',
  fingering: 'embed.fingering',
};

/** Sound a chord shape low→high (a light "strum"), given open-string MIDI for the instrument. */
function strum(frets: number[], tuning: number[]): void {
  let delay = 0;
  for (let i = 0; i < frets.length; i += 1) {
    const fret = frets[i];
    if (fret < 0) continue;
    const midi = tuning[i] + fret;
    window.setTimeout(() => playTone(midiToFrequency(midi), 1.1), delay);
    delay += 24;
  }
}

/** A row of tappable chord diagrams for the embed's chord symbols (guitar or ukulele). */
function ChordDiagramRow({ embed, locale }: { embed: Embed; locale: Locale }) {
  const tuning = tuningFor(embed.instrument);
  const symbols = embed.chords ?? [];
  return (
    <div className="flex flex-wrap gap-4">
      {symbols.map((symbol, i) => {
        const shape = findChordShape(symbol, embed.instrument);
        if (!shape) {
          return (
            <span
              key={`${symbol}-${i}`}
              className="rounded-lg border border-border p-2 text-sm text-muted-foreground"
            >
              {symbol}
            </span>
          );
        }
        return (
          <button
            type="button"
            key={`${symbol}-${i}`}
            onClick={() => strum(shape.frets, tuning)}
            className="flex flex-col items-center gap-1 rounded-lg border border-border p-2 transition-colors hover:bg-accent/15"
            aria-label={t(locale, 'embed.playChord').replace('{chord}', symbol)}
          >
            <ChordDiagram chord={shape} />
            <span className="text-sm font-semibold">{symbol}</span>
          </button>
        );
      })}
    </div>
  );
}

function EmbedBody({
  embed,
  locale,
  interactive,
}: {
  embed: Embed;
  locale: Locale;
  interactive: boolean;
}) {
  switch (embed.tool) {
    case 'score':
      return embed.tex ? (
        <ScorePlayer
          tex={embed.tex}
          locale={locale}
          mode={embed.mode ?? 'standard'}
          tuning={embed.tuning ?? null}
          interactive={interactive}
        />
      ) : null;
    case 'keyboard':
      return (
        <PianoKeyboard
          scaleHighlight
          defaultRoot={noteNameToPitchClass(embed.root)}
          defaultScale={embed.scale ?? 'major'}
          defaultSize={embed.size ?? 49}
        />
      );
    case 'scale-boxes':
      return (
        <ScaleBoxes root={noteNameToPitchClass(embed.root) ?? undefined} scale={embed.scale} />
      );
    case 'chord-diagrams':
      return <ChordDiagramRow embed={embed} locale={locale} />;
    case 'progression':
      return <ProgressionPlayer chords={embed.chords} />;
    case 'circle-of-fifths':
      return <CircleOfFifths />;
    case 'strum':
      return (
        <StrumPattern
          pattern={embed.pattern ?? []}
          chords={embed.chords}
          tempo={embed.tempo}
          instrument={embed.instrument}
          locale={locale}
        />
      );
    case 'chord-board':
      return <ChordBoard chords={embed.chords ?? []} labels={embed.labels} locale={locale} />;
    case 'rhythm':
      return <Rhythm values={embed.pattern ?? []} tempo={embed.tempo} locale={locale} />;
    case 'intervals':
      return <Intervals root={embed.root} locale={locale} />;
    case 'fingering':
      return (
        <Fingering
          instrument={embed.instrument}
          tuning={embed.tuning}
          root={embed.root}
          scale={embed.scale}
          locale={locale}
        />
      );
    default:
      return null;
  }
}

/** One embed as a titled card + its (lazy) tool island. Reused inline by `ContentBody` and stacked by
 * `ContentEmbeds`. */
export function EmbedCard({
  embed,
  locale,
  interactive,
}: {
  embed: Embed;
  locale: Locale;
  interactive: boolean;
}) {
  return (
    <section className="space-y-2">
      <h3 className="font-display text-lg font-semibold">
        {embed.title ?? t(locale, DEFAULT_TITLE[embed.tool])}
      </h3>
      {embed.caption ? <p className="text-sm text-muted-foreground">{embed.caption}</p> : null}
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">{t(locale, 'score.loading')}</p>}
      >
        <EmbedBody embed={embed} locale={locale} interactive={interactive} />
      </Suspense>
    </section>
  );
}

/** Stacked fallback: render every embed in order (used when the body has no inline markers). */
export default function ContentEmbeds({
  embeds,
  locale,
  interactive,
}: {
  embeds: Embed[] | undefined;
  locale: Locale;
  interactive: boolean;
}) {
  if (!embeds?.length) return null;
  return (
    <div className="space-y-6">
      {embeds.map((embed, i) => (
        <EmbedCard
          key={`${embed.tool}-${i}`}
          embed={embed}
          locale={locale}
          interactive={interactive}
        />
      ))}
    </div>
  );
}
