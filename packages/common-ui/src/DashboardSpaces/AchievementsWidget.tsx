import { type Locale, type MessageKey, t } from '@TheY2T/tmr-i18n';
import { cn, Icon, Progress } from '@TheY2T/tmr-ui';
import { saveAchievements } from '@TheY2T/tmr-web-acl/achievements-api';
import { getProgress } from '@TheY2T/tmr-web-acl/progress-api';
import { useEffect, useState } from 'react';
import { type AchievementState, BADGES, computeAchievements, levelProgress } from './achievements';

/**
 * Gamification widget — derives XP, level, and unlocked badges from the learner's activity and persists
 * them (best-effort) to the achievements store so they are stable across devices. i18n-by-prop.
 */
export default function AchievementsWidget({ locale }: { locale: Locale }) {
  const [state, setState] = useState<AchievementState | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProgress().then((p) => {
      if (cancelled) return;
      const derived = computeAchievements({
        completedCount: p?.completedCount ?? 0,
        streakDays: p?.currentStreakDays ?? 0,
        practiceMinutes: p?.totalPracticeMinutes ?? 0,
      });
      setState(derived);
      void saveAchievements({ xp: derived.xp, badges: derived.badges });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!state) {
    return <p className="text-sm text-muted-foreground">{t(locale, 'common.loading')}</p>;
  }

  const earned = new Set(state.badges);

  return (
    <div className="flex flex-col gap-3">
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
