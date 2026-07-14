import { ApiProvider, useSearchCatalogue, useSearchCollections } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, type MessageKey, t } from '@TheY2T/tmr-i18n';
import {
  Badge,
  buttonVariants,
  Card,
  CardContent,
  CoverArt,
  cn,
  FeaturedShelf,
  Hero,
  Icon,
  type IconName,
  MediaCard,
  Skeleton,
} from '@TheY2T/tmr-ui';
import AmbientBackground from '@/components/AmbientBackground';

/**
 * Homepage content (Phase D) — a single island root composing the Phase-B molecules (Hero,
 * FeaturedShelf, MediaCard, CoverArt) over live catalogue data via react-query, with graceful
 * fallbacks so the page still reads well when the API is unreachable or the catalogue is empty.
 * i18n-by-prop: an app island, so it calls `t(locale, key)` directly.
 */
export interface HomePageProps {
  locale: Locale;
  catalogueHref: string;
  toolsHref: string;
  collectionsHref: string;
  upgradeHref: string;
  showTools: boolean;
  showCollections: boolean;
  showUpgrade: boolean;
}

const POPULAR_TOOLS: { slug: string; icon: IconName; titleKey: MessageKey }[] = [
  { slug: 'metronome', icon: 'clock', titleKey: 'tool.metronome.title' },
  { slug: 'tuner', icon: 'volume', titleKey: 'tool.tuner.title' },
  { slug: 'circle-of-fifths', icon: 'disc', titleKey: 'tool.circle-of-fifths.title' },
  { slug: 'keyboard', icon: 'piano', titleKey: 'tool.keyboard.title' },
  { slug: 'fretboard', icon: 'guitar', titleKey: 'tool.fretboard.title' },
  { slug: 'ear-trainer', icon: 'headphones', titleKey: 'tool.ear-trainer.title' },
];

// The four covers in the hero collage link to their real catalogue items (slugs from the seed).
const HERO_PICKS = [
  {
    slug: 'bach-prelude-c-major-bwv-846',
    title: 'Prelude in C',
    subtitle: 'J. S. Bach',
    motif: 'staff',
  },
  {
    slug: 'joplin-the-entertainer',
    title: 'The Entertainer',
    subtitle: 'S. Joplin',
    motif: 'keys',
  },
  { slug: 'greensleeves-trad', title: 'Greensleeves', subtitle: 'Traditional', motif: 'strings' },
  { slug: '12-bar-blues-in-a', title: '12-Bar Blues', subtitle: 'Study', motif: 'record' },
] as const;

function tierLabel(locale: Locale, tier?: string): string {
  const key: MessageKey =
    tier === 'pro' ? 'tier.pro' : tier === 'institution' ? 'tier.institution' : 'tier.premium';
  return t(locale, key);
}

function FeaturedRow({ locale }: { locale: Locale }) {
  const { data, isFetching } = useSearchCatalogue({ pageSize: 10 });
  const items = data?.data?.items ?? [];

  if (isFetching && items.length === 0) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton placeholders.
          <div key={i} className="w-64 shrink-0 space-y-3">
            <Skeleton className="aspect-[4/3] w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{t(locale, 'home.featuredEmpty')}</p>;
  }

  return (
    <FeaturedShelf title={t(locale, 'home.featuredTitle')}>
      {items.map((item) => (
        <MediaCard
          key={item.slug}
          className="w-64"
          title={item.title}
          href={localizedPath(locale, `/catalogue/${item.slug}`)}
          summary={item.summary ?? undefined}
          typeLabel={item.type}
          difficultyLabel={
            item.difficulty ? t(locale, 'catalogue.grade', { level: item.difficulty }) : undefined
          }
          seed={item.slug}
          tags={[...item.genres, ...item.instruments].map((r) => r.name)}
          badgeSlot={
            item.locked ? (
              <Badge variant="warning">
                <Icon name="lock" className="size-3" />
                {tierLabel(locale, item.tier)}
              </Badge>
            ) : undefined
          }
        />
      ))}
    </FeaturedShelf>
  );
}

function CollectionsRow({ locale, href }: { locale: Locale; href: string }) {
  const { data } = useSearchCollections({ featured: true, sort: 'featured', pageSize: 8 });
  const items = data?.data?.items ?? [];
  if (items.length === 0) {
    return null;
  }
  return (
    <FeaturedShelf
      title={t(locale, 'home.collectionsShelfTitle')}
      action={
        <a href={href} className="text-sm text-accent underline-offset-4 hover:underline">
          {t(locale, 'home.browseCta')}
        </a>
      }
    >
      {items.map((c) => (
        <MediaCard
          key={c.slug}
          className="w-64"
          title={c.title}
          href={localizedPath(locale, `/collections/${c.slug}`)}
          summary={c.summary ?? undefined}
          typeLabel={c.kind}
          difficultyLabel={`${c.itemCount} ${t(locale, c.itemCount === 1 ? 'collections.itemOne' : 'collections.itemOther')}`}
          seed={c.slug}
        />
      ))}
    </FeaturedShelf>
  );
}

function WayCard({
  icon,
  title,
  desc,
  href,
}: {
  icon: IconName;
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <a href={href} className="group">
      <Card className="h-full transition-colors group-hover:border-accent">
        <CardContent className="flex flex-col gap-3 p-6">
          <span className="flex size-10 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Icon name={icon} className="size-5" />
          </span>
          <h3 className="font-display text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </CardContent>
      </Card>
    </a>
  );
}

function Home({
  locale,
  catalogueHref,
  toolsHref,
  collectionsHref,
  upgradeHref,
  showTools,
  showCollections,
  showUpgrade,
}: HomePageProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      {/* Hero with an ambient WebGL drift behind it (decorative; degrades to nothing). */}
      <div className="relative overflow-hidden rounded-lg">
        <AmbientBackground className="pointer-events-none absolute inset-0" />
        <Hero
          className="relative"
          eyebrow={t(locale, 'home.heroEyebrow')}
          title={t(locale, 'home.heroTitle')}
          subtitle={t(locale, 'home.heroSubtitle')}
          actions={
            <>
              <a href={catalogueHref} className={cn(buttonVariants({ size: 'lg' }))}>
                <Icon name="library" className="size-4" />
                {t(locale, 'home.browseCta')}
              </a>
              {showTools && (
                <a
                  href={toolsHref}
                  className={cn(buttonVariants({ size: 'lg', variant: 'outline' }))}
                >
                  <Icon name="wrench" className="size-4" />
                  {t(locale, 'home.toolsCta')}
                </a>
              )}
            </>
          }
          media={
            <div className="grid grid-cols-2 gap-4">
              {HERO_PICKS.map((pick, i) => (
                <a
                  key={pick.slug}
                  href={localizedPath(locale, `/catalogue/${pick.slug}`)}
                  className={cn(
                    'block rounded-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    i % 2 === 1 && 'mt-6',
                  )}
                >
                  <CoverArt
                    seed={pick.slug}
                    title={pick.title}
                    subtitle={pick.subtitle}
                    motif={pick.motif}
                  />
                </a>
              ))}
            </div>
          }
        />
      </div>

      <section className="mt-16">
        <FeaturedRow locale={locale} />
      </section>

      {showCollections && (
        <section className="mt-16">
          <CollectionsRow locale={locale} href={collectionsHref} />
        </section>
      )}

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          {t(locale, 'home.waysTitle')}
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <WayCard
            icon="library"
            title={t(locale, 'home.wayCatalogueTitle')}
            desc={t(locale, 'home.wayCatalogueDesc')}
            href={catalogueHref}
          />
          {showTools && (
            <WayCard
              icon="wrench"
              title={t(locale, 'home.wayToolsTitle')}
              desc={t(locale, 'home.wayToolsDesc')}
              href={toolsHref}
            />
          )}
          {showCollections && (
            <WayCard
              icon="list-music"
              title={t(locale, 'home.wayCollectionsTitle')}
              desc={t(locale, 'home.wayCollectionsDesc')}
              href={collectionsHref}
            />
          )}
        </div>
      </section>

      {showTools && (
        <section className="mt-16">
          <FeaturedShelf title={t(locale, 'home.toolsShelfTitle')}>
            {POPULAR_TOOLS.map((tool) => (
              <a
                key={tool.slug}
                href={localizedPath(locale, `/tools/${tool.slug}`)}
                className="group w-44"
              >
                <Card className="h-full transition-colors group-hover:border-accent">
                  <CardContent className="flex flex-col items-start gap-3 p-5">
                    <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                      <Icon name={tool.icon} className="size-5" />
                    </span>
                    <span className="font-display font-medium leading-tight">
                      {t(locale, tool.titleKey)}
                    </span>
                  </CardContent>
                </Card>
              </a>
            ))}
          </FeaturedShelf>
        </section>
      )}

      {showUpgrade && (
        <section className="mt-16">
          <Card className="overflow-hidden border-accent/40 bg-accent/10">
            <CardContent className="flex flex-col items-start gap-4 p-8 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Icon name="crown" className="size-6" />
                </span>
                <div>
                  <h2 className="font-display text-xl font-semibold">
                    {t(locale, 'home.premiumTitle')}
                  </h2>
                  <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                    {t(locale, 'home.premiumDesc')}
                  </p>
                </div>
              </div>
              <a href={upgradeHref} className={cn(buttonVariants({ size: 'lg' }), 'shrink-0')}>
                {t(locale, 'home.premiumCta')}
                <Icon name="arrow-right" className="size-4" />
              </a>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

export default function HomePage(props: HomePageProps) {
  return (
    <ApiProvider>
      <Home {...props} />
    </ApiProvider>
  );
}
