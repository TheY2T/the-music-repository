import { type Locale, type MessageKey, t } from '@TheY2T/tmr-i18n';
import { PixiCanvas } from '@TheY2T/tmr-music-core/pixi/PixiCanvas';
import { cn, Icon, Progress } from '@TheY2T/tmr-ui';
import { getAchievements, saveAchievements } from '@TheY2T/tmr-web-acl/achievements-api';
import { getProgress } from '@TheY2T/tmr-web-acl/progress-api';
import { useEffect, useState } from 'react';
import {
  type AchievementState,
  BADGES,
  computeAchievements,
  detectCelebration,
  levelProgress,
} from './achievements';

const BADGE_BY_KEY = new Map(BADGES.map((b) => [b.key, b]));

/**
 * Gamification widget — derives XP, level, and unlocked badges from the learner's activity and persists
 * them to the achievements store (stable across devices). When the new standing beats the last-persisted
 * one (a level-up or a freshly-unlocked badge) it fires a confetti burst + a screen-reader announcement.
 * i18n-by-prop.
 */
export default function AchievementsWidget({ locale }: { locale: Locale }) {
  const [state, setState] = useState<AchievementState | null>(null);
  const [fire, setFire] = useState(0);
  const [announce, setAnnounce] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([getProgress(), getAchievements()]).then(([progress, persisted]) => {
      if (cancelled) return;
      const derived = computeAchievements({
        completedCount: progress?.completedCount ?? 0,
        streakDays: progress?.currentStreakDays ?? 0,
        practiceMinutes: progress?.totalPracticeMinutes ?? 0,
      });
      setState(derived);

      // A persisted record with any XP/badges is a genuine "previous" standing; the empty fallback isn't.
      const prev =
        persisted && (persisted.xp > 0 || persisted.badges.length > 0)
          ? { xp: persisted.xp, badges: persisted.badges }
          : null;
      const { celebrate, leveledUp, newBadges } = detectCelebration(prev, derived);
      if (celebrate) {
        setFire((f) => f + 1);
        if (leveledUp) {
          setAnnounce(t(locale, 'spaces.levelUp', { level: derived.level }));
        } else {
          const key = newBadges[0];
          const def = key ? BADGE_BY_KEY.get(key) : undefined;
          setAnnounce(
            t(locale, 'spaces.badgeUnlocked', {
              badge: def ? t(locale, def.nameKey as MessageKey) : '',
            }),
          );
        }
      }

      void saveAchievements({ xp: derived.xp, badges: derived.badges });
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (!state) {
    return <p className="text-sm text-muted-foreground">{t(locale, 'common.loading')}</p>;
  }

  const earned = new Set(state.badges);

  return (
    <div className="relative flex flex-col gap-3">
      {fire > 0 && (
        <PixiCanvas
          decorative
          loader={() => import('@TheY2T/tmr-music-core/pixi/confetti-scene')}
          sceneProps={{ fire }}
          fallback={<div aria-hidden />}
          className="pointer-events-none absolute inset-0 z-10"
        />
      )}
      {/* Screen readers hear the milestone even under reduced motion (confetti is decorative-only). */}
      <output className="sr-only" aria-live="polite">
        {announce}
      </output>
      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            {t(locale, 'spaces.level', { level: state.level })}
          </span>
          <span className="text-muted-foreground">{t(locale, 'spaces.xp', { xp: state.xp })}</span>
        </div>
        <Progress value={Math.round(levelProgress(state.xp) * 100)} className="mt-1.5" />
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {BADGES.map((badge) => {
          const has = earned.has(badge.key);
          return (
            <li
              key={badge.key}
              className={cn(
                'flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs',
                has
                  ? 'border-accent/40 bg-accent/10 text-foreground'
                  : 'border-border text-muted-foreground opacity-60',
              )}
            >
              <Icon name={badge.icon} className="size-4 shrink-0" />
              <span className="truncate">{t(locale, badge.nameKey as MessageKey)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
