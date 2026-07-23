import type { APIRoute } from 'astro';

// Microsoft Entra publisher-domain verification fetches this document to confirm the domain owns the
// app registration whose id it lists. Registered as a route (via `injectRoute` in astro.config.mjs)
// because the route scanner skips dotfile directories like `.well-known`. The Cloudflare Access gate
// must also bypass this exact path so the unauthenticated verification crawler can reach it.
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      associatedApplications: [{ applicationId: 'd1835fb5-956f-4b9e-9b32-2d717be0492d' }],
    }),
    { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' } },
  );
