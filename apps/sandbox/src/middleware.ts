import { DEFAULT_LOCALE, readLocaleCookie, splitLocalePath } from '@TheY2T/tmr-i18n';
import type { Flags } from '@TheY2T/tmr-web-acl';
import { FLAG_FIELD_BY_KEY } from '@TheY2T/tmr-web-acl/flags';
import { defineMiddleware } from 'astro:middleware';

// Every flag forced on so the sandbox can reach every flag-gated component. Built by iterating the typed
// field map, so it stays exhaustive as flags are added.
const ALL_FLAGS_ON = Object.fromEntries(
  Object.values(FLAG_FIELD_BY_KEY).map((field) => [field, true]),
) as Flags;

/**
 * Seeds the dev-only `Astro.locals` the shared UI packages expect. Unlike the web app there is no API
 * call: the sandbox renders components in isolation, so it resolves the locale from the URL/cookie,
 * treats the visitor as anonymous, and turns every flag on. UI strings resolve from the i18n engine's
 * bundled fallback, so the serialized catalogue can stay empty.
 */
export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = new URL(context.request.url);
  const cookieLocale = readLocaleCookie(context.request.headers.get('cookie'));
  const { locale } = splitLocalePath(pathname);

  context.locals.locale = locale !== DEFAULT_LOCALE ? locale : (cookieLocale ?? DEFAULT_LOCALE);
  context.locals.user = null;
  context.locals.flags = ALL_FLAGS_ON;
  context.locals.flagSnapshot = {};
  context.locals.i18nCatalogue = {
    version: '0',
    locale: context.locals.locale,
    messages: {},
  };

  return next();
});
