import { type Locale, t } from '@TheY2T/tmr-i18n';
import {
  contentTranslationApi,
  type LocalizableFieldSpec,
  type TranslatableEntityType,
} from '@TheY2T/tmr-web-data/content-translations-api';
import { type LocaleInfo, listLocales } from '@TheY2T/tmr-web-data/i18n-api';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** The base (source) locale every entity's fields are authored in; target locales overlay it. */
const BASE_LOCALE = 'en';

export type LocaleStatus = 'none' | 'draft' | 'published';

export interface UseLocaleContentArgs {
  entityType: TranslatableEntityType;
  /** The saved entity's id, or null while creating (target edits buffer until the base is created). */
  entityId: string | null;
  /** The localizable fields (static + entity-derived dynamic), in display order. */
  specs: LocalizableFieldSpec[];
  /** Live base (English) values keyed by field — the source of truth stays in the form's own state. */
  baseValues: Record<string, string>;
  /** Route a base-locale edit back into the form's state. */
  onBaseChange: (field: string, value: string) => void;
  /** The `localeStrings` flag — when off, the bar/hook stay dormant. */
  enabled: boolean;
  /** UI locale, for status/notice/error copy. */
  locale: Locale;
}

type FieldMap = Record<string, Record<string, string>>;

/**
 * Owns per-locale content translation for one entity editor: the target-locale buffer, the loaded
 * baseline (for diffing), draft/publish persistence, and create-time flushing. Base (English) values
 * stay in the form's own state — this hook reads them via `baseValues` and writes them via
 * `onBaseChange`, so the same inputs rebind to the active locale (ADR 0034).
 */
export function useLocaleContent({
  entityType,
  entityId,
  specs,
  baseValues,
  onBaseChange,
  enabled,
  locale,
}: UseLocaleContentArgs) {
  const [locales, setLocales] = useState<LocaleInfo[]>([]);
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const [activeLocale, setActiveLocale] = useState(BASE_LOCALE);
  const [buffer, setBuffer] = useState<FieldMap>({});
  const [baseline, setBaseline] = useState<FieldMap>({});
  const [rowStatus, setRowStatus] = useState<Record<string, Record<string, LocaleStatus>>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Field names change as dynamic (collection) specs load; keep a live ref for save/flush diffing.
  const fieldNames = useMemo(() => specs.map((s) => s.field), [specs]);

  const isBase = activeLocale === BASE_LOCALE;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    listLocales()
      .then(setLocales)
      .catch(() => {});
  }, [enabled]);

  // Seed the buffer/baseline/status from existing rows once the entity is saved.
  useEffect(() => {
    if (!enabled || !entityId) {
      return;
    }
    let cancelled = false;
    contentTranslationApi
      .list(entityType, entityId)
      .then((rows) => {
        if (cancelled) {
          return;
        }
        const values: FieldMap = {};
        const status: Record<string, Record<string, LocaleStatus>> = {};
        const seen = new Set<string>();
        for (const row of rows) {
          if (row.deleted) {
            continue;
          }
          seen.add(row.locale);
          const localeValues = values[row.locale] ?? {};
          const localeStatus = status[row.locale] ?? {};
          values[row.locale] = localeValues;
          status[row.locale] = localeStatus;
          localeValues[row.field] = row.draftValue ?? row.publishedValue ?? '';
          localeStatus[row.field] = row.status === 'published' ? 'published' : 'draft';
        }
        setBuffer(structuredClone(values));
        setBaseline(structuredClone(values));
        setRowStatus(status);
        setVisible((prev) => new Set([...prev, ...seen]));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(t(locale, 'transadmin.loadError', { error: (err as Error).message }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, entityType, entityId, locale]);

  const targetLocales = useMemo(() => locales.filter((l) => l.code !== BASE_LOCALE), [locales]);
  const availableLocales = useMemo(
    () => locales.filter((l) => l.code === BASE_LOCALE || visible.has(l.code)),
    [locales, visible],
  );
  const addableLocales = useMemo(
    () => targetLocales.filter((l) => !visible.has(l.code)),
    [targetLocales, visible],
  );

  const setValueFor = useCallback(
    (field: string, value: string) => {
      if (activeLocale === BASE_LOCALE) {
        onBaseChange(field, value);
        return;
      }
      setBuffer((prev) => ({
        ...prev,
        [activeLocale]: { ...(prev[activeLocale] ?? {}), [field]: value },
      }));
    },
    [activeLocale, onBaseChange],
  );

  const valueFor = useCallback(
    (field: string): string =>
      activeLocale === BASE_LOCALE
        ? (baseValues[field] ?? '')
        : (buffer[activeLocale]?.[field] ?? ''),
    [activeLocale, baseValues, buffer],
  );

  const baseValueFor = useCallback((field: string) => baseValues[field] ?? '', [baseValues]);

  const isDirty = useCallback(
    (code: string): boolean =>
      fieldNames.some((f) => (buffer[code]?.[f] ?? '') !== (baseline[code]?.[f] ?? '')),
    [fieldNames, buffer, baseline],
  );

  const completeness = useCallback(
    (code: string) => ({
      filled: fieldNames.filter((f) => (buffer[code]?.[f] ?? '').trim()).length,
      total: fieldNames.length,
    }),
    [fieldNames, buffer],
  );

  const status = useCallback(
    (code: string): LocaleStatus => {
      const filled = fieldNames.some((f) => (buffer[code]?.[f] ?? '').trim());
      if (!filled) {
        return 'none';
      }
      if (isDirty(code) || fieldNames.some((f) => rowStatus[code]?.[f] === 'draft')) {
        return 'draft';
      }
      return 'published';
    },
    [fieldNames, buffer, isDirty, rowStatus],
  );

  const addLanguage = useCallback((code: string) => {
    setVisible((prev) => new Set(prev).add(code));
    setActiveLocale(code);
  }, []);

  const clearMessages = useCallback(() => {
    setError(null);
    setNotice(null);
  }, []);

  /** Upsert changed, non-empty fields of `code` as drafts against `id`; returns whether any changed. */
  const persistLocale = useCallback(
    async (code: string, id: string): Promise<boolean> => {
      const ops: Promise<unknown>[] = [];
      for (const field of fieldNames) {
        const value = buffer[code]?.[field] ?? '';
        if (value !== (baseline[code]?.[field] ?? '') && value.trim()) {
          ops.push(
            contentTranslationApi.upsert({ entityType, entityId: id, locale: code, field, value }),
          );
        }
      }
      if (ops.length === 0) {
        return false;
      }
      await Promise.all(ops);
      setBaseline((prev) => ({ ...prev, [code]: structuredClone(buffer[code] ?? {}) }));
      setRowStatus((prev) => {
        const next = { ...(prev[code] ?? {}) };
        for (const field of fieldNames) {
          if ((buffer[code]?.[field] ?? '').trim()) {
            next[field] = 'draft';
          }
        }
        return { ...prev, [code]: next };
      });
      return true;
    },
    [fieldNames, buffer, baseline, entityType],
  );

  const saveActive = useCallback(async () => {
    if (isBase || !entityId) {
      return;
    }
    setSaving(true);
    clearMessages();
    try {
      await persistLocale(activeLocale, entityId);
      setNotice(t(locale, 'loc.translationSaved'));
    } catch (err) {
      setError(t(locale, 'transadmin.saveError', { error: (err as Error).message }));
    } finally {
      setSaving(false);
    }
  }, [isBase, entityId, activeLocale, persistLocale, clearMessages, locale]);

  const publishActive = useCallback(async () => {
    if (isBase || !entityId) {
      return;
    }
    setSaving(true);
    clearMessages();
    try {
      await persistLocale(activeLocale, entityId);
      await contentTranslationApi.publish(entityType, entityId, activeLocale);
      setRowStatus((prev) => {
        const next = { ...(prev[activeLocale] ?? {}) };
        for (const field of fieldNames) {
          if ((buffer[activeLocale]?.[field] ?? '').trim()) {
            next[field] = 'published';
          }
        }
        return { ...prev, [activeLocale]: next };
      });
      setNotice(t(locale, 'loc.translationPublished'));
    } catch (err) {
      setError(t(locale, 'transadmin.saveError', { error: (err as Error).message }));
    } finally {
      setSaving(false);
    }
  }, [
    isBase,
    entityId,
    activeLocale,
    persistLocale,
    entityType,
    fieldNames,
    buffer,
    clearMessages,
    locale,
  ]);

  /** Create-time: upsert every buffered target field as a draft against the freshly-created entity. */
  const flushBuffered = useCallback(
    async (newEntityId: string) => {
      for (const code of visible) {
        if (code === BASE_LOCALE) {
          continue;
        }
        await persistLocale(code, newEntityId);
      }
    },
    [visible, persistLocale],
  );

  const anyDirty = useMemo(
    () => [...visible].some((code) => code !== BASE_LOCALE && isDirty(code)),
    [visible, isDirty],
  );

  // Warn before a full-page nav drops unsaved target edits (base edits go through the form's own save).
  const anyDirtyRef = useRef(anyDirty);
  anyDirtyRef.current = anyDirty;
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const handler = (event: BeforeUnloadEvent) => {
      if (anyDirtyRef.current) {
        event.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [enabled]);

  return {
    availableLocales,
    addableLocales,
    activeLocale,
    isBase,
    baseLocale: BASE_LOCALE,
    setActiveLocale,
    addLanguage,
    valueFor,
    setValueFor,
    baseValueFor,
    status,
    completeness,
    isDirty,
    anyDirty,
    saving,
    error,
    notice,
    clearMessages,
    saveActive,
    publishActive,
    flushBuffered,
  };
}

export type LocaleContent = ReturnType<typeof useLocaleContent>;
