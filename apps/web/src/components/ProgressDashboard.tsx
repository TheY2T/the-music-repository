import type { ProgressSummary } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import { Button, Card, EmptyState, Field, Icon, Input, Progress, StatTile } from '@TheY2T/tmr-ui';
import { type FormEvent, useEffect, useState } from 'react';
import { getProgress, logPractice } from '@/lib/progress-api';

export default function ProgressDashboard({ locale }: { locale: Locale }) {
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [minutes, setMinutes] = useState('20');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getProgress().then((result) => {
      setSummary(result);
      setLoaded(true);
    });
  }, []);

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
        {summary.collections.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t(locale, 'prog.noCollections')}</p>
        ) : (
          <ul className="space-y-4">
            {summary.collections.map((collection) => {
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
