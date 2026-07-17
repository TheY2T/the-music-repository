import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Badge, Card, Chip, Icon, StatTile } from '@TheY2T/tmr-ui';
import {
  type CollectionPreviewItem,
  type CollectionPreviewPayload,
  isPreviewMessage,
  PREVIEW_READY,
} from '@TheY2T/tmr-web-data/preview-protocol';
import { marked } from 'marked';
import { useEffect, useState } from 'react';

/**
 * Iframe-side of the collection live preview (Phase C): renders the collection detail layout —
 * header, stat tiles, outcomes, intro prose, and chaptered item rows — from a `postMessage` payload,
 * mirroring the public `CollectionDetail` (without the engagement/progress controls).
 */
function ItemRow({
  item,
  position,
  locale,
}: {
  item: CollectionPreviewItem;
  position: number;
  locale: Locale;
}) {
  return (
    <li>
      <Card className="flex items-center gap-4 p-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/15 font-display text-sm font-semibold text-accent tabular-nums">
          {position}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-display font-semibold leading-snug">{item.title}</span>
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{item.type}</Badge>
          </span>
          {item.curatorNote ? (
            <span className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground/80">
                {t(locale, 'collections.curatorNote')}
              </span>{' '}
              {item.curatorNote}
            </span>
          ) : null}
          {item.focusSkills && item.focusSkills.length > 0 ? (
            <span className="flex flex-wrap gap-1.5 pt-0.5">
              {item.focusSkills.map((skill) => (
                <Chip key={skill} variant="muted">
                  {skill}
                </Chip>
              ))}
            </span>
          ) : null}
        </div>
      </Card>
    </li>
  );
}

export default function CollectionPreview({ locale }: { locale: Locale }) {
  const [payload, setPayload] = useState<CollectionPreviewPayload | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || !isPreviewMessage(event.data)) {
        return;
      }
      setPayload(event.data.payload as CollectionPreviewPayload);
    };
    window.addEventListener('message', onMessage);
    window.parent?.postMessage({ type: PREVIEW_READY }, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  if (!payload) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        {t(locale, 'blockEditor.previewWaiting')}
      </p>
    );
  }

  const bodyHtml = marked.parse(payload.bodyMdx || '', { async: false });
  const total = payload.ungrouped.length + payload.sections.reduce((n, s) => n + s.items.length, 0);
  let position = 0;
  const nextPosition = () => (position += 1);

  return (
    <article className="mx-auto max-w-3xl space-y-8 px-6 py-8">
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{payload.kind}</Badge>
          {payload.featured ? (
            <Badge variant="warning">
              <Icon name="sparkles" className="size-3" />
              {t(locale, 'collections.featuredBadge')}
            </Badge>
          ) : null}
        </div>
        <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight">
          {payload.title || t(locale, 'blockEditor.previewUntitled')}
        </h1>
        {payload.summary ? (
          <p className="text-lg text-muted-foreground">{payload.summary}</p>
        ) : null}
        {payload.curatorName ? (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Icon name="user" className="size-4" />
            {t(locale, 'collections.byCurator', { curator: payload.curatorName })}
          </p>
        ) : null}
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {payload.difficultyMin != null ? (
          <StatTile
            iconName="gauge"
            label={t(locale, 'collections.statDifficulty')}
            value={t(locale, 'collections.difficultyRange', {
              min: payload.difficultyMin,
              max: payload.difficultyMax ?? payload.difficultyMin,
            })}
          />
        ) : null}
        {payload.estMinutes ? (
          <StatTile
            iconName="clock"
            label={t(locale, 'collections.statDuration')}
            value={
              payload.estMinutes >= 60
                ? t(locale, 'collections.durationHours', {
                    hours: Math.round(payload.estMinutes / 60),
                  })
                : t(locale, 'collections.durationMinutes', { minutes: payload.estMinutes })
            }
          />
        ) : null}
        <StatTile
          iconName="list-music"
          label={t(locale, 'collections.statItems')}
          value={`${total}`}
        />
      </div>

      {payload.outcomes.length > 0 ? (
        <Card className="space-y-2.5 p-5">
          <p className="font-display font-semibold">{t(locale, 'collections.whatYouLearn')}</p>
          <ul className="grid gap-1.5">
            {payload.outcomes.map((outcome) => (
              <li key={outcome} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Icon name="circle-check" className="mt-0.5 size-4 shrink-0 text-success" />
                {outcome}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {payload.bodyMdx.trim() ? (
        <div
          className="prose max-w-none prose-headings:font-display dark:prose-invert"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: admin-authored markdown preview.
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      ) : null}

      {payload.ungrouped.length > 0 ? (
        <ol className="space-y-3">
          {payload.ungrouped.map((item) => (
            <ItemRow key={item.slug} item={item} position={nextPosition()} locale={locale} />
          ))}
        </ol>
      ) : null}

      {payload.sections.map((section) =>
        section.items.length ? (
          <section key={section.title} className="space-y-3">
            <div className="space-y-1 border-b border-border pb-2">
              <h2 className="font-display text-xl font-semibold tracking-tight">{section.title}</h2>
              {section.description ? (
                <p className="text-sm text-muted-foreground">{section.description}</p>
              ) : null}
            </div>
            <ol className="space-y-3">
              {section.items.map((item) => (
                <ItemRow key={item.slug} item={item} position={nextPosition()} locale={locale} />
              ))}
            </ol>
          </section>
        ) : null,
      )}
    </article>
  );
}
