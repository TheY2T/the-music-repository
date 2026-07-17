import { type Locale, t } from '@TheY2T/tmr-i18n';
import { cn, Icon, SegmentedToggle } from '@TheY2T/tmr-ui';
import { useEffect, useId, useRef, useState } from 'react';

/**
 * Global appearance control (lives in SiteHeader). Two independent axes, matching the token model
 * in design-tokens (ADR 0021): AESTHETIC → `data-theme` on <html> (persisted as `tmr.aesthetic`)
 * and MODE → the `.dark` class (persisted as `theme`). The pre-paint script in BaseLayout restores
 * both before first paint; this island only mutates them on user action, so there is no flash.
 *
 * One island root — the popover state is local (React context can't cross islands). i18n-by-prop:
 * this is an app island, so it may call `t(locale, key)` itself.
 */
type Aesthetic = 'hybrid' | 'heritage' | 'warm-minimal';
type Mode = 'light' | 'dark';

const AESTHETICS: { value: Aesthetic; labelKey: string; descKey: string }[] = [
  { value: 'hybrid', labelKey: 'theme.hybrid', descKey: 'theme.hybrid.desc' },
  { value: 'heritage', labelKey: 'theme.heritage', descKey: 'theme.heritage.desc' },
  { value: 'warm-minimal', labelKey: 'theme.warmMinimal', descKey: 'theme.warmMinimal.desc' },
];

function readAesthetic(): Aesthetic {
  const attr = document.documentElement.getAttribute('data-theme');
  return attr === 'heritage' || attr === 'warm-minimal' ? attr : 'hybrid';
}

export default function ThemeSwitcher({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [aesthetic, setAesthetic] = useState<Aesthetic>('hybrid');
  const [mode, setMode] = useState<Mode>('light');
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  // Sync initial state from what the pre-paint script already applied to <html>.
  useEffect(() => {
    setAesthetic(readAesthetic());
    setMode(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, []);

  // Dismiss on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function applyAesthetic(next: Aesthetic) {
    setAesthetic(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('tmr.aesthetic', next);
  }

  function applyMode(next: Mode) {
    setMode(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('theme', next);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t(locale, 'theme.label')}
        title={t(locale, 'theme.label')}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon name="palette" className="size-4" />
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={t(locale, 'theme.appearance')}
          className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg"
        >
          <p className="px-1 pb-1 font-display text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t(locale, 'theme.aesthetic')}
          </p>
          <ul className="flex flex-col gap-1">
            {AESTHETICS.map((a) => {
              const active = a.value === aesthetic;
              return (
                <li key={a.value}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => applyAesthetic(a.value)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors',
                      active ? 'bg-accent/15 text-foreground' : 'hover:bg-muted',
                    )}
                  >
                    <span
                      aria-hidden
                      data-theme={a.value}
                      className="size-6 shrink-0 rounded-full border border-border"
                      style={{ background: 'var(--primary)' }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium leading-tight">
                        {t(locale, a.labelKey as Parameters<typeof t>[1])}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {t(locale, a.descKey as Parameters<typeof t>[1])}
                      </span>
                    </span>
                    {active && <Icon name="check" className="size-4 text-accent" />}
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="px-1 pb-1 pt-3 font-display text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t(locale, 'theme.mode')}
          </p>
          <SegmentedToggle
            aria-label={t(locale, 'theme.mode')}
            className="w-full justify-stretch [&>button]:flex-1"
            value={mode}
            onValueChange={(v) => applyMode(v as Mode)}
            options={[
              {
                value: 'light',
                label: (
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <Icon name="sun" className="size-3.5" /> {t(locale, 'theme.light')}
                  </span>
                ),
                title: t(locale, 'theme.light'),
              },
              {
                value: 'dark',
                label: (
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <Icon name="moon" className="size-3.5" /> {t(locale, 'theme.dark')}
                  </span>
                ),
                title: t(locale, 'theme.dark'),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}
