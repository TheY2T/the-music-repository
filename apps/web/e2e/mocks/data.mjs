// Shared mock definitions for the E2E backend — imported by BOTH the MSW SSR layer
// (e2e/msw/*.mjs, intercepting fetches the Astro node server makes) and the Playwright browser
// route layer (e2e/mocks/browser-routes.ts, intercepting island fetches). One source of truth so
// SSR + browser see identical data. See docs/features/testing.md.
import { fileURLToPath } from 'node:url';

/** Every mockable backend service. `TMR_E2E_MOCK_SERVICES` selects a subset (or "all"). */
export const SERVICE_NAMES = ['auth', 'catalogue'];

/** Roles that get a reusable signed-in storageState (mirrors the local Better Auth dev users). */
export const ROLES = ['admin', 'editor', 'learner'];

export const MOCK_USERS = {
  admin: { id: 'u-admin', email: 'admin@local.dev', name: 'Admin', role: 'admin' },
  editor: { id: 'u-editor', email: 'editor@local.dev', name: 'Editor', role: 'editor' },
  learner: { id: 'u-learner', email: 'learner@local.dev', name: 'Learner', role: 'learner' },
};

export const MOCK_CATALOGUE = {
  items: [
    {
      slug: 'mock-song',
      title: 'Mock Song',
      type: 'song',
      visibility: 'public',
      genres: [],
      instruments: [],
      topics: [],
    },
  ],
  facets: { genres: [], instruments: [], topics: [], types: [], difficulties: [] },
  total: 1,
  page: 1,
  pageSize: 20,
};

/** Full detail view for the `mock-song` slug — feeds the SSR page-metadata fetch (title/description/
 * OG/JSON-LD) exercised by the SEO spec. */
export const MOCK_CONTENT_DETAIL = {
  slug: 'mock-song',
  title: 'Mock Song',
  summary: 'A mock song used to exercise catalogue detail metadata.',
  type: 'song',
  visibility: 'public',
  genres: [],
  instruments: [],
  topics: [],
  tags: [],
  media: [],
  id: 'c-mock',
  details: { composer: 'Test Composer', key: 'C major' },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-07-19T00:00:00.000Z',
};

/** Absolute path to a role's saved storageState (auth.setup.ts writes it; specs read it). */
export function authFile(role) {
  return fileURLToPath(new URL(`../.auth/${role}.json`, import.meta.url));
}

/** Services to mock, from `TMR_E2E_MOCK_SERVICES` ("all" | comma list). Unlisted → pass through. */
export function selectedServices() {
  const raw = (process.env.TMR_E2E_MOCK_SERVICES ?? 'all').trim();
  if (raw === '' || raw === 'all') {
    return [...SERVICE_NAMES];
  }
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => SERVICE_NAMES.includes(s));
}

/** Map a request `Cookie` header to the Better Auth `get-session` response shape. */
export function sessionResponseFromCookieHeader(cookieHeader) {
  const match = (cookieHeader ?? '').match(/better-auth[^=]*=mock-(\w+)/);
  const role = match?.[1];
  return role && MOCK_USERS[role] ? { user: MOCK_USERS[role] } : {};
}
