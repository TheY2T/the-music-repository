import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import { Card, Icon, type IconName } from '@TheY2T/tmr-ui';

interface Tile {
  href: string;
  icon: IconName;
  title: string;
  description: string;
}

/**
 * At-a-glance admin navigation tiles. Presentational + static (no client directive needed) —
 * Astro renders it server-side to plain HTML. Flag gating is decided by the page and passed in.
 */
export default function AdminNav({
  locale,
  showCollections,
  showHelp,
  showLocaleStrings,
  showFeatureFlags,
}: {
  locale: Locale;
  showCollections: boolean;
  showHelp: boolean;
  showLocaleStrings?: boolean;
  showFeatureFlags?: boolean;
}) {
  const tiles: Tile[] = [
    {
      href: '#admin-content',
      icon: 'book-open',
      title: t(locale, 'admin.content'),
      description: t(locale, 'admin.contentDesc'),
    },
  ];
  if (showCollections) {
    tiles.push({
      href: localizedPath(locale, '/admin/collections'),
      icon: 'list-music',
      title: t(locale, 'admin.collections'),
      description: t(locale, 'admin.collectionsDesc'),
    });
  }
  if (showHelp) {
    tiles.push({
      href: localizedPath(locale, '/admin/help'),
      icon: 'info',
      title: t(locale, 'admin.helpTopics'),
      description: t(locale, 'admin.helpSubtitle'),
    });
  }
  if (showLocaleStrings) {
    tiles.push({
      href: localizedPath(locale, '/admin/localization'),
      icon: 'globe',
      title: t(locale, 'admin.localization'),
      description: t(locale, 'admin.localizationDesc'),
    });
  }
  if (showFeatureFlags) {
    tiles.push({
      href: localizedPath(locale, '/admin/feature-flags'),
      icon: 'sliders',
      title: t(locale, 'admin.featureFlags'),
      description: t(locale, 'admin.featureFlagsDesc'),
    });
  }

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
