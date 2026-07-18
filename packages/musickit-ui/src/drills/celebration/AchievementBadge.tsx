import { cn, Icon, type IconName } from '@TheY2T/tmr-ui';

/** Icon + colour per mastery tier — escalating toward gold at expert. */
const LEVEL_STYLE: Record<string, { icon: IconName; className: string }> = {
  beginner: { icon: 'sparkles', className: 'text-muted-foreground' },
  intermediate: { icon: 'star', className: 'text-success' },
  advanced: { icon: 'medal', className: 'text-accent' },
  expert: { icon: 'trophy', className: 'text-warning' },
};

/**
 * A mastery-tier badge (beginner → expert). Used on the hub deck cards and as the reveal in the
 * level-up fanfare. `label` is the localized tier name (passed in — i18n by prop).
 */
export default function AchievementBadge({
  level,
  label,
  className,
}: {
  level: string;
  label: string;
  className?: string;
}) {
  const style = LEVEL_STYLE[level] ?? LEVEL_STYLE.beginner;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        style.className,
        className,
      )}
    >
      <Icon name={style.icon} className="size-3.5" />
      {label}
    </span>
  );
}
