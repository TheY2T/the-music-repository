import SiteHeader from '@TheY2T/tmr-common-ui/SiteHeader';
import { type Locale, t } from '@TheY2T/tmr-i18n';
import type { NavItem } from '@TheY2T/tmr-web-acl/nav';

// The site chrome needs a resolved nav model + user; in the real app the middleware builds these. Here
// we hand it a small illustrative nav so testers can see the header exactly as it renders in production.
const primaryNav: NavItem[] = [
  { key: 'catalogue', href: '#', label: 'Catalogue', iconName: 'music', active: true },
  { key: 'tools', href: '#', label: 'Tools', iconName: 'guitar', active: false },
  { key: 'collections', href: '#', label: 'Collections', iconName: 'bookmark', active: false },
];

const accountNav: NavItem[] = [
  { key: 'dashboard', href: '#', label: 'Dashboard', iconName: 'chart', active: false },
  { key: 'signin', href: '#', label: 'Sign in', iconName: 'user', active: false },
];

export function SiteHeaderExample({ locale }: { locale: Locale }) {
  return (
    <SiteHeader
      locale={locale}
      siteName={t(locale, 'site.name')}
      primaryNav={primaryNav}
      accountNav={accountNav}
      user={null}
      i18nEnabled
      infoView
      homeHref="#"
    />
  );
}
