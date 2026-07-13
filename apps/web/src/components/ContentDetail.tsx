import {
  ApiProvider,
  type ContentDetail as ContentDetailDto,
  type ContentSummary,
  useGetContentBySlug,
  useGetRelatedContent,
} from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, type MessageKey, t } from '@TheY2T/tmr-i18n';
import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  buttonVariants,
  Card,
  CardGrid,
  Chip,
  CoverArt,
  cn,
  EmptyState,
  Icon,
  MediaCard,
  Skeleton,
} from '@TheY2T/tmr-ui';

/** Localized label for a premium tier (`premium`/`pro`/`institution`; unknown → premium). */
function tierLabel(locale: Locale, tier?: string | null): string {
  const key: MessageKey =
    tier === 'pro' ? 'tier.pro' : tier === 'institution' ? 'tier.institution' : 'tier.premium';
  return t(locale, key);
}

function RelatedSection({ slug, locale }: { slug: string; locale: Locale }) {
  const { data } = useGetRelatedContent(slug);
  const items = data?.status === 200 ? (data.data.items as ContentSummary[]) : [];
  if (!items.length) {
    return null;
  }
  return (
    <section className="space-y-3 border-t border-border pt-8">
      <h2 className="font-display text-xl font-semibold tracking-tight">
        {t(locale, 'content.related')}
      </h2>
      <CardGrid className="gap-4">
        {items.map((item) => (
          <li key={item.slug}>
            <MediaCard
              title={item.title}
              href={localizedPath(locale, `/catalogue/${item.slug}`)}
              summary={item.summary ?? undefined}
              typeLabel={item.type}
              difficultyLabel={
                item.difficulty
                  ? t(locale, 'catalogue.grade', { level: item.difficulty })
                  : undefined
              }
              seed={item.slug}
              tags={[...item.genres, ...item.instruments].map((r) => r.name)}
            />
          </li>
        ))}
      </CardGrid>
    </section>
  );
}

function Detail({ slug, locale }: { slug: string; locale: Locale }) {
  const { data, isLoading } = useGetContentBySlug(slug);
  // customFetch returns non-2xx as data (not a throw), so narrow on the 200 status.
  const item = data?.status === 200 ? (data.data as ContentDetailDto) : undefined;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="aspect-[3/2] w-full" />
      </div>
    );
  }
  if (!item) {
    return (
      <EmptyState
        icon={<Icon name="search" className="size-6" />}
        title={t(locale, 'content.notFound')}
        action={
          <a
            href={localizedPath(locale, '/catalogue')}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            {t(locale, 'common.backCatalogue')}
          </a>
        }
      />
    );
  }

  const pdf = item.media.find((asset) => asset.kind === 'score_pdf');
  const audio = item.media.find((asset) => asset.kind === 'audio');

  return (
    <article className="space-y-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={localizedPath(locale, '/')}>
              {t(locale, 'common.home')}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={localizedPath(locale, '/catalogue')}>
              {t(locale, 'common.backCatalogue')}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{item.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="grid gap-6 md:grid-cols-[1fr_260px] md:items-start">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{item.type}</Badge>
            {item.difficulty ? (
              <span className="text-xs text-muted-foreground">
                {t(locale, 'catalogue.grade', { level: item.difficulty })}
              </span>
            ) : null}
            {item.locked ? (
              <Badge variant="warning">
                <Icon name="lock" className="size-3" />
                {tierLabel(locale, item.tier)}
              </Badge>
            ) : null}
          </div>
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight">
            {item.title}
          </h1>
          {item.summary ? <p className="text-lg text-muted-foreground">{item.summary}</p> : null}
          <div className="flex flex-wrap gap-1.5">
            {[...item.genres, ...item.instruments].map((ref) => (
              <Chip key={ref.slug}>{ref.name}</Chip>
            ))}
            {/* Topic chips opt into the Info View — hover/focus shows the help topic. */}
            {item.topics.map((ref) => (
              <Chip key={ref.slug} data-help={ref.slug}>
                {ref.name}
              </Chip>
            ))}
          </div>
        </div>
        <div className="hidden md:block">
          <CoverArt
            title={item.title}
            subtitle={item.attribution ?? undefined}
            seed={item.slug}
            showLabel={false}
            className="rounded-lg border border-border"
          />
        </div>
      </header>

      {item.locked ? (
        <Card className="space-y-3 border-accent/40 bg-accent/10 p-8 text-center">
          <p className="flex items-center justify-center gap-2 font-display text-xl font-semibold">
            <Icon name="crown" className="size-5 text-accent" />
            {t(locale, 'content.lockedHeading', { tier: tierLabel(locale, item.tier) })}
          </p>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            {item.tier && item.tier !== 'premium'
              ? t(locale, 'content.lockedMsgTier', { tier: tierLabel(locale, item.tier) })
              : t(locale, 'content.lockedMsgPremium')}
          </p>
          <a
            href={localizedPath(locale, '/upgrade')}
            className={cn(buttonVariants({ size: 'lg' }), 'mx-auto')}
          >
            {t(locale, 'content.upgradeCta')}
          </a>
        </Card>
      ) : (
        <>
          {pdf ? (
            <section className="space-y-2">
              <h2 className="font-display text-lg font-semibold">{t(locale, 'content.score')}</h2>
              <iframe
                title={pdf.filename}
                src={pdf.url}
                className="h-[600px] w-full rounded-lg border border-border bg-card"
              />
              <a
                href={pdf.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                <Icon name="external-link" className="size-4" />
                {t(locale, 'content.openPdf')}
              </a>
            </section>
          ) : null}

          {audio ? (
            <section className="space-y-2">
              <h2 className="font-display text-lg font-semibold">
                {t(locale, 'content.recording')}
              </h2>
              {/* biome-ignore lint/a11y/useMediaCaption: public-domain recordings have no captions. */}
              <audio controls src={audio.url} className="w-full" />
            </section>
          ) : null}
        </>
      )}

      {item.attribution || item.license || item.source ? (
        <Card className="space-y-1.5 p-5 text-sm">
          <p className="font-display font-semibold text-foreground">
            {t(locale, 'content.creditsTitle')}
          </p>
          <div className="space-y-1 text-muted-foreground">
            {item.attribution ? (
              <p>
                {t(locale, 'content.attribution')} {item.attribution}
              </p>
            ) : null}
            {item.source ? (
              <p>
                {t(locale, 'content.source')} {item.source}
              </p>
            ) : null}
            {item.license ? (
              <p>
                {t(locale, 'content.license')} {item.license}
              </p>
            ) : null}
          </div>
        </Card>
      ) : null}

      <RelatedSection slug={slug} locale={locale} />
    </article>
  );
}

export default function ContentDetail({ slug, locale }: { slug: string; locale: Locale }) {
  return (
    <ApiProvider>
      <Detail slug={slug} locale={locale} />
    </ApiProvider>
  );
}
