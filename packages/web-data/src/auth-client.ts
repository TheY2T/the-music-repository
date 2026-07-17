import { createAuthClient } from 'better-auth/client';
import { adminClient } from 'better-auth/client/plugins';

const API_BASE = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

/**
 * Browser-side Better Auth client. The API owns auth at `${API_BASE}/api/auth/*`; the web app is a
 * different origin in dev (:4321 vs :3000), so the session cookie must ride along on every request —
 * hence `credentials: 'include'`. The admin-plugin client mirrors the server's RBAC types.
 */
export const authClient = createAuthClient({
  baseURL: API_BASE,
  fetchOptions: { credentials: 'include' },
  plugins: [adminClient()],
});

export const { signIn, signOut, useSession } = authClient;
