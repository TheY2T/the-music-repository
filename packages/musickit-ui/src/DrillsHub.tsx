import type { ReviewSummary } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import { Badge, Button, Card, CardGrid, Icon, StatTile } from '@TheY2T/tmr-ui';
import { getReviewSummary } from '@TheY2T/tmr-web-data/reviews-api';
import { useEffect, useState } from 'react';
import { DECKS } from './drill-decks';
import { ENGINE_DECKS } from './drills/engine-decks';

interface DeckCard {
  key: string;
  title: string;
  description: string;
  cardCount: number;
  helpSlug: string;
}

export default function DrillsHub({
  locale,
  flags,
}: {
  locale: Locale;
  /** Per-modality drill flags that unlock engine-only decks. */
  flags?: { drillPlay?: boolean };
}) {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);

  useEffect(() => {
    getReviewSummary().then(setSummary);
  }, []);

  const byDeck = new Map((summary?.decks ?? []).map((s) => [s.deck, s]));
  const totalDue = summary?.totalDue ?? 0;

  const decks: DeckCard[] = [
    ...DECKS.map((d) => ({
      key: d.key,
      title: d.title,
      description: d.description,
      cardCount: d.cards.length,
      helpSlug: 'ear-training',
    })),
    ...ENGINE_DECKS.filter((d) => flags?.[d.flag]).map((d) => ({
      key: d.key,
      title: t(locale, d.titleKey),
      description: t(locale, d.descKey),
      cardCount: d.cardCount,
      helpSlug: d.helpSlug,
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile
            iconName="flame"
            label={t(locale, 'drillhub.dayStreak')}
            value={summary?.streakDays ?? 0}
          />
          <StatTile
            iconName="circle-check"
            label={t(locale, 'drillhub.reviewedToday')}
            value={summary?.reviewsToday ?? 0}
          />
          <StatTile iconName="clock" label={t(locale, 'drillhub.dueNow')} value={totalDue} />
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
        {decks.map((deck) => {
          const stats = byDeck.get(deck.key);
          const learned = stats?.learned ?? 0;
          const due = stats?.due ?? 0;
          const fresh = deck.cardCount - learned;
          return (
            <li key={deck.key}>
              <a href={localizedPath(locale, `/drills/${deck.key}`)} className="group block h-full">
                <Card className="flex h-full flex-col gap-2 p-4 transition group-hover:-translate-y-0.5 group-hover:border-accent group-hover:shadow-md">
                  <span
                    className="flex items-center gap-2 font-display font-semibold"
                    data-help={deck.helpSlug}
                  >
                    <Icon name="graduation-cap" className="size-4 text-accent" />
                    {deck.title}
                  </span>
                  <span className="text-sm text-muted-foreground">{deck.description}</span>
                  <span className="mt-auto flex flex-wrap gap-2 pt-2">
                    <Badge variant="info">{t(locale, 'drillhub.due', { count: due })}</Badge>
                    <Badge variant="secondary">{t(locale, 'drillhub.new', { count: fresh })}</Badge>
                    <Badge variant="success">
                      {t(locale, 'drillhub.learned', { count: learned })}
                    </Badge>
                  </span>
                </Card>
              </a>
            </li>
          );
        })}
      </CardGrid>
    </div>
  );
}
