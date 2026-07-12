import {
  LOCALE_LABELS,
  LOCALES,
  type Locale,
  localizedPath,
  splitLocalePath,
} from '@TheY2T/tmr-i18n';
import { SegmentedToggle } from '@TheY2T/tmr-ui';

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
    <SegmentedToggle
      aria-label="Language"
      value={locale}
      onValueChange={switchTo}
      options={LOCALES.map((option) => ({
        value: option,
        label: LOCALE_LABELS[option],
        title: LOCALE_LABELS[option],
      }))}
    />
  );
}
