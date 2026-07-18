import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import {
  buttonVariants,
  cn,
  Icon,
  PaginationBar,
  SearchField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  usePagination,
} from '@TheY2T/tmr-ui';
import {
  listTranslationTargets,
  type TranslatableEntityType,
  type TranslationTargetSummary,
} from '@TheY2T/tmr-web-data/content-translations-api';
import { type LocaleInfo, listLocales } from '@TheY2T/tmr-web-data/i18n-api';
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';

/** The URL segment under /admin/localization/ that maps to each translatable entity type. */
const URL_SEGMENT: Record<TranslatableEntityType, string> = {
  content: 'catalogue',
  collection: 'collections',
  help: 'help',
};

/**
 * Content-localization list for ONE entity type (ADR 0034, Phase 2). Shows the type's translatable items
 * (catalogue / collection / help) in a paginated, searchable table; each row links to the full-page
 * localization editor. The entity type is fixed by the route (the Localization hub picks it), so there is
 * no type switcher here. i18n-by-prop.
 */
export default function ContentLocalizationList({
  locale,
  entityType,
}: {
  locale: Locale;
  entityType: TranslatableEntityType;
}) {
  const [targets, setTargets] = useState<TranslationTargetSummary[] | null>(null);
  const [search, setSearch] = useState('');
  const [locales, setLocales] = useState<LocaleInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listLocales().then(setLocales);
  }, []);

  const reload = useCallback(async () => {
    setError(null);
    setTargets(null);
    try {
      setTargets(await listTranslationTargets(entityType));
    } catch (err) {
      setError(t(locale, 'transadmin.loadError', { error: (err as Error).message }));
      setTargets([]);
    }
  }, [entityType, locale]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const deferredSearch = useDeferredValue(search);
  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) {
      return targets ?? [];
    }
    return (targets ?? []).filter(
      (item) => item.title.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q),
    );
  }, [targets, deferredSearch]);

  const pg = usePagination(filtered, { resetKey: `${entityType}|${deferredSearch}` });
  const targetLocales = locales.filter((l) => l.code !== 'en');
  const editorHref = (slug: string) =>
    localizedPath(locale, `/admin/localization/${URL_SEGMENT[entityType]}/${slug}`);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          className="w-full sm:w-72"
          placeholder={t(locale, 'transadmin.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
        <span className="ml-auto text-sm text-muted-foreground">
          {t(locale, 'localeadmin.count', { count: filtered.length })}
        </span>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {targetLocales.length === 0 ? (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          {t(locale, 'transadmin.noLocales')}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t(locale, 'transadmin.colTitle')}</TableHead>
              <TableHead>{t(locale, 'transadmin.colSlug')}</TableHead>
              <TableHead className="w-px" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {targets === null ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  <Icon name="loader" className="mx-auto size-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  {t(locale, 'transadmin.empty')}
                </TableCell>
              </TableRow>
            ) : (
              pg.pageItems.map((item) => (
                <TableRow key={item.slug}>
                  <TableCell className="max-w-[24rem] truncate text-sm" title={item.title}>
                    {item.title}
                  </TableCell>
                  <TableCell className="max-w-[16rem] truncate font-mono text-xs" title={item.slug}>
                    {item.slug}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <a
                        href={editorHref(item.slug)}
                        title={t(locale, 'loc.tipLocalize')}
                        aria-disabled={targetLocales.length === 0}
                        className={cn(
                          buttonVariants({ size: 'sm', variant: 'ghost' }),
                          targetLocales.length === 0 && 'pointer-events-none opacity-50',
                        )}
                      >
                        <Icon name="languages" className="size-4" />
                        {t(locale, 'loc.localize')}
                      </a>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {targets !== null && filtered.length > 0 ? (
        <PaginationBar
          page={pg.page}
          pageCount={pg.pageCount}
          pageSize={pg.pageSize}
          pageSizes={pg.pageSizes}
          rangeFrom={pg.rangeFrom}
          rangeTo={pg.rangeTo}
          total={pg.total}
          onPageChange={pg.setPage}
          onPageSizeChange={pg.setPageSize}
          perPageLabel={t(locale, 'common.perPage')}
          showingLabel={t(locale, 'common.showing', {
            from: pg.rangeFrom,
            to: pg.rangeTo,
            total: pg.total,
          })}
          prevLabel={t(locale, 'common.prev')}
          nextLabel={t(locale, 'common.next')}
        />
      ) : null}
    </div>
  );
}
