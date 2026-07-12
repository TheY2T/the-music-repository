import type { ReviewSummary } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DECKS } from '@/lib/drill-decks';
import { getReviewSummary } from '@/lib/reviews-api';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border px-4 py-3 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export default function DrillsHub({ locale }: { locale: Locale }) {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);

  useEffect(() => {
    getReviewSummary().then(setSummary);
  }, []);

  const byDeck = new Map((summary?.decks ?? []).map((s) => [s.deck, s]));
  const totalDue = summary?.totalDue ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat label={t(locale, 'drillhub.dayStreak')} value={`${summary?.streakDays ?? 0}🔥`} />
          <Stat label={t(locale, 'drillhub.reviewedToday')} value={summary?.reviewsToday ?? 0} />
          <Stat label={t(locale, 'drillhub.dueNow')} value={totalDue} />
        </div>
        {totalDue > 0 ? (
          <a href={localizedPath(locale, '/drills/review')} className="ml-auto">
            <Button size="lg">▶ {t(locale, 'drillhub.reviewDue', { count: totalDue })}</Button>
          </a>
        ) : null}
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {DECKS.map((deck) => {
          const stats = byDeck.get(deck.key);
          const learned = stats?.learned ?? 0;
          const due = stats?.due ?? 0;
          const fresh = deck.cards.length - learned;
          return (
            <li key={deck.key}>
              <a
                href={localizedPath(locale, `/drills/${deck.key}`)}
                className="flex h-full flex-col gap-2 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
              >
                <span className="font-semibold" data-help="ear-training">
                  {deck.title}
                </span>
                <span className="text-sm text-muted-foreground">{deck.description}</span>
                <span className="mt-auto flex gap-3 pt-2 text-xs">
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-900 dark:bg-blue-950 dark:text-blue-100">
                    {t(locale, 'drillhub.due', { count: due })}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    {t(locale, 'drillhub.new', { count: fresh })}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    {t(locale, 'drillhub.learned', { count: learned })}
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
