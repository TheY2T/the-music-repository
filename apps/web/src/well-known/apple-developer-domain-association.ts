import type { APIRoute } from 'astro';
// The exact bytes Apple issued for this Services ID, inlined at build time so the file ships with the
// server bundle (nothing is read from disk at runtime under the node adapter's middleware mode).
import association from './apple-developer-domain-association.txt?raw';

// Sign in with Apple domain verification fetches this document to confirm the domain owns the Services ID.
// Registered as a route (via `injectRoute` in astro.config.mjs) because the route scanner skips dotfile
// directories like `.well-known`. Served verbatim as text/plain — Apple validates the embedded PKCS#7
// signature. The Cloudflare Access gate must also bypass this exact path so the unauthenticated
// verification crawler can reach it.
export const GET: APIRoute = () =>
  new Response(association, {
    headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'public, max-age=3600' },
  });
