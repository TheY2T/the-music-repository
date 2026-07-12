import {
  ApiProvider,
  type ContentDetail as ContentDetailDto,
  type ContentSummary,
  useGetContentBySlug,
  useGetRelatedContent,
} from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, type MessageKey, t } from '@TheY2T/tmr-i18n';

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
    <section className="space-y-3 border-t border-border pt-6">
      <h2 className="font-semibold">{t(locale, 'content.related')}</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.slug}>
            <a
              href={localizedPath(locale, `/catalogue/${item.slug}`)}
              className="flex h-full flex-col gap-1 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
            >
              <span className="font-mono text-xs text-muted-foreground">{item.type}</span>
              <span className="font-medium leading-snug">{item.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Detail({ slug, locale }: { slug: string; locale: Locale }) {
  const { data, isLoading } = useGetContentBySlug(slug);
  // customFetch returns non-2xx as data (not a throw), so narrow on the 200 status.
  const item = data?.status === 200 ? (data.data as ContentDetailDto) : undefined;

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t(locale, 'common.loading')}</p>;
  }
  if (!item) {
    return <p className="text-sm text-red-500">{t(locale, 'content.notFound')}</p>;
  }

  const pdf = item.media.find((asset) => asset.kind === 'score_pdf');
  const audio = item.media.find((asset) => asset.kind === 'audio');

  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{item.type}</span>
          {item.difficulty ? (
            <span className="text-xs text-muted-foreground">
              {t(locale, 'catalogue.grade', { level: item.difficulty })}
            </span>
          ) : null}
        </div>
        <h1 className="text-3xl font-bold">{item.title}</h1>
        {item.summary ? <p className="text-muted-foreground">{item.summary}</p> : null}
        <div className="flex flex-wrap gap-1">
          {[...item.genres, ...item.instruments].map((ref) => (
            <span key={ref.slug} className="rounded-full border border-border px-2 py-0.5 text-xs">
              {ref.name}
            </span>
          ))}
          {/* Topic chips opt into the Info View — hover/focus shows the help topic. */}
          {item.topics.map((ref) => (
            <span
              key={ref.slug}
              data-help={ref.slug}
              className="rounded-full border border-border px-2 py-0.5 text-xs"
            >
              {ref.name}
            </span>
          ))}
        </div>
      </header>

      {item.locked ? (
        <section className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-6 text-center">
          <p className="text-lg font-semibold">
            🔒 {t(locale, 'content.lockedHeading', { tier: tierLabel(locale, item.tier) })}
          </p>
          <p className="text-sm text-muted-foreground">
            {item.tier && item.tier !== 'premium'
              ? t(locale, 'content.lockedMsgTier', { tier: tierLabel(locale, item.tier) })
              : t(locale, 'content.lockedMsgPremium')}
          </p>
          <a
            href={localizedPath(locale, '/upgrade')}
            className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            {t(locale, 'content.upgradeCta')}
          </a>
        </section>
      ) : (
        <>
          {pdf ? (
            <section className="space-y-2">
              <h2 className="font-semibold">{t(locale, 'content.score')}</h2>
              <iframe
                title={pdf.filename}
                src={pdf.url}
                className="h-[600px] w-full rounded-lg border border-border"
              />
              <a href={pdf.url} target="_blank" rel="noreferrer" className="text-sm underline">
                {t(locale, 'content.openPdf')}
              </a>
            </section>
          ) : null}

          {audio ? (
            <section className="space-y-2">
              <h2 className="font-semibold">{t(locale, 'content.recording')}</h2>
              {/* biome-ignore lint/a11y/useMediaCaption: public-domain recordings have no captions. */}
              <audio controls src={audio.url} className="w-full" />
            </section>
          ) : null}
        </>
      )}

      {item.attribution || item.license || item.source ? (
        <footer className="space-y-1 rounded-lg border border-border p-4 text-sm text-muted-foreground">
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
        </footer>
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
