import { type Locale, type MessageKey, t } from '@TheY2T/tmr-i18n';
import { cn, Icon, type IconName, Label, Slider } from '@TheY2T/tmr-ui';

interface StyleOption {
  value: string;
  labelKey: MessageKey;
  icon: IconName;
}

const STYLES: StyleOption[] = [
  { value: 'waves', labelKey: 'settings.bg.waves', icon: 'volume' },
  { value: 'staff', labelKey: 'settings.bg.staff', icon: 'music' },
  { value: 'roll', labelKey: 'settings.bg.roll', icon: 'chart' },
  { value: 'bokeh', labelKey: 'settings.bg.bokeh', icon: 'sparkles' },
  { value: 'none', labelKey: 'settings.bg.none', icon: 'minus' },
];

/**
 * The per-space animated-background picker (shown in the builder's edit mode) — an aesthetic that
 * belongs to the active space, folded in from the retired standalone settings page. Presentational +
 * i18n-by-prop; the parent persists the choice on the space.
 */
export default function SpaceBackgroundControl({
  locale,
  style,
  intensity,
  onChange,
}: {
  locale: Locale;
  style: string;
  intensity: number;
  onChange: (bg: { style: string; intensity: number }) => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-3">
      <p className="px-1 font-display text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t(locale, 'settings.background.styleLabel')}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {STYLES.map((option) => {
          const active = option.value === style;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange({ style: option.value, intensity })}
              className={cn(
                'flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs transition-colors',
                active
                  ? 'border-primary bg-accent/15 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted',
              )}
            >
              <Icon name={option.icon} className="size-4 shrink-0" />
              <span className="truncate">{t(locale, option.labelKey)}</span>
            </button>
          );
        })}
      </div>
      <div className={cn('space-y-1', style === 'none' && 'opacity-50')}>
        <Label htmlFor="space-bg-intensity">
          {t(locale, 'settings.background.intensityLabel')}
        </Label>
        <Slider
          id="space-bg-intensity"
          min={10}
          max={100}
          value={intensity}
          disabled={style === 'none'}
          onChange={(e) => onChange({ style, intensity: Number(e.currentTarget.value) })}
          aria-label={t(locale, 'settings.background.intensityLabel')}
        />
      </div>
    </div>
  );
}
