import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import { Icon, TableCell, TableHead } from '@TheY2T/tmr-ui';
import { byCountThenValue } from '@TheY2T/tmr-web-acl/admin-manager';
import type { FaqEntry } from '@TheY2T/tmr-web-acl/dto';
import { listFaqEntries } from '@TheY2T/tmr-web-acl/faq-api';
import type { EntityManagerConfig } from './EntityManager';

type Row = FaqEntry;

/**
 * Config for the FAQ manager. Entries have a category (grouping) and a manual sort order but no
 * publish status, so this is a reduced manager: Hub (grouped by category) + Table, with search — no
 * board.
 */
export function faqManagerConfig(locale: Locale): EntityManagerConfig<Row> {
  return {
    entity: 'faq',
    locale,
    load: () => listFaqEntries(),
    getKey: (entry) => entry.slug,
    getTitle: (entry) => entry.question,
    getSubtitle: (entry) => entry.slug,
    editHref: (key) => localizedPath(locale, `/admin/faq/${encodeURIComponent(key)}/edit`),
    newHref: localizedPath(locale, '/admin/faq/new'),
    newLabel: t(locale, 'afaq.newEntry'),
    searchPlaceholder: t(locale, 'acm.searchPlaceholder'),
    emptyLabel: t(locale, 'acm.empty'),
    loadError: (error) => t(locale, 'acl.loadError', { error }),
    matchesQuery: (entry, q) => {
      const needle = q.toLowerCase();
      return (
        entry.question.toLowerCase().includes(needle) ||
        entry.slug.toLowerCase().includes(needle) ||
        entry.answer.toLowerCase().includes(needle) ||
        entry.category.toLowerCase().includes(needle)
      );
    },
    defaultRowSort: (a, b) => a.category.localeCompare(b.category) || a.sortOrder - b.sortOrder,

    cardMeta: (entry) => (
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Icon name="folder" className="size-3" />
          {entry.category}
        </span>
      </div>
    ),

    headCells: <TableHead>{t(locale, 'afaq.colCategory')}</TableHead>,
    rowCells: (entry) => <TableCell className="text-muted-foreground">{entry.category}</TableCell>,

    views: ['hub', 'table'],
    defaultAxis: 'category',
    axes: [
      {
        key: 'category',
        label: t(locale, 'afaq.colCategory'),
        getValues: (entry) => [entry.category],
        order: byCountThenValue,
        valueLabel: (v) => v,
      },
    ],

    facets: [
      {
        key: 'category',
        label: t(locale, 'afaq.colCategory'),
        getValues: (entry) => [entry.category],
        valueLabel: (v) => v,
      },
    ],

    sorts: [
      {
        key: 'category',
        label: t(locale, 'afaq.colCategory'),
        compare: (a, b) => a.category.localeCompare(b.category) || a.sortOrder - b.sortOrder,
      },
      {
        key: 'question',
        label: t(locale, 'afaq.colQuestion'),
        compare: (a, b) => a.question.localeCompare(b.question),
      },
      {
        key: 'slug',
        label: t(locale, 'afaq.colSlug'),
        compare: (a, b) => a.slug.localeCompare(b.slug),
      },
    ],
    defaultSort: 'category',
  };
}
