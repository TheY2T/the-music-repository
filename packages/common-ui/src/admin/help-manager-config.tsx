import type { HelpTopic } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import { Icon, TableCell, TableHead } from '@TheY2T/tmr-ui';
import { byFixedOrder } from '@TheY2T/tmr-web-data/admin-manager';
import { listHelpTopics } from '@TheY2T/tmr-web-data/help-api';
import type { EntityManagerConfig } from './EntityManager';

type Row = HelpTopic;

const LINK_ORDER = ['linked', 'standalone'] as const;
const linkBucket = (topic: Row) => (topic.linkSlug ? 'linked' : 'standalone');
const linkLabel = (locale: Locale, value: string) =>
  value === 'linked' ? t(locale, 'acm.helpLinked') : t(locale, 'acm.helpStandalone');

/**
 * Config for the help-topics manager. Help topics have no status or taxonomy, so this is a reduced
 * manager: Hub (grouped by whether the topic is linked to an article) + Table, with search — no board
 * and no axis switcher (a single axis renders without one).
 */
export function helpManagerConfig(locale: Locale): EntityManagerConfig<Row> {
  return {
    entity: 'help',
    locale,
    load: () => listHelpTopics(),
    getKey: (topic) => topic.slug,
    getTitle: (topic) => topic.term,
    getSubtitle: (topic) => topic.slug,
    editHref: (key) => localizedPath(locale, `/admin/help/${encodeURIComponent(key)}/edit`),
    newHref: localizedPath(locale, '/admin/help/new'),
    newLabel: t(locale, 'ahelp.newTopic'),
    searchPlaceholder: t(locale, 'acm.searchPlaceholder'),
    emptyLabel: t(locale, 'acm.empty'),
    loadError: (error) => t(locale, 'acl.loadError', { error }),
    matchesQuery: (topic, q) => {
      const needle = q.toLowerCase();
      return (
        topic.term.toLowerCase().includes(needle) ||
        topic.slug.toLowerCase().includes(needle) ||
        topic.body.toLowerCase().includes(needle)
      );
    },
    defaultRowSort: (a, b) => a.term.localeCompare(b.term),

    cardMeta: (topic) => (
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {topic.linkSlug ? (
          <span className="inline-flex items-center gap-1">
            <Icon name="link" className="size-3" />
            {topic.linkSlug}
          </span>
        ) : (
          <span>{t(locale, 'acm.helpStandalone')}</span>
        )}
      </div>
    ),

    headCells: <TableHead>{t(locale, 'acm.helpColLinked')}</TableHead>,
    rowCells: (topic) => (
      <TableCell className="text-muted-foreground">{topic.linkSlug ?? '—'}</TableCell>
    ),

    views: ['hub', 'table'],
    defaultAxis: 'link',
    axes: [
      {
        key: 'link',
        label: t(locale, 'acm.helpColLinked'),
        getValues: (topic) => [linkBucket(topic)],
        order: byFixedOrder(LINK_ORDER),
        valueLabel: (v) => linkLabel(locale, v),
      },
    ],

    facets: [
      {
        key: 'link',
        label: t(locale, 'acm.helpColLinked'),
        getValues: (topic) => [linkBucket(topic)],
        valueLabel: (v) => linkLabel(locale, v),
        order: LINK_ORDER,
      },
    ],

    sorts: [
      {
        key: 'term',
        label: t(locale, 'ahelp.colTerm'),
        compare: (a, b) => a.term.localeCompare(b.term),
      },
      {
        key: 'slug',
        label: t(locale, 'ahelp.colSlug'),
        compare: (a, b) => a.slug.localeCompare(b.slug),
      },
    ],
    defaultSort: 'term',
  };
}
