import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { CurrentUser } from '../application/current-user';
import type { AuthenticatedUser } from '../domain/authenticated-user';
import { AuthenticationRequiredError } from '../domain/errors/authentication-required.error';

/** Shape the Better Auth guard attaches to the request (`req.session` / `req.user`). */
interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string | string[] | null;
}
interface RequestWithSession {
  session?: { user?: SessionUser | null } | null;
  user?: SessionUser | null;
}

/** Admin-plugin `role` is a slug or comma-separated slugs; normalise to a clean array. */
function normalizeRoles(role: SessionUser['role']): string[] {
  if (!role) return [];
  const values = Array.isArray(role) ? role : role.split(',');
  return values.map((value) => value.trim()).filter(Boolean);
}

/**
 * Request-scoped adapter that projects the Better Auth session (attached to the request by the
 * library's `AuthGuard`) into the framework-free {@link AuthenticatedUser}. Only this infrastructure
 * adapter knows Better Auth's session shape.
 */
@Injectable({ scope: Scope.REQUEST })
export class BetterAuthCurrentUser extends CurrentUser {
  constructor(@Inject(REQUEST) private readonly request: RequestWithSession) {
    super();
  }

  optional(): AuthenticatedUser | null {
    const raw = this.request.session?.user ?? this.request.user;
    if (!raw?.id) return null;
    return {
      id: raw.id,
      email: raw.email ?? '',
      name: raw.name ?? '',
      roles: normalizeRoles(raw.role),
    };
  }

  require(): AuthenticatedUser {
    const user = this.optional();
    if (!user) throw new AuthenticationRequiredError();
    return user;
  }
}
