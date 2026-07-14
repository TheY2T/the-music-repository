import {
  ApiProvider,
  type CollectionEntry,
  type CollectionProgressDetail,
  type CollectionSectionView,
  useGetCollectionWithProgress,
} from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import {
  Badge,
  buttonVariants,
  Card,
  Chip,
  cn,
  EmptyState,
  Icon,
  Progress,
  Skeleton,
  StatTile,
} from '@TheY2T/tmr-ui';
import { marked } from 'marked';
import { useEffect, useState } from 'react';
import AnimatedCoverArt from '@/components/AnimatedCoverArt';
import CollectionRating from '@/components/CollectionRating';
import SaveCollectionButton from '@/components/SaveCollectionButton';
import { listSavedCollectionSlugs, recordCollectionOpen } from '@/lib/collections-api';
import { markComplete, markIncomplete } from '@/lib/progress-api';

interface Flags {
  showProgress: boolean;
  showSave: boolean;
  showRating: boolean;
}

function ItemRow({
  entry,
  locale,
  showProgress,
  completed,
  onToggle,
}: {
  entry: CollectionEntry;
  locale: Locale;
  showProgress: boolean;
  completed: boolean;
  onToggle: (slug: string, next: boolean) => void;
}) {
  return (
    <li id={`item-${entry.content.slug}`}>
      <Card className="flex items-center gap-4 p-4 transition hover:border-accent">
        {showProgress ? (
          <button
            type="button"
            onClick={() => onToggle(entry.content.slug, !completed)}
            aria-pressed={completed}
            aria-label={t(
              locale,
              completed ? 'collections.completedItem' : 'collections.completeItem',
            )}
            className={cn(
              'shrink-0 transition-colors',
              completed ? 'text-success' : 'text-muted-foreground hover:text-accent',
            )}
          >
            <Icon name={completed ? 'circle-check' : 'circle'} className="size-6" />
          </button>
        ) : (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/15 font-display text-sm font-semibold text-accent tabular-nums">
            {entry.position + 1}
          </span>
        )}

        <a
          href={localizedPath(locale, `/catalogue/${entry.content.slug}`)}
          className="group flex min-w-0 flex-1 flex-col gap-1"
        >
          <span className="font-display font-semibold leading-snug group-hover:text-accent">
            {entry.content.title}
          </span>
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{entry.content.type}</Badge>
            {entry.content.difficulty ? (
              <span className="text-xs text-muted-foreground">
                {t(locale, 'catalogue.grade', { level: entry.content.difficulty })}
              </span>
            ) : null}
          </span>
          {entry.curatorNote ? (
            <span className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground/80">
                {t(locale, 'collections.curatorNote')}
              </span>{' '}
              {entry.curatorNote}
            </span>
          ) : null}
          {entry.focusSkills && entry.focusSkills.length > 0 ? (
            <span className="flex flex-wrap gap-1.5 pt-0.5">
              {entry.focusSkills.map((skill) => (
                <Chip key={skill} variant="muted">
                  {skill}
                </Chip>
              ))}
            </span>
          ) : null}
        </a>

        <Icon name="chevron-right" className="ml-auto size-5 shrink-0 text-muted-foreground" />
      </Card>
    </li>
  );
}

function Section({
  section,
  locale,
  showProgress,
  completedSet,
  onToggle,
}: {
  section: CollectionSectionView;
  locale: Locale;
  showProgress: boolean;
  completedSet: Set<string>;
  onToggle: (slug: string, next: boolean) => void;
}) {
  if (!section.items.length) {
    return null;
  }
  return (
    <section className="space-y-3">
      <div className="space-y-1 border-b border-border pb-2">
        <h2 className="font-display text-xl font-semibold tracking-tight">{section.title}</h2>
        {section.description ? (
          <p className="text-sm text-muted-foreground">{section.description}</p>
        ) : null}
      </div>
      <ol className="space-y-3">
        {section.items.map((entry) => (
          <ItemRow
            key={entry.content.slug}
            entry={entry}
            locale={locale}
            showProgress={showProgress}
            completed={completedSet.has(entry.content.slug)}
            onToggle={onToggle}
          />
        ))}
      </ol>
    </section>
  );
}

function Detail({ slug, locale, flags }: { slug: string; locale: Locale; flags: Flags }) {
  const { data, isLoading } = useGetCollectionWithProgress(slug);
  const collection = data?.status === 200 ? (data.data as CollectionProgressDetail) : undefined;

  const [completedSet, setCompletedSet] = useState<Set<string>>(new Set());
  const [initialSaved, setInitialSaved] = useState(false);

  // Seed completion from the server payload once loaded.
  useEffect(() => {
    if (collection) {
      setCompletedSet(
        new Set(collection.items.filter((e) => e.completed).map((e) => e.content.slug)),
      );
    }
  }, [collection]);

  useEffect(() => {
    recordCollectionOpen(slug);
  }, [slug]);

  useEffect(() => {
    if (flags.showSave) {
      listSavedCollectionSlugs().then((slugs) => setInitialSaved(slugs.includes(slug)));
    }
  }, [flags.showSave, slug]);

  async function toggle(contentSlug: string, next: boolean) {
    setCompletedSet((prev) => {
      const updated = new Set(prev);
      if (next) updated.add(contentSlug);
      else updated.delete(contentSlug);
      return updated;
    });
    try {
      await (next ? markComplete(contentSlug) : markIncomplete(contentSlug));
    } catch {
      setCompletedSet((prev) => {
        const updated = new Set(prev);
        if (next) updated.delete(contentSlug);
        else updated.add(contentSlug);
        return updated;
      });
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="aspect-[3/1] w-full" />
      </div>
    );
  }
  if (!collection) {
    return (
      <EmptyState
        icon={<Icon name="list-music" className="size-6" />}
        title={t(locale, 'collections.notFound')}
        action={
          <a
            href={localizedPath(locale, '/collections')}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            {t(locale, 'common.backCollections')}
          </a>
        }
      />
    );
  }

  const total = collection.items.length;
  const doneCount = collection.items.filter((e) => completedSet.has(e.content.slug)).length;
  const percent = total ? Math.round((doneCount / total) * 100) : 0;
  const nextUp = collection.items.find((e) => !completedSet.has(e.content.slug));
  const bodyHtml = collection.bodyMdx ? (marked.parse(collection.bodyMdx) as string) : '';
  const ungrouped = collection.items.filter((e) => !e.sectionId);

  return (
    <article className="space-y-8">
      <header className="grid gap-6 md:grid-cols-[1fr_260px] md:items-start">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{collection.kind}</Badge>
            {collection.featured ? (
              <Badge variant="warning">
                <Icon name="sparkles" className="size-3" />
                {t(locale, 'collections.featuredBadge')}
              </Badge>
            ) : null}
          </div>
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight">
            {collection.title}
          </h1>
          {collection.summary ? (
            <p className="text-lg text-muted-foreground">{collection.summary}</p>
          ) : null}
          {collection.curatorName ? (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Icon name="user" className="size-4" />
              {t(locale, 'collections.byCurator', { curator: collection.curatorName })}
            </p>
          ) : null}
        </div>
        <div className="hidden md:block">
          <AnimatedCoverArt
            title={collection.title}
            seed={collection.slug}
            showLabel={false}
            className="border border-border"
          />
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {collection.difficultyMin != null ? (
          <StatTile
            iconName="gauge"
            label={t(locale, 'collections.statDifficulty')}
            value={t(locale, 'collections.difficultyRange', {
              min: collection.difficultyMin,
              max: collection.difficultyMax ?? collection.difficultyMin,
            })}
          />
        ) : null}
        {collection.estMinutes ? (
          <StatTile
            iconName="clock"
            label={t(locale, 'collections.statDuration')}
            value={
              collection.estMinutes >= 60
                ? t(locale, 'collections.durationHours', {
                    hours: Math.round(collection.estMinutes / 60),
                  })
                : t(locale, 'collections.durationMinutes', { minutes: collection.estMinutes })
            }
          />
        ) : null}
        <StatTile
          iconName="list-music"
          label={t(locale, 'collections.statItems')}
          value={`${total}`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {flags.showSave ? (
          <SaveCollectionButton
            slug={collection.slug}
            initialSaved={initialSaved}
            variant="button"
            labels={{ save: t(locale, 'collections.save'), saved: t(locale, 'collections.saved') }}
          />
        ) : null}
        <CollectionRating
          slug={collection.slug}
          average={collection.averageRating ?? undefined}
          count={collection.ratingCount}
          interactive={flags.showRating}
          labels={{
            yourRating: t(locale, 'collections.yourRating'),
            averageRating: t(locale, 'collections.averageRating'),
            rateAria: (star) => t(locale, 'collections.rateAria', { star }),
            ratingCount: (count) => t(locale, 'collections.ratingCount', { count }),
          }}
        />
      </div>

      {flags.showProgress && total > 0 ? (
        <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{t(locale, 'collections.progressLabel')}</span>
              <span className="text-muted-foreground tabular-nums">{percent}%</span>
            </div>
            <Progress value={percent} />
          </div>
          {nextUp ? (
            <a
              href={`#item-${nextUp.content.slug}`}
              className={cn(buttonVariants({ size: 'sm' }), 'shrink-0')}
            >
              <Icon name="play" className="size-4" />
              {percent === 0
                ? t(locale, 'collections.startLearning')
                : t(locale, 'collections.resume')}
            </a>
          ) : (
            <Badge variant="secondary" className="shrink-0">
              <Icon name="circle-check" className="size-3" />
              {t(locale, 'collections.completed')}
            </Badge>
          )}
        </Card>
      ) : null}

      {collection.outcomes && collection.outcomes.length > 0 ? (
        <Card className="space-y-2.5 p-5">
          <p className="font-display font-semibold">{t(locale, 'collections.whatYouLearn')}</p>
          <ul className="grid gap-1.5">
            {collection.outcomes.map((outcome) => (
              <li key={outcome} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Icon name="circle-check" className="mt-0.5 size-4 shrink-0 text-success" />
                {outcome}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {bodyHtml ? (
        <section
          className="prose max-w-none prose-headings:font-display"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted seeded/CMS markdown via marked.
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      ) : null}

      {ungrouped.length > 0 ? (
        <ol className="space-y-3">
          {ungrouped.map((entry) => (
            <ItemRow
              key={entry.content.slug}
              entry={entry}
              locale={locale}
              showProgress={flags.showProgress}
              completed={completedSet.has(entry.content.slug)}
              onToggle={toggle}
            />
          ))}
        </ol>
      ) : null}

      {collection.sections.map((section) => (
        <Section
          key={section.id}
          section={section}
          locale={locale}
          showProgress={flags.showProgress}
          completedSet={completedSet}
          onToggle={toggle}
        />
      ))}
    </article>
  );
}

export default function CollectionDetail({
  slug,
  locale,
  showProgress = false,
  showSave = false,
  showRating = false,
}: {
  slug: string;
  locale: Locale;
  showProgress?: boolean;
  showSave?: boolean;
  showRating?: boolean;
}) {
  return (
    <ApiProvider>
      <Detail slug={slug} locale={locale} flags={{ showProgress, showSave, showRating }} />
    </ApiProvider>
  );
}
