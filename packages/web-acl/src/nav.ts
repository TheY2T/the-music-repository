import { type Locale, localizedPath, type MessageKey, splitLocalePath, t } from '@TheY2T/tmr-i18n';
import type { IconName } from '@TheY2T/tmr-ui';
import type { Flags, User } from './types';

/**
 * Global navigation model, derived once per request from `Astro.locals` and passed into the
 * SiteHeader / mobile drawer / SiteFooter. Centralises the flag + auth gating so every surface
 * shows a consistent nav. Labels are resolved here
 * (i18n) so the header island stays a thin renderer.
 */
export interface NavItem {
  key: string;
  href: string;
  label: string;
  iconName: IconName;
  /** True when the current path is at or under this item's route. */
  active: boolean;
}

interface NavContext {
  flags: Flags;
  user: User;
  locale: Locale;
  /** Current pathname (locale prefix stripped is handled internally). */
  path: string;
}

/** Do any of the ~48 `tools.*` flags resolve on? Mirrors the homepage's `showTools`. */
function anyToolEnabled(flags: Flags): boolean {
  return Object.entries(flags).some(
    ([k, v]) => k.startsWith('tool') && k !== 'toolPractice' && v === true,
  );
}

function makeItem(
  ctx: NavContext,
  key: string,
  route: string,
  labelKey: MessageKey,
  iconName: IconName,
): NavItem {
  const { path } = splitLocalePath(ctx.path);
  const active = route === '/' ? path === '/' : path === route || path.startsWith(`${route}/`);
  return {
    key,
    href: localizedPath(ctx.locale, route),
    label: t(ctx.locale, labelKey),
    iconName,
    active,
  };
}

/** Primary (top-level) navigation — public browse surfaces + signed-in learning surfaces. */
export function buildPrimaryNav(ctx: NavContext): NavItem[] {
  const { flags, user } = ctx;
  const items: NavItem[] = [];
  if (flags.learnerDashboard && user)
    items.push(makeItem(ctx, 'dashboard', '/dashboard', 'nav.dashboard', 'layout-grid'));
  items.push(makeItem(ctx, 'catalogue', '/catalogue', 'nav.catalogue', 'library'));
  if (flags.collections)
    items.push(makeItem(ctx, 'collections', '/collections', 'nav.collections', 'list-music'));
  if (anyToolEnabled(flags)) items.push(makeItem(ctx, 'tools', '/tools', 'nav.tools', 'wrench'));
  if (flags.trainers && user) items.push(makeItem(ctx, 'drills', '/drills', 'nav.drills', 'gauge'));
  if (flags.support) items.push(makeItem(ctx, 'support', '/support', 'nav.support', 'coffee'));
  return items;
}

/**
 * Account-menu items (dropdown / drawer). When signed out and auth is enabled, the sole item is
 * "Sign in". When signed in, the personalised surfaces the user's flags/role unlock. Sign-out is
 * handled separately (it is an action, not a link) by the header.
 */
export function buildAccountNav(ctx: NavContext): NavItem[] {
  const { flags, user } = ctx;
  if (!flags.authEnabled) return [];
  if (!user) return [makeItem(ctx, 'signin', '/signin', 'nav.signIn', 'log-in')];

  const items: NavItem[] = [];
  if (flags.progress)
    items.push(makeItem(ctx, 'progress', '/me/progress', 'nav.myProgress', 'chart'));
  if (flags.favorites)
    items.push(makeItem(ctx, 'favorites', '/me/favorites', 'nav.myFavorites', 'heart'));
  if (flags.collectionBookmarks || flags.userCollections)
    items.push(makeItem(ctx, 'my-collections', '/me/collections', 'nav.myCollections', 'bookmark'));
  // The store link appears only when the premium engine is on AND monetization messaging is allowed,
  // so it never dangles (the /upgrade page needs `premium`) and stays hidden while monetization is deferred.
  if (flags.premium && flags.monetizationMessaging)
    items.push(makeItem(ctx, 'upgrade', '/upgrade', 'nav.premium', 'crown'));
  if (flags.classrooms)
    items.push(makeItem(ctx, 'classrooms', '/classrooms', 'nav.classrooms', 'graduation-cap'));
  if (flags.dashboardBackground)
    items.push(makeItem(ctx, 'settings', '/settings', 'nav.settings', 'sliders'));
  if (flags.adminCms && (user.role === 'admin' || user.role === 'editor')) {
    items.push(makeItem(ctx, 'admin', '/admin', 'nav.admin', 'settings'));
  }
  return items;
}

/**
 * Legal / company footer links — the business-identity and policy pages. The policy links are always
 * present (no gating): a privacy policy and terms must be reachable from every page. The Ko-fi support
 * link joins them when the `support.kofi` flag is on.
 */
export function buildLegalNav(ctx: NavContext): NavItem[] {
  const items = [
    makeItem(ctx, 'about', '/about', 'nav.about', 'building'),
    makeItem(ctx, 'privacy', '/privacy', 'nav.privacy', 'shield'),
    makeItem(ctx, 'terms', '/terms', 'nav.terms', 'file-text'),
    makeItem(ctx, 'cookies', '/cookies', 'nav.cookies', 'cookie'),
  ];
  if (ctx.flags.faq) items.push(makeItem(ctx, 'faq', '/faq', 'nav.faq', 'help-circle'));
  if (ctx.flags.feedbackForm)
    items.push(makeItem(ctx, 'feedback', '/feedback', 'nav.feedback', 'message-square'));
  if (ctx.flags.feedbackBoard)
    items.push(makeItem(ctx, 'roadmap', '/roadmap', 'board.title', 'list-ordered'));
  if (ctx.flags.support) items.push(makeItem(ctx, 'support', '/support', 'nav.support', 'coffee'));
  return items;
}

export function isSignedIn(ctx: Pick<NavContext, 'user'>): boolean {
  return !!ctx.user;
}
