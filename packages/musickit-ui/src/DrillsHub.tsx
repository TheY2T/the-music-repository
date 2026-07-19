import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import {
  Badge,
  Button,
  Card,
  CardGrid,
  Icon,
  Progress,
  StatTile,
  Toaster,
  toast,
} from '@TheY2T/tmr-ui';
import { getDrillStats } from '@TheY2T/tmr-web-acl/drills-api';
import type { ReviewSummary, SkillMastery } from '@TheY2T/tmr-web-acl/dto';
import { getReviewSummary } from '@TheY2T/tmr-web-acl/reviews-api';
import { useEffect, useState } from 'react';
import { DECKS } from './drill-decks';
import AchievementBadge from './drills/celebration/AchievementBadge';
import { ENGINE_DECKS } from './drills/engine-decks';
import { LEVEL_MESSAGE_KEY, STREAK_MILESTONES } from './drills/levels';

interface DeckCard {
  key: string;
  title: string;
  description: string;
  cardCount: number;
  helpSlug: string;
}

const STREAK_PREF_KEY = 'tmr.drill.streakCelebrated';

/** Toast once when the day-streak reaches a new milestone (7/30/100/365), guarded by localStorage. */
function celebrateStreakMilestone(streakDays: number, locale: Locale) {
  if (typeof localStorage === 'undefined' || !STREAK_MILESTONES.includes(streakDays)) {
    return;
  }
  if (Number(localStorage.getItem(STREAK_PREF_KEY) ?? 0) >= streakDays) {
    return;
  }
  localStorage.setItem(STREAK_PREF_KEY, String(streakDays));
  toast.success(t(locale, 'drill.celebrate.streakMilestone', { days: streakDays }));
}

export default function DrillsHub({
  locale,
  flags,
}: {
  locale: Locale;
  /** Per-modality drill flags that unlock engine-only decks. */
  flags?: { drillPlay?: boolean; drillEar?: boolean; drillPitch?: boolean; drillRhythm?: boolean };
}) {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [mastery, setMastery] = useState<SkillMastery[]>([]);

  useEffect(() => {
    getReviewSummary().then(setSummary);
    getDrillStats().then((stats) => {
      setMastery(stats.skills);
      celebrateStreakMilestone(stats.streakDays, locale);
    });
  }, [locale]);

  const byDeck = new Map((summary?.decks ?? []).map((s) => [s.deck, s]));
  const masteryByDeck = new Map(mastery.map((m) => [m.deck, m]));
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
      <Toaster />
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
          const skill = masteryByDeck.get(deck.key);
          return (
            <li key={deck.key}>
              <a href={localizedPath(locale, `/drills/${deck.key}`)} className="group block h-full">
                <Card className="flex h-full flex-col gap-2 p-4 transition group-hover:-translate-y-0.5 group-hover:border-accent group-hover:shadow-md">
                  <span
                    className="flex items-center justify-between gap-2 font-display font-semibold"
                    data-help={deck.helpSlug}
                  >
                    <span className="flex items-center gap-2">
                      <Icon name="graduation-cap" className="size-4 text-accent" />
                      {deck.title}
                    </span>
                    {skill && skill.attempts > 0 ? (
                      <AchievementBadge
                        level={skill.level}
                        label={t(locale, LEVEL_MESSAGE_KEY[skill.level] ?? 'drill.level.beginner')}
                      />
                    ) : null}
                  </span>
                  <span className="text-sm text-muted-foreground">{deck.description}</span>

                  {skill && skill.attempts > 0 ? (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t(locale, 'drillhub.mastery')}</span>
                        <span className="tabular-nums">{Math.round(skill.mastery * 100)}%</span>
                      </div>
                      <Progress value={skill.mastery * 100} />
                    </div>
                  ) : null}

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
