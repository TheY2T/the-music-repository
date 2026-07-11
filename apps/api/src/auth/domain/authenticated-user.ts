/**
 * The acting user as the core sees it — a framework-free POJO. The domain never imports Better Auth;
 * the presentation edge maps a Better Auth session into this shape (see `BetterAuthCurrentUser`).
 */
export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  /** Role slugs from the admin plugin (e.g. `['admin']`). Empty for the default learner. */
  readonly roles: readonly string[];
}
