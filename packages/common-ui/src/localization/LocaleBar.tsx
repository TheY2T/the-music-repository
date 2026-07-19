import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Icon, SegmentedToggle, Select } from '@TheY2T/tmr-ui';
import type { LocaleInfo } from '@TheY2T/tmr-web-acl/i18n-api';
import type { LocaleStatus } from './useLocaleContent';

const STATUS_DOT: Record<LocaleStatus, string> = {
  none: 'bg-muted-foreground/40',
  draft: 'bg-warning',
  published: 'bg-success',
};

export interface LocaleBarProps {
  locale: Locale;
  available: LocaleInfo[];
  active: string;
  onChange: (code: string) => void;
  addable: LocaleInfo[];
  onAdd: (code: string) => void;
  baseLocale: string;
  statusOf: (code: string) => LocaleStatus;
  completenessOf: (code: string) => { filled: number; total: number };
}

/**
 * Editor-header language switcher: a pill per available locale (base + started targets) with a
 * translation-status dot, plus an "Add language" control that reveals a registry locale not yet
 * started. Selecting a pill rebinds the whole form to that locale (ADR 0034).
 */
export function LocaleBar({
  locale,
  available,
  active,
  onChange,
  addable,
  onAdd,
  baseLocale,
  statusOf,
  completenessOf,
}: LocaleBarProps) {
  const options = available.map((l) => {
    const isBase = l.code === baseLocale;
    const { filled, total } = completenessOf(l.code);
    return {
      value: l.code,
      title: isBase ? l.label : `${l.label} · ${filled}/${total}`,
      label: (
        <span className="inline-flex items-center gap-1.5">
          {!isBase ? (
            <span className={`size-1.5 rounded-full ${STATUS_DOT[statusOf(l.code)]}`} />
          ) : null}
          {l.label}
        </span>
      ),
    };
  });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Icon name="languages" className="size-4 text-muted-foreground" />
      <SegmentedToggle
        options={options}
        value={active}
        onValueChange={onChange}
        aria-label={t(locale, 'loc.sectionHeading')}
      />
      {addable.length > 0 ? (
        <Select
          aria-label={t(locale, 'loc.addLanguage')}
          value=""
          onChange={(e) => {
            if (e.target.value) {
              onAdd(e.target.value);
            }
          }}
          className="h-9 w-auto py-0 pr-8"
        >
          <option value="">{t(locale, 'loc.addLanguage')}</option>
          {addable.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </Select>
      ) : null}
    </div>
  );
}
