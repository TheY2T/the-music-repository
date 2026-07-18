import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import { Card, Icon, type IconName } from '@TheY2T/tmr-ui';

interface Tile {
  href: string;
  icon: IconName;
  title: string;
  description: string;
}

/**
 * Landing grid for the Localization section (ADR 0034): navigation cards for the general-site interface
 * strings and the per-area content localization (catalogue / collections / help). Presentational + static
 * (no client directive) — Astro renders it server-side. Mirrors `AdminNav`'s card design for consistency.
 */
export default function LocalizationHub({ locale }: { locale: Locale }) {
  const tiles: Tile[] = [
    {
      href: localizedPath(locale, '/admin/localization/general'),
      icon: 'globe',
      title: t(locale, 'loc.general'),
      description: t(locale, 'loc.generalDesc'),
    },
    {
      href: localizedPath(locale, '/admin/localization/catalogue'),
      icon: 'library',
      title: t(locale, 'loc.catalogue'),
      description: t(locale, 'loc.catalogueDesc'),
    },
    {
      href: localizedPath(locale, '/admin/localization/collections'),
      icon: 'list-music',
      title: t(locale, 'loc.collections'),
      description: t(locale, 'loc.collectionsDesc'),
    },
    {
      href: localizedPath(locale, '/admin/localization/help'),
      icon: 'info',
      title: t(locale, 'loc.help'),
      description: t(locale, 'loc.helpDesc'),
    },
  ];

  return (
    <nav className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((tile) => (
        <a key={tile.href} href={tile.href} className="group rounded-lg focus-visible:outline-none">
          <Card className="flex h-full items-start gap-4 p-5 transition-colors hover:border-accent hover:bg-accent/5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
              <Icon name={tile.icon} className="size-5" />
            </span>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <h2 className="font-display font-semibold tracking-tight">{tile.title}</h2>
                <Icon
                  name="chevron-right"
                  className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                />
              </div>
              <p className="text-sm text-muted-foreground">{tile.description}</p>
            </div>
          </Card>
        </a>
      ))}
    </nav>
  );
}
