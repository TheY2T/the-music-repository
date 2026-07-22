import { type Locale, t } from '@TheY2T/tmr-i18n';
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Icon,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@TheY2T/tmr-ui';
import type { User } from '@TheY2T/tmr-web-acl';
import { authClient } from '@TheY2T/tmr-web-acl/auth-client';
import type { NavItem } from '@TheY2T/tmr-web-acl/nav';
import { useState } from 'react';
import SettingsMenu from './SettingsMenu';

/**
 * Global site header — a single island root (React context for the account dropdown + mobile Sheet
 * can't cross islands, so the SettingsMenu is composed here as a child rather than as a separate
 * island). Presentational data (nav items, user) is computed per request in BaseLayout from
 * `Astro.locals` and passed in. This is an app island, so it may call `t()`.
 */
export interface SiteHeaderProps {
  locale: Locale;
  siteName: string;
  primaryNav: NavItem[];
  accountNav: NavItem[];
  user: User;
  i18nEnabled: boolean;
  /** Show the Info View toggle (contextual-help panel is enabled). */
  infoView?: boolean;
  homeHref: string;
}

function initials(user: NonNullable<User>): string {
  const source = user.name?.trim() || user.email;
  return source.slice(0, 2).toUpperCase();
}

async function signOut() {
  await authClient.signOut();
  window.location.reload();
}

export default function SiteHeader({
  locale,
  siteName,
  primaryNav,
  accountNav,
  user,
  i18nEnabled,
  infoView,
  homeHref,
}: SiteHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navLink = (item: NavItem, block = false) => (
    <a
      key={item.key}
      href={item.href}
      aria-current={item.active ? 'page' : undefined}
      onClick={() => setDrawerOpen(false)}
      className={cn(
        'inline-flex items-center gap-2 text-sm font-medium transition-colors',
        block ? 'w-full rounded-md px-2 py-2 hover:bg-muted' : 'py-1',
        item.active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        !block && item.active && 'border-b-2 border-accent',
      )}
    >
      <Icon name={item.iconName} className="size-4" />
      {item.label}
    </a>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        {/* Wordmark */}
        <a href={homeHref} className="flex items-center gap-2 shrink-0">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Icon name="music" className="size-4" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-foreground">
            {siteName}
          </span>
        </a>

        {/* Desktop primary nav */}
        <nav
          className="ml-4 hidden items-center gap-5 md:flex"
          aria-label={t(locale, 'nav.browse')}
        >
          {primaryNav.map((item) => navLink(item))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {infoView && (
            <button
              type="button"
              aria-label={t(locale, 'nav.infoView')}
              title={t(locale, 'nav.infoView')}
              onClick={() => window.dispatchEvent(new CustomEvent('tmr:toggle-infoview'))}
              className="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon name="info" className="size-4" />
            </button>
          )}

          <SettingsMenu locale={locale} i18nEnabled={i18nEnabled} />

          {/* Account menu (desktop) */}
          <div className="hidden md:block">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={t(locale, 'nav.account')}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-border text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-expanded:bg-muted aria-expanded:text-foreground"
                >
                  {initials(user)}
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>{user.name || user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {accountNav.map((item) => (
                    <DropdownMenuItem
                      key={item.key}
                      onSelect={() => {
                        window.location.href = item.href;
                      }}
                    >
                      <Icon name={item.iconName} className="size-4" />
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={signOut}>
                    <Icon name="log-out" className="size-4" />
                    {t(locale, 'common.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              accountNav[0] && (
                <a
                  href={accountNav[0].href}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Icon name="log-in" className="size-4" />
                  {accountNav[0].label}
                </a>
              )
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            aria-label={t(locale, 'nav.menu')}
            onClick={() => setDrawerOpen(true)}
            className="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          >
            <Icon name="menu" className="size-4" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="flex flex-col gap-4">
          <SheetHeader>
            <SheetTitle className="font-display">{siteName}</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1" aria-label={t(locale, 'nav.browse')}>
            {primaryNav.map((item) => navLink(item, true))}
          </nav>
          {accountNav.length > 0 && (
            <>
              <div className="h-px bg-border" />
              <nav className="flex flex-col gap-1" aria-label={t(locale, 'nav.account')}>
                {accountNav.map((item) => navLink(item, true))}
                {user && (
                  <button
                    type="button"
                    onClick={signOut}
                    className="inline-flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Icon name="log-out" className="size-4" />
                    {t(locale, 'common.signOut')}
                  </button>
                )}
              </nav>
            </>
          )}
        </SheetContent>
      </Sheet>
    </header>
  );
}
