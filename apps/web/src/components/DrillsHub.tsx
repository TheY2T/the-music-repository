import type { ReviewSummary } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import { Badge, Button, CardGrid, Icon, StatCard } from '@TheY2T/tmr-ui';
import { useEffect, useState } from 'react';
import { DECKS } from '@/lib/drill-decks';
import { getReviewSummary } from '@/lib/reviews-api';

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
          <StatCard
            label={t(locale, 'drillhub.dayStreak')}
            value={
              <span className="inline-flex items-center gap-1.5">
                {summary?.streakDays ?? 0}
                <Icon name="flame" className="size-5 text-orange-500" />
              </span>
            }
          />
          <StatCard
            label={t(locale, 'drillhub.reviewedToday')}
            value={summary?.reviewsToday ?? 0}
          />
          <StatCard label={t(locale, 'drillhub.dueNow')} value={totalDue} />
        </div>
        {totalDue > 0 ? (
          <a href={localizedPath(locale, '/drills/review')} className="ml-auto">
            <Button size="lg">
              <Icon name="play" className="size-4" />
              {t(locale, 'drillhub.reviewDue', { count: totalDue })}
            </Button>
          </a>
        ) : null}
      </div>

      <CardGrid columns={2}>
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
                <span className="mt-auto flex gap-3 pt-2">
                  <Badge variant="info">{t(locale, 'drillhub.due', { count: due })}</Badge>
                  <Badge variant="secondary">{t(locale, 'drillhub.new', { count: fresh })}</Badge>
                  <Badge variant="secondary">
                    {t(locale, 'drillhub.learned', { count: learned })}
                  </Badge>
                </span>
              </a>
            </li>
          );
        })}
      </CardGrid>
    </div>
  );
}
