import {
  LOCALE_LABELS,
  LOCALES,
  type Locale,
  localizedPath,
  splitLocalePath,
} from '@TheY2T/tmr-i18n';

/**
 * Global language switcher (lives in BaseLayout's top bar). Sets a 1-year `locale` cookie so the
 * choice persists, then navigates to the same page in the target locale. The current locale comes
 * from the server as a prop so first paint matches — no context (islands don't share it).
 */
export default function LanguageSwitcher({ locale }: { locale: Locale }) {
  function switchTo(target: Locale) {
    if (target === locale) {
      return;
    }
    // biome-ignore lint/suspicious/noDocumentCookie: a plain persistence cookie (no CookieStore needed).
    document.cookie = `locale=${target}; path=/; max-age=31536000; samesite=lax`;
    const { path } = splitLocalePath(window.location.pathname);
    window.location.href = `${localizedPath(target, path)}${window.location.search}`;
  }

  return (
    <div className="flex items-center gap-1">
      {LOCALES.map((option) => {
        const active = option === locale;
        return (
          <button
            key={option}
            type="button"
            onClick={() => switchTo(option)}
            aria-current={active ? 'true' : undefined}
            aria-label={LOCALE_LABELS[option]}
            className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
              active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {LOCALE_LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}
