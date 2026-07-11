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
} as const;

export const ac = createAccessControl(statement);

export const roles = {
  admin: ac.newRole({
    ...adminAc.statements,
    content: ['create', 'read', 'update', 'delete', 'publish'],
    media: ['create', 'read', 'delete'],
    taxonomy: ['create', 'read', 'update', 'delete'],
  }),
  editor: ac.newRole({
    content: ['create', 'read', 'update', 'publish'],
    media: ['create', 'read', 'delete'],
    taxonomy: ['create', 'read', 'update'],
  }),
  learner: ac.newRole({
    content: ['read'],
    media: ['read'],
    taxonomy: ['read'],
  }),
} as const;

export type AppRole = keyof typeof roles;
