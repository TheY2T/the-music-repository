import {
  ApiProvider,
  type CollectionDetail as CollectionDetailDto,
  useGetCollectionBySlug,
} from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import { Badge } from '@TheY2T/tmr-ui';

function Detail({ slug, locale }: { slug: string; locale: Locale }) {
  const { data, isLoading } = useGetCollectionBySlug(slug);
  const collection = data?.status === 200 ? (data.data as CollectionDetailDto) : undefined;

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t(locale, 'common.loading')}</p>;
  }
  if (!collection) {
    return <p className="text-sm text-red-500">{t(locale, 'collections.notFound')}</p>;
  }

  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <Badge variant="secondary" className="font-mono">
          {collection.kind}
        </Badge>
        <h1 className="text-3xl font-bold">{collection.title}</h1>
        {collection.summary ? <p className="text-muted-foreground">{collection.summary}</p> : null}
      </header>

      <ol className="space-y-2">
        {collection.items.map((entry) => (
          <li key={entry.content.slug}>
            <a
              href={localizedPath(locale, `/catalogue/${entry.content.slug}`)}
              className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                {entry.position + 1}
              </span>
              <span className="flex flex-col">
                <span className="font-medium leading-snug">{entry.content.title}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {entry.content.type}
                  {entry.content.difficulty
                    ? ` · ${t(locale, 'catalogue.grade', { level: entry.content.difficulty })}`
                    : ''}
                </span>
              </span>
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
