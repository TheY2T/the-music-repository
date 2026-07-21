import { type Locale, t } from '@TheY2T/tmr-i18n';
import { StatTile } from '@TheY2T/tmr-ui';
import type { ProgressSummary } from '@TheY2T/tmr-web-acl/dto';
import { getProgress } from '@TheY2T/tmr-web-acl/progress-api';
import { useEffect, useState } from 'react';

/**
 * Progress-at-a-glance widget — items completed, day streak, and practice minutes, read from the
 * learner's progress summary (auth-gated; anonymous/off shows zeros). i18n-by-prop.
 */
export default function ProgressWidget({ locale }: { locale: Locale }) {
  const [summary, setSummary] = useState<ProgressSummary | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getProgress().then((p) => {
      if (!cancelled) setSummary(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (summary === undefined) {
    return <p className="text-sm text-muted-foreground">{t(locale, 'common.loading')}</p>;
  }

  const completed = summary?.completedCount ?? 0;
  const streak = summary?.currentStreakDays ?? 0;
  const minutes = summary?.totalPracticeMinutes ?? 0;

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <StatTile
        iconName="circle-check"
        label={t(locale, 'spaces.stat.completed')}
        value={completed}
      />
      <StatTile iconName="flame" label={t(locale, 'spaces.stat.streak')} value={streak} />
      <StatTile iconName="clock" label={t(locale, 'spaces.stat.minutes')} value={minutes} />
    </div>
  );
}
