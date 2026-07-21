import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Icon } from '@TheY2T/tmr-ui';
import { useEffect, useId, useRef, useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';

/**
 * Settings menu (lives in SiteHeader) — a single gear-triggered popover gathering the personal display
 * preferences: language and appearance (aesthetic + light/dark mode). One island root, since React
 * context and the local popover state can't cross island boundaries. i18n-by-prop: an app island, so it
 * may call `t(locale, key)` itself.
 */
export default function SettingsMenu({
  locale,
  i18nEnabled,
}: {
  locale: Locale;
  i18nEnabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t(locale, 'nav.settings')}
        title={t(locale, 'nav.settings')}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon name="settings" className="size-4" />
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={t(locale, 'nav.settings')}
          className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg"
        >
          {i18nEnabled && (
            <div className="pb-3">
              <p className="px-1 pb-1 font-display text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t(locale, 'common.language')}
              </p>
              <LanguageSwitcher
                locale={locale}
                className="w-full justify-stretch [&>button]:flex-1"
              />
            </div>
          )}
          <ThemeSwitcher locale={locale} />
        </div>
      )}
    </div>
  );
}
