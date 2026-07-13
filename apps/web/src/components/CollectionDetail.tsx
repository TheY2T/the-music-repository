import {
  ApiProvider,
  type CollectionDetail as CollectionDetailDto,
  useGetCollectionBySlug,
} from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import { Badge, buttonVariants, Card, cn, EmptyState, Icon } from '@TheY2T/tmr-ui';

function Detail({ slug, locale }: { slug: string; locale: Locale }) {
  const { data, isLoading } = useGetCollectionBySlug(slug);
  const collection = data?.status === 200 ? (data.data as CollectionDetailDto) : undefined;

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t(locale, 'common.loading')}</p>;
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

  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{collection.kind}</Badge>
          <span className="text-xs text-muted-foreground">
            {collection.itemCount}{' '}
            {t(
              locale,
              collection.itemCount === 1 ? 'collections.itemOne' : 'collections.itemOther',
            )}
          </span>
        </div>
        <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight">
          {collection.title}
        </h1>
        {collection.summary ? (
          <p className="text-lg text-muted-foreground">{collection.summary}</p>
        ) : null}
      </header>

      <ol className="space-y-3">
        {collection.items.map((entry) => (
          <li key={entry.content.slug}>
            <a
              href={localizedPath(locale, `/catalogue/${entry.content.slug}`)}
              className="group block"
            >
              <Card className="flex items-center gap-4 p-4 transition group-hover:-translate-y-0.5 group-hover:border-accent group-hover:shadow-md">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/15 font-display text-sm font-semibold text-accent tabular-nums">
                  {entry.position + 1}
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="font-display font-semibold leading-snug">
                    {entry.content.title}
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary">{entry.content.type}</Badge>
                    {entry.content.difficulty ? (
                      <span className="text-xs text-muted-foreground">
                        {t(locale, 'catalogue.grade', { level: entry.content.difficulty })}
                      </span>
                    ) : null}
                  </span>
                </span>
                <Icon
                  name="chevron-right"
                  className="ml-auto size-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-accent"
                />
              </Card>
            </a>
          </li>
        ))}
      </ol>
    </article>
  );
}

export default function CollectionDetail({ slug, locale }: { slug: string; locale: Locale }) {
  return (
    <ApiProvider>
      <Detail slug={slug} locale={locale} />
    </ApiProvider>
  );
}
