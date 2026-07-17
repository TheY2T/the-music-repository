import type { ProgressSummary } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import {
  Button,
  buttonVariants,
  Card,
  cn,
  EmptyState,
  Field,
  Icon,
  Input,
  Progress,
  StatTile,
} from '@TheY2T/tmr-ui';
import { listSavedCollectionSlugs } from '@TheY2T/tmr-web-data/collections-api';
import { getProgress, logPractice } from '@TheY2T/tmr-web-data/progress-api';
import { type FormEvent, useEffect, useState } from 'react';

export default function ProgressDashboard({
  locale,
  includeSaved = false,
}: {
  locale: Locale;
  /** Also list collections the learner has bookmarked (even at 0 progress) — gated on the bookmarks flag. */
  includeSaved?: boolean;
}) {
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [minutes, setMinutes] = useState('20');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getProgress().then((result) => {
      setSummary(result);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!includeSaved) return;
    listSavedCollectionSlugs().then((slugs) => setSaved(new Set(slugs)));
  }, [includeSaved]);

  async function onLog(event: FormEvent) {
    event.preventDefault();
    const value = Number(minutes);
    if (!Number.isFinite(value) || value <= 0) {
      return;
    }
    setBusy(true);
    const updated = await logPractice(value);
    if (updated) {
      setSummary(updated);
    }
    setBusy(false);
  }

  if (!loaded) {
    return <p className="text-sm text-muted-foreground">{t(locale, 'prog.loading')}</p>;
  }
  if (!summary) {
    return (
      <EmptyState
        icon={<Icon name="alert-triangle" className="size-6" />}
        title={t(locale, 'prog.loadError')}
      />
    );
  }

  const streak = summary.currentStreakDays;
  // "My progress" lists the collections the learner is actually engaged with — ones they've started
  // (≥1 completed item) plus, when bookmarks are enabled, ones they've saved. A collection they've
  // never touched isn't progress, it's the catalogue. In-progress collections sort ahead of
  // saved-but-unstarted ones (stable within each group).
  const myCollections = summary.collections
    .filter((collection) => collection.completedItems > 0 || saved.has(collection.slug))
    .sort((a, b) => Number(b.completedItems > 0) - Number(a.completedItems > 0));

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          iconName="circle-check"
          label={t(locale, 'prog.itemsCompleted')}
          value={summary.completedCount}
        />
        <StatTile
          iconName="flame"
          label={t(locale, 'prog.dayStreakLabel')}
          value={t(locale, streak === 1 ? 'prog.dayStreakOne' : 'prog.dayStreakOther', {
            count: streak,
          })}
        />
        <StatTile
          iconName="clock"
          label={t(locale, 'prog.practiceMinutes')}
          value={summary.totalPracticeMinutes}
        />
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          {t(locale, 'prog.collections')}
        </h2>
        {myCollections.length === 0 ? (
          <EmptyState
            icon={<Icon name="library" className="size-6" />}
            title={t(locale, 'prog.noCollections')}
            description={t(locale, 'prog.noCollectionsDesc')}
            action={
              <a
                href={localizedPath(locale, '/collections')}
                className={cn(buttonVariants({ size: 'sm' }))}
              >
                <Icon name="compass" className="size-4" />
                {t(locale, 'prog.noCollectionsCta')}
              </a>
            }
          />
        ) : (
          <ul className="space-y-4">
            {myCollections.map((collection) => {
              const percent =
                collection.totalItems === 0
                  ? 0
                  : Math.round((collection.completedItems / collection.totalItems) * 100);
              return (
                <li key={collection.slug} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <a
                      href={localizedPath(locale, `/collections/${collection.slug}`)}
                      className="font-medium text-foreground hover:text-accent hover:underline"
                    >
                      {collection.title}
                    </a>
                    <span className="tabular-nums text-muted-foreground">
                      {collection.completedItems}/{collection.totalItems}
                    </span>
                  </div>
                  <Progress value={percent} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Card className="space-y-3 p-6">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          {t(locale, 'prog.logPractice')}
        </h2>
        <form onSubmit={onLog} className="flex items-end gap-3">
          <Field label={t(locale, 'prog.minutes')} htmlFor="practice-minutes">
            <Input
              id="practice-minutes"
              type="number"
              min={1}
              max={600}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="w-28"
            />
          </Field>
          <Button type="submit" disabled={busy}>
            {busy ? t(locale, 'prog.logging') : t(locale, 'prog.logPractice')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
