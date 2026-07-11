import type { APIContext } from 'astro';

const EDITOR_ROLES = new Set(['admin', 'editor']);

/**
 * SSR gate for `/admin/*`. Returns a redirect `Response` for anonymous, non-editor, or flag-off
 * requests; otherwise `null` (proceed). The API re-authorizes every mutation — this is UX only.
 */
export function guardAdmin(context: APIContext): Response | null {
  if (!context.locals.flags.adminCms) {
    return context.redirect('/');
  }
  const user = context.locals.user;
  if (!user) {
    return context.redirect('/signin?redirect=/admin');
  }
  if (!user.role || !EDITOR_ROLES.has(user.role)) {
    return context.redirect('/');
  }
  return null;
}
