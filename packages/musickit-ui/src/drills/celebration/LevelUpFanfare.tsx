import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Icon } from '@TheY2T/tmr-ui';
import { LEVEL_MESSAGE_KEY } from '../levels';
import AchievementBadge from './AchievementBadge';

/**
 * Tier-4 reveal shown in the session summary when the run advanced a deck to a new mastery level:
 * a highlighted callout + the earned tier badge.
 */
export default function LevelUpFanfare({ level, locale }: { level: string; locale: Locale }) {
  const label = t(locale, LEVEL_MESSAGE_KEY[level] ?? 'drill.level.beginner');
  return (
    <div className="mx-auto flex max-w-xs flex-col items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3">
      <span className="flex items-center gap-2 font-semibold text-warning">
        <Icon name="trending-up" className="size-4" />
        {t(locale, 'drill.celebrate.levelUp', { level: label })}
      </span>
      <AchievementBadge level={level} label={label} className="text-sm" />
    </div>
  );
}
