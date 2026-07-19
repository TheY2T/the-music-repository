import { type Locale, t } from '@TheY2T/tmr-i18n';
import { buttonVariants, Card, cn, Icon } from '@TheY2T/tmr-ui';

export interface SupportPanelProps {
  locale: Locale;
  /** The operator's Ko-fi handle. When absent the panel invites visitors to check back soon. */
  kofiUsername?: string;
}

/**
 * The Ko-fi support surface: a short thank-you, a link to the operator's Ko-fi page, and the embedded
 * Ko-fi tip panel. Ko-fi renders the panel inside its own iframe, so it keeps Ko-fi's styling rather
 * than the site theme (a third-party widget, like embedded media).
 */
export default function SupportPanel({ locale, kofiUsername }: SupportPanelProps) {
  const handle = kofiUsername?.trim();
  const kofi = handle
    ? {
        profileUrl: `https://ko-fi.com/${handle}`,
        embedUrl: `https://ko-fi.com/${handle}/?hidefeed=true&widget=true&embed=true`,
      }
    : null;

  return (
    <div className="space-y-6">
      <Card className="flex items-start gap-3 p-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
          <Icon name="coffee" className="size-5" />
        </span>
        <div className="min-w-0 space-y-2">
          <p className="text-sm text-muted-foreground">{t(locale, 'support.intro')}</p>
          <p className="text-sm text-muted-foreground">{t(locale, 'support.thanks')}</p>
        </div>
      </Card>

      {kofi ? (
        <>
          <a
            href={kofi.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: 'default' }), 'w-full sm:w-auto')}
          >
            <Icon name="coffee" className="size-4" />
            {t(locale, 'support.cta')}
          </a>
          <Card className="overflow-hidden p-0">
            <iframe
              src={kofi.embedUrl}
              title={t(locale, 'support.cta')}
              loading="lazy"
              className="block h-[712px] w-full border-0 bg-transparent"
            />
          </Card>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{t(locale, 'support.comingSoon')}</p>
      )}
    </div>
  );
}
