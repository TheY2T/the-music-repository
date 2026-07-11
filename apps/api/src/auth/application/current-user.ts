import type { AuthenticatedUser } from '../domain/authenticated-user';

/**
 * Domain capability: "who is making the current request." Use-cases depend on this port to read the
 * acting user's identity/roles; they never import Better Auth. Bound to `BetterAuthCurrentUser`
 * (request-scoped) in `AuthModule`. Named for the capability, no `Port` suffix (ADR 0012).
 */
export abstract class CurrentUser {
  /** The acting user, or `null` when the request is anonymous. */
  abstract optional(): AuthenticatedUser | null;

  /** The acting user; throws {@link AuthenticationRequiredError} for anonymous requests. */
  abstract require(): AuthenticatedUser;
}
