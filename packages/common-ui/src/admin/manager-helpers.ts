import { type Locale, type MessageKey, t } from '@TheY2T/tmr-i18n';

const STATUS_LABEL: Record<string, MessageKey> = {
  draft: 'acl.statusDraft',
  review: 'acl.statusReview',
  published: 'acl.statusPublished',
};

/** Title-case a taxonomy/enum slug (`walking-bass` → `Walking Bass`). */
export function titleize(slug: string): string {
  return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Badge tone for a lifecycle status. */
export function statusVariant(status: string): 'success' | 'warning' | 'secondary' {
  return status === 'published' ? 'success' : status === 'review' ? 'warning' : 'secondary';
}

export function statusText(locale: Locale, status: string): string {
  const key = STATUS_LABEL[status];
  return key ? t(locale, key) : titleize(status);
}

/** Localized "2 days ago" using the browser's Intl; falls back to the raw date string on any error. */
export function relativeTime(iso: string, locale: Locale): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(diffMs)) return iso;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const sec = Math.round(diffMs / 1000);
  const abs = Math.abs(sec);
  if (abs < 3600) return rtf.format(Math.round(sec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(sec / 3600), 'hour');
  if (abs < 2592000) return rtf.format(Math.round(sec / 86400), 'day');
  if (abs < 31536000) return rtf.format(Math.round(sec / 2592000), 'month');
  return rtf.format(Math.round(sec / 31536000), 'year');
}
