// MSW request handlers per backend service, for the SSR layer. These intercept fetches the Astro
// node server itself makes (e.g. the middleware's Better Auth `get-session` hop). Browser-side
// island fetches are handled separately in e2e/mocks/browser-routes.ts.
import { HttpResponse, http } from 'msw';
import { MOCK_CATALOGUE, sessionResponseFromCookieHeader } from '../mocks/data.mjs';

export const serviceHandlers = {
  auth: [
    http.get('*/api/auth/get-session', ({ request }) =>
      HttpResponse.json(sessionResponseFromCookieHeader(request.headers.get('cookie'))),
    ),
  ],
  catalogue: [http.get('*/content', () => HttpResponse.json(MOCK_CATALOGUE))],
};
