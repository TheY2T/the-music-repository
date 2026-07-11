import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard, type PermissionCheck, UserHasPermission } from '@thallesp/nestjs-better-auth';

/**
 * Route protection helpers. The global auth guard is disabled (public catalogue stays anonymous), so
 * protected routes opt in explicitly. These wrap the Better Auth `AuthGuard` so the rest of the app
 * depends on our local, domain-shaped decorators rather than the library surface directly.
 */

/** Require an authenticated session (any role). Anonymous → 401. */
export function RequireAuth(): ReturnType<typeof applyDecorators> {
  return applyDecorators(UseGuards(AuthGuard));
}

/**
 * Require the acting user to hold every listed permission (resource → actions), checked against the
 * admin-plugin access-control roles. Anonymous → 401; authenticated-but-lacking → 403.
 *
 * @example RequirePermissions({ content: ['publish'] })
 */
export function RequirePermissions(
  permission: PermissionCheck,
): ReturnType<typeof applyDecorators> {
  return applyDecorators(UseGuards(AuthGuard), UserHasPermission({ permission }));
}
