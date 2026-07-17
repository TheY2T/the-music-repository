import type { CollectionSummary } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import { Badge, Icon, TableCell, TableHead } from '@TheY2T/tmr-ui';
import { collectionsAdminApi } from '@/lib/admin-api';
import { byCountThenValue, byFixedOrder } from '@/lib/admin-manager';
import type { EntityManagerConfig } from './EntityManager';
import { statusText, statusVariant, titleize } from './manager-helpers';

type Row = CollectionSummary;

const STATUS_ORDER = ['review', 'draft', 'published'] as const;

function difficultyRange(locale: Locale, c: Row): string | undefined {
  if (c.difficultyMin == null) return undefined;
  return t(locale, 'collections.difficultyRange', {
    min: c.difficultyMin,
    max: c.difficultyMax ?? c.difficultyMin,
  });
}

/** Config that drives the generic EntityManager for editorial collections. */
export function collectionManagerConfig(locale: Locale): EntityManagerConfig<Row> {
  const editHref = (key: string) =>
    localizedPath(locale, `/admin/collections/${encodeURIComponent(key)}/edit`);
  const facetValues = (key: 'era' | 'instrument' | 'genre') => (c: Row) => c.facets?.[key] ?? [];

  return {
    entity: 'collections',
    locale,
    load: () => collectionsAdminApi.list().then((r) => r.items),
    getKey: (c) => c.slug,
    getTitle: (c) => c.title,
    getSubtitle: (c) => c.slug,
    editHref,
    newHref: localizedPath(locale, '/admin/collections/new'),
    newLabel: t(locale, 'acoll.newCollection'),
    searchPlaceholder: t(locale, 'acm.searchPlaceholder'),
    emptyLabel: t(locale, 'acm.empty'),
    loadError: (error) => t(locale, 'acoll.loadError', { error }),
    matchesQuery: (c, q) => {
      const needle = q.toLowerCase();
      return c.title.toLowerCase().includes(needle) || c.slug.toLowerCase().includes(needle);
    },
    defaultRowSort: (a, b) => a.title.localeCompare(b.title),

    cardBadge: (c) => (
      <Badge variant={statusVariant(c.status)}>{statusText(locale, c.status)}</Badge>
    ),
    cardMeta: (c) => (
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>{titleize(c.kind)}</span>
        <span>{`${c.itemCount} ${t(locale, c.itemCount === 1 ? 'collections.itemOne' : 'collections.itemOther')}`}</span>
        {difficultyRange(locale, c) ? <span>{difficultyRange(locale, c)}</span> : null}
        {c.featured ? (
          <span className="inline-flex items-center gap-1 text-accent">
            <Icon name="star" className="size-3" />
            {t(locale, 'collections.featuredBadge')}
          </span>
        ) : null}
      </div>
    ),

    headCells: (
      <>
        <TableHead>{t(locale, 'acoll.colKind')}</TableHead>
        <TableHead>{t(locale, 'acl.colStatus')}</TableHead>
        <TableHead>{t(locale, 'acoll.colItems')}</TableHead>
      </>
    ),
    rowCells: (c) => (
      <>
        <TableCell className="text-muted-foreground">{titleize(c.kind)}</TableCell>
        <TableCell>
          <Badge variant={statusVariant(c.status)}>{statusText(locale, c.status)}</Badge>
        </TableCell>
        <TableCell className="tabular-nums text-muted-foreground">{c.itemCount}</TableCell>
      </>
    ),

    views: ['hub', 'table', 'board'],
    defaultAxis: 'status',
    axes: [
      {
        key: 'all',
        label: t(locale, 'acm.axisAll'),
        getValues: () => ['all'],
        order: byCountThenValue,
        valueLabel: () => t(locale, 'acm.axisAll'),
      },
      {
        key: 'status',
        label: t(locale, 'acm.axisStatus'),
        getValues: (c) => [c.status],
        order: byFixedOrder(STATUS_ORDER),
        valueLabel: (v) => statusText(locale, v),
      },
      {
        key: 'kind',
        label: t(locale, 'acoll.colKind'),
        getValues: (c) => [c.kind],
        order: byCountThenValue,
        valueLabel: titleize,
      },
      {
        key: 'instrument',
        label: t(locale, 'acm.axisInstrument'),
        getValues: facetValues('instrument'),
        order: byCountThenValue,
        valueLabel: titleize,
      },
      {
        key: 'era',
        label: t(locale, 'acm.axisEra'),
        getValues: facetValues('era'),
        order: byCountThenValue,
        valueLabel: (v) => v,
      },
    ],

    facets: [
      {
        key: 'status',
        label: t(locale, 'acl.colStatus'),
        getValues: (c) => [c.status],
        valueLabel: (v) => statusText(locale, v),
        order: STATUS_ORDER,
      },
      {
        key: 'kind',
        label: t(locale, 'acoll.colKind'),
        getValues: (c) => [c.kind],
        valueLabel: titleize,
      },
      {
        key: 'instrument',
        label: t(locale, 'acm.axisInstrument'),
        getValues: facetValues('instrument'),
        valueLabel: titleize,
      },
      {
        key: 'era',
        label: t(locale, 'acm.axisEra'),
        getValues: facetValues('era'),
        valueLabel: (v) => v,
      },
      {
        key: 'genre',
        label: t(locale, 'acm.axisGenre'),
        getValues: facetValues('genre'),
        valueLabel: titleize,
      },
    ],

    sorts: [
      {
        key: 'title',
        label: t(locale, 'acm.sortTitle'),
        compare: (a, b) => a.title.localeCompare(b.title),
      },
      {
        key: 'items',
        label: t(locale, 'acoll.colItems'),
        compare: (a, b) => b.itemCount - a.itemCount,
      },
    ],
    defaultSort: 'title',

    board: {
      columns: [
        { status: 'draft', label: statusText(locale, 'draft') },
        { status: 'published', label: statusText(locale, 'published') },
      ],
      getStatus: (c) => c.status,
      moveTargets: (c) =>
        (['draft', 'published'] as const)
          .filter((s) => s !== c.status)
          .map((s) => ({
            status: s,
            label: t(locale, s === 'published' ? 'acm.moveToPublished' : 'acm.moveToDraft'),
          })),
      setStatus: async (keys, status) => {
        await Promise.all(
          keys.map((slug) =>
            status === 'published'
              ? collectionsAdminApi.publish(slug)
              : collectionsAdminApi.unpublish(slug),
          ),
        );
      },
      applyStatus: (c, status) => ({ ...c, status: status as Row['status'] }),
      bulkActions: [
        { status: 'published', label: t(locale, 'acm.moveToPublished') },
        { status: 'draft', label: t(locale, 'acm.moveToDraft') },
      ],
    },
  };
}
