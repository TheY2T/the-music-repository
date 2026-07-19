import { createAccessControl } from 'better-auth/plugins/access';
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access';

/**
 * Permission-based RBAC (roles = bags of permissions). Statement = resource → actions.
 * Enforced by the Better Auth admin plugin; asserted at the edge via `@RequirePermissions`.
 */
export const statement = {
  ...defaultStatements,
  content: ['create', 'read', 'update', 'delete', 'publish'],
  media: ['create', 'read', 'delete'],
  taxonomy: ['create', 'read', 'update', 'delete'],
  // Teacher mode: only teachers (and admins) may create classrooms.
  classroom: ['create'],
  // Feature-flag admin (ADR 00XX): mutations are admin-only (flags can gate auth); editors read-only.
  featureFlags: ['create', 'read', 'update', 'delete'],
  // Feedback triage (ADR 0041): editors read + update (status/notes/publish); deletion is admin-only.
  feedback: ['read', 'update', 'delete'],
} as const;

export const ac = createAccessControl(statement);

export const roles = {
  admin: ac.newRole({
    ...adminAc.statements,
    content: ['create', 'read', 'update', 'delete', 'publish'],
    media: ['create', 'read', 'delete'],
    taxonomy: ['create', 'read', 'update', 'delete'],
    classroom: ['create'],
    featureFlags: ['create', 'read', 'update', 'delete'],
    feedback: ['read', 'update', 'delete'],
  }),
  editor: ac.newRole({
    content: ['create', 'read', 'update', 'publish'],
    media: ['create', 'read', 'delete'],
    taxonomy: ['create', 'read', 'update'],
    featureFlags: ['read'],
    feedback: ['read', 'update'],
  }),
  teacher: ac.newRole({
    content: ['read'],
    media: ['read'],
    taxonomy: ['read'],
    classroom: ['create'],
  }),
  learner: ac.newRole({
    content: ['read'],
    media: ['read'],
    taxonomy: ['read'],
  }),
} as const;

export type AppRole = keyof typeof roles;
