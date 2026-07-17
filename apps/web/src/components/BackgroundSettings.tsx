import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Button, cn, Icon, type IconName, Label, Slider, Toaster, toast } from '@TheY2T/tmr-ui';
import { useEffect, useState } from 'react';
import DashboardBackground, { BG_CHANGE_EVENT } from '@/components/DashboardBackground';
import {
  type BackgroundStyle,
  DEFAULT_PREF,
  getBackgroundPref,
  setBackgroundPref,
} from '@/lib/dashboard-background';
import { usePrefersReducedMotion } from '@/lib/pixi/use-webgl';

interface StyleOption {
  value: BackgroundStyle;
  labelKey: string;
  descKey: string;
  icon: IconName;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    value: 'waves',
    labelKey: 'settings.bg.waves',
    descKey: 'settings.bg.waves.desc',
    icon: 'volume',
  },
  {
    value: 'staff',
    labelKey: 'settings.bg.staff',
    descKey: 'settings.bg.staff.desc',
    icon: 'music',
  },
  { value: 'roll', labelKey: 'settings.bg.roll', descKey: 'settings.bg.roll.desc', icon: 'chart' },
  {
    value: 'bokeh',
    labelKey: 'settings.bg.bokeh',
    descKey: 'settings.bg.bokeh.desc',
    icon: 'sparkles',
  },
  { value: 'none', labelKey: 'settings.bg.none', descKey: 'settings.bg.none.desc', icon: 'minus' },
];

type Key = Parameters<typeof t>[1];

/**
 * Settings surface for the animated dashboard background. Holds a *draft* (style + intensity) that
 * drives the live preview; "Apply" persists it to localStorage and notifies open dashboards
 * ({@link BG_CHANGE_EVENT}). App island → may call `t()` directly (i18n-by-prop is for the library).
 */
export default function BackgroundSettings({ locale }: { locale: Locale }) {
  const reducedMotion = usePrefersReducedMotion();
  const [style, setStyle] = useState<BackgroundStyle>(DEFAULT_PREF.style);
  const [intensity, setIntensity] = useState(DEFAULT_PREF.intensity);
  const [saved, setSaved] = useState(DEFAULT_PREF);

  useEffect(() => {
    const pref = getBackgroundPref();
    setStyle(pref.style);
    setIntensity(pref.intensity);
    setSaved(pref);
  }, []);

  const dirty = style !== saved.style || intensity !== saved.intensity;

  function apply() {
    const next = { style, intensity };
    setBackgroundPref(next);
    setSaved(next);
    window.dispatchEvent(new Event(BG_CHANGE_EVENT));
    toast.success(t(locale, 'settings.background.saved'));
  }

  function reset() {
    setStyle(DEFAULT_PREF.style);
    setIntensity(DEFAULT_PREF.intensity);
  }

  return (
    <section className="flex flex-col gap-6" aria-labelledby="bg-settings-heading">
      <div>
        <h2 id="bg-settings-heading" className="font-display text-xl font-semibold">
          {t(locale, 'settings.background.title')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(locale, 'settings.background.desc')}
        </p>
      </div>

      {/* Live preview */}
      <div>
        <p className="mb-2 font-display text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t(locale, 'settings.background.previewLabel')}
        </p>
        <div className="relative h-56 overflow-hidden rounded-lg border border-border bg-card">
          <DashboardBackground
            className="pointer-events-none absolute inset-0"
            style={style}
            intensity={intensity}
          />
          <div className="relative z-10 flex h-full flex-col justify-between p-4">
            <div className="h-4 w-32 rounded bg-muted-foreground/25" />
            <div className="grid grid-cols-3 gap-3">
              {['a', 'b', 'c'].map((k) => (
                <div
                  key={k}
                  className="h-16 rounded-md border border-border bg-card/70 backdrop-blur-sm"
                />
              ))}
            </div>
          </div>
        </div>
        {reducedMotion && (
          <p className="mt-2 text-xs text-muted-foreground">
            {t(locale, 'settings.background.reducedMotionNote')}
          </p>
        )}
      </div>

      {/* Style picker */}
      <fieldset>
        <legend className="mb-2 font-display text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t(locale, 'settings.background.styleLabel')}
        </legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {STYLE_OPTIONS.map((opt) => {
            const active = opt.value === style;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={active}
                onClick={() => setStyle(opt.value)}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                  active
                    ? 'border-primary bg-accent/15'
                    : 'border-border hover:border-muted-foreground/40 hover:bg-muted',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon name={opt.icon} className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-medium leading-tight">
                    {t(locale, opt.labelKey as Key)}
                    {active && <Icon name="check" className="size-3.5 text-primary" />}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {t(locale, opt.descKey as Key)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Intensity */}
      <div className={cn('flex flex-col gap-2', style === 'none' && 'opacity-50')}>
        <Label htmlFor="bg-intensity">{t(locale, 'settings.background.intensityLabel')}</Label>
        <Slider
          id="bg-intensity"
          min={10}
          max={100}
          value={intensity}
          disabled={style === 'none'}
          onChange={(e) => setIntensity(Number(e.currentTarget.value))}
          aria-label={t(locale, 'settings.background.intensityLabel')}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t(locale, 'settings.background.subtle')}</span>
          <span>{t(locale, 'settings.background.bold')}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={apply} disabled={!dirty}>
          {t(locale, 'settings.background.apply')}
        </Button>
        <Button type="button" variant="ghost" onClick={reset}>
          <Icon name="refresh" className="size-4" />
          {t(locale, 'settings.background.reset')}
        </Button>
      </div>

      <Toaster />
    </section>
  );
}
