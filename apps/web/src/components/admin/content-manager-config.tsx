import type { ContentAdminSummary, ContentWriteInput } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, type MessageKey, t } from '@TheY2T/tmr-i18n';
import { Badge, Icon, TableCell, TableHead } from '@TheY2T/tmr-ui';
import { adminApi } from '@/lib/admin-api';
import { byCountThenValue, byFixedOrder } from '@/lib/admin-manager';
import { LEVEL_BANDS, LEVEL_LABEL, type LevelBand } from '@/lib/catalogue-shelves';
import type { EntityManagerConfig } from './EntityManager';
import { relativeTime, statusText, statusVariant, titleize } from './manager-helpers';

type Row = ContentAdminSummary;

const CONTENT_STATUSES = ['draft', 'review', 'published'] as const;
const SHELF_STATUS_ORDER = ['review', 'draft', 'published'] as const;
const BOARD_STATUS_ORDER = ['draft', 'review', 'published'] as const;
const BAND_ORDER = LEVEL_BANDS.map((b) => b.key as string);

const TYPE_LABEL: Record<string, MessageKey> = {
  lesson: 'cform.typeLesson',
  song: 'cform.typeSong',
  score: 'cform.typeScore',
  exercise: 'cform.typeExercise',
  technique: 'cform.typeTechnique',
  backing_track: 'cform.typeBackingTrack',
  tool_page: 'cform.typeToolPage',
};
const MOVE_LABEL: Record<string, MessageKey> = {
  draft: 'acm.moveToDraft',
  review: 'acm.moveToReview',
  published: 'acm.moveToPublished',
};

function levelBandOf(difficulty: number | null | undefined): LevelBand | undefined {
  if (difficulty == null) return undefined;
  return LEVEL_BANDS.find((b) => difficulty >= b.min && difficulty <= b.max)?.key;
}
function typeText(locale: Locale, type: string): string {
  const key = TYPE_LABEL[type];
  return key ? t(locale, key) : titleize(type);
}
function bandValues(c: Row): string[] {
  const band = levelBandOf(c.difficulty);
  return band ? [band] : [];
}
function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'untitled'
  );
}

/** Config that drives the generic EntityManager for catalogue content. */
export function contentManagerConfig(locale: Locale): EntityManagerConfig<Row> {
  return {
    entity: 'content',
    locale,
    load: () => adminApi.list().then((r) => r.items),
    getKey: (c) => c.slug,
    getTitle: (c) => c.title,
    getSubtitle: (c) => c.slug,
    editHref: (key) => localizedPath(locale, `/admin/content/${encodeURIComponent(key)}/edit`),
    newHref: localizedPath(locale, '/admin/content/new'),
    newLabel: t(locale, 'acl.newContent'),
    quickCreate: {
      typeOptions: Object.keys(TYPE_LABEL).map((v) => ({ value: v, label: typeText(locale, v) })),
      create: async ({ title, type }) => {
        const slug = slugify(title);
        await adminApi.create({
          slug,
          title,
          type: (type ?? 'lesson') as ContentWriteInput['type'],
          genres: [],
          instruments: [],
          topics: [],
          tags: [],
        });
        return slug;
      },
    },
    duplicate: async (c) => {
      const detail = await adminApi.get(c.slug);
      const slug = `${c.slug}-copy`;
      await adminApi.create({
        slug,
        title: `Copy of ${c.title}`,
        type: detail.type,
        summary: detail.summary ?? undefined,
        difficulty: detail.difficulty ?? undefined,
        visibility: detail.visibility,
        tier: detail.tier ?? undefined,
        bodyMdx: detail.bodyMdx ?? undefined,
        source: detail.source ?? undefined,
        attribution: detail.attribution ?? undefined,
        license: detail.license ?? undefined,
        genres: detail.genres.map((g) => g.slug),
        instruments: detail.instruments.map((g) => g.slug),
        topics: detail.topics.map((g) => g.slug),
        tags: detail.tags.map((g) => g.slug),
        details: detail.details ?? undefined,
        embeds: detail.embeds ?? undefined,
      });
      return slug;
    },
    searchPlaceholder: t(locale, 'acm.searchPlaceholder'),
    emptyLabel: t(locale, 'acm.empty'),
    loadError: (error) => t(locale, 'acl.loadError', { error }),
    matchesQuery: (c, q) => {
      const needle = q.toLowerCase();
      return c.title.toLowerCase().includes(needle) || c.slug.toLowerCase().includes(needle);
    },
    defaultRowSort: (a, b) =>
      a.updatedAt === b.updatedAt ? 0 : a.updatedAt > b.updatedAt ? -1 : 1,

    cardBadge: (c) => (
      <Badge variant={statusVariant(c.status)}>{statusText(locale, c.status)}</Badge>
    ),
    cardMeta: (c) => {
      const tags = [...c.instruments, ...c.genres].slice(0, 3);
      return (
        <>
          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{typeText(locale, c.type)}</span>
            {c.difficulty != null ? (
              <span>{t(locale, 'catalogue.grade', { level: c.difficulty })}</span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Icon name="clock" className="size-3" />
              {relativeTime(c.updatedAt, locale)}
            </span>
          </div>
          {tags.length ? (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {titleize(tag)}
                </Badge>
              ))}
            </div>
          ) : null}
        </>
      );
    },

    headCells: (
      <>
        <TableHead>{t(locale, 'acl.colType')}</TableHead>
        <TableHead>{t(locale, 'acl.colStatus')}</TableHead>
        <TableHead>{t(locale, 'acm.colUpdated')}</TableHead>
      </>
    ),
    rowCells: (c) => (
      <>
        <TableCell className="text-muted-foreground">{typeText(locale, c.type)}</TableCell>
        <TableCell>
          <Badge variant={statusVariant(c.status)}>{statusText(locale, c.status)}</Badge>
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">
          {relativeTime(c.updatedAt, locale)}
        </TableCell>
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
        order: byFixedOrder(SHELF_STATUS_ORDER),
        valueLabel: (v) => statusText(locale, v),
      },
      {
        key: 'type',
        label: t(locale, 'acm.axisType'),
        getValues: (c) => [c.type],
        order: byCountThenValue,
        valueLabel: (v) => typeText(locale, v),
        createType: true,
      },
      {
        key: 'instrument',
        label: t(locale, 'acm.axisInstrument'),
        getValues: (c) => c.instruments,
        order: byCountThenValue,
        valueLabel: titleize,
      },
      {
        key: 'genre',
        label: t(locale, 'acm.axisGenre'),
        getValues: (c) => c.genres,
        order: byCountThenValue,
        valueLabel: titleize,
      },
      {
        key: 'era',
        label: t(locale, 'acm.axisEra'),
        getValues: (c) => (c.era ? [c.era] : []),
        order: byCountThenValue,
        valueLabel: (v) => v,
      },
      {
        key: 'difficulty',
        label: t(locale, 'acm.axisDifficulty'),
        getValues: bandValues,
        order: byFixedOrder(BAND_ORDER),
        valueLabel: (v) => t(locale, LEVEL_LABEL[v as LevelBand]),
      },
    ],

    facets: [
      {
        key: 'status',
        label: t(locale, 'acm.facetStatus'),
        getValues: (c) => [c.status],
        valueLabel: (v) => statusText(locale, v),
        order: SHELF_STATUS_ORDER,
      },
      {
        key: 'type',
        label: t(locale, 'acm.facetType'),
        getValues: (c) => [c.type],
        valueLabel: (v) => typeText(locale, v),
      },
      {
        key: 'level',
        label: t(locale, 'acm.facetLevel'),
        getValues: bandValues,
        valueLabel: (v) => t(locale, LEVEL_LABEL[v as LevelBand]),
        order: BAND_ORDER,
      },
      {
        key: 'genre',
        label: t(locale, 'acm.facetGenre'),
        getValues: (c) => c.genres,
        valueLabel: titleize,
      },
      {
        key: 'instrument',
        label: t(locale, 'acm.facetInstrument'),
        getValues: (c) => c.instruments,
        valueLabel: titleize,
      },
      {
        key: 'era',
        label: t(locale, 'acm.facetEra'),
        getValues: (c) => (c.era ? [c.era] : []),
        valueLabel: (v) => v,
      },
      {
        key: 'tier',
        label: t(locale, 'acm.facetTier'),
        getValues: (c) => (c.tier ? [c.tier] : []),
        valueLabel: titleize,
      },
    ],

    sorts: [
      {
        key: 'updated',
        label: t(locale, 'acm.sortUpdated'),
        compare: (a, b) => (a.updatedAt === b.updatedAt ? 0 : a.updatedAt > b.updatedAt ? -1 : 1),
      },
      {
        key: 'title',
        label: t(locale, 'acm.sortTitle'),
        compare: (a, b) => a.title.localeCompare(b.title),
      },
      {
        key: 'difficulty',
        label: t(locale, 'acm.sortDifficulty'),
        compare: (a, b) =>
          (a.difficulty ?? Number.POSITIVE_INFINITY) - (b.difficulty ?? Number.POSITIVE_INFINITY),
      },
    ],
    defaultSort: 'updated',

    board: {
      columns: BOARD_STATUS_ORDER.map((status) => ({ status, label: statusText(locale, status) })),
      getStatus: (c) => c.status,
      moveTargets: (c) =>
        CONTENT_STATUSES.filter((s) => s !== c.status).map((s) => ({
          status: s,
          label: t(locale, MOVE_LABEL[s]),
        })),
      setStatus: async (keys, status) => {
        await Promise.all(
          keys.map((slug) => adminApi.setStatus(slug, status as 'draft' | 'review' | 'published')),
        );
      },
      applyStatus: (c, status) => ({ ...c, status: status as Row['status'] }),
      bulkActions: [
        { status: 'published', label: t(locale, 'acm.moveToPublished') },
        { status: 'review', label: t(locale, 'acm.bulkReview') },
        { status: 'draft', label: t(locale, 'acm.bulkDraft') },
      ],
    },
  };
}
