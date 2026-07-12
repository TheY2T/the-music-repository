import type { ProgressSummary } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import { type FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getProgress, logPractice } from '@/lib/progress-api';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

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
    return <p className="text-sm text-red-500">{t(locale, 'prog.loadError')}</p>;
  }

  const streak = summary.currentStreakDays;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label={t(locale, 'prog.itemsCompleted')} value={summary.completedCount} />
        <Stat
          label={t(locale, 'prog.dayStreakLabel')}
          value={t(locale, streak === 1 ? 'prog.dayStreakOne' : 'prog.dayStreakOther', {
            count: streak,
          })}
        />
        <Stat label={t(locale, 'prog.practiceMinutes')} value={summary.totalPracticeMinutes} />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">{t(locale, 'prog.collections')}</h2>
        {summary.collections.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t(locale, 'prog.noCollections')}</p>
        ) : (
          <ul className="space-y-3">
            {summary.collections.map((collection) => {
              const percent =
                collection.totalItems === 0
                  ? 0
                  : Math.round((collection.completedItems / collection.totalItems) * 100);
              return (
                <li key={collection.slug} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <a
                      href={localizedPath(locale, `/collections/${collection.slug}`)}
                      className="font-medium underline"
                    >
                      {collection.title}
                    </a>
                    <span className="text-muted-foreground">
                      {collection.completedItems}/{collection.totalItems}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3 border-t pt-6">
        <h2 className="text-lg font-medium">{t(locale, 'prog.logPractice')}</h2>
        <form onSubmit={onLog} className="flex items-end gap-3">
          <label className="space-y-1">
            <span className="block text-sm font-medium">{t(locale, 'prog.minutes')}</span>
            <input
              type="number"
              min={1}
              max={600}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="w-28 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? t(locale, 'prog.logging') : t(locale, 'prog.logPractice')}
          </Button>
        </form>
      </section>
    </div>
  );
}
