import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import sirv from 'sirv';
import { handler as ssrHandler } from './dist/server/entry.mjs';

// Production entry for the SSR app (Astro node adapter in `middleware` mode). It layers three things
// the standalone adapter can't express, in order: response compression, long-lived caching for built
// client assets, then the Astro SSR handler.
const HOST = process.env.HOST ?? '0.0.0.0';
const PORT = Number(process.env.PORT ?? 4321);

const clientDir = fileURLToPath(new URL('./dist/client', import.meta.url));
const ONE_YEAR = 60 * 60 * 24 * 365;

// Vite content-hashes `/_astro/*` (and the self-hosted `/font` + `/soundfont` assets change only when
// the pinned alphaTab/soundfont versions bump), so they can be cached for a year and never revalidated.
// Everything else in the client dir (e.g. the OG image) gets a modest TTL.
function setHeaders(res, pathname) {
  const immutable =
    pathname.startsWith('/_astro/') ||
    pathname.startsWith('/font/') ||
    pathname.startsWith('/soundfont/');
  res.setHeader(
    'Cache-Control',
    immutable ? `public, max-age=${ONE_YEAR}, immutable` : 'public, max-age=3600',
  );
}

const compress = compression();
const serveStatic = sirv(clientDir, { etag: true, setHeaders });

const server = createServer((req, res) => {
  // Refuse traffic that arrives on Render's default `*.onrender.com` host — it bypasses Cloudflare (and
  // its Access gate). Applied here so static assets are covered too, not only the SSR routes.
  const host = (req.headers.host ?? '').split(':')[0];
  if (host.endsWith('.onrender.com')) {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }

  compress(req, res, () => {
    serveStatic(req, res, () => {
      ssrHandler(req, res, (err) => {
        if (err) {
          res.statusCode = 500;
          res.end('Internal Server Error');
          return;
        }
        // In `middleware` mode the SSR handler calls back (rather than responding) for any request that
        // matches no Astro route or static asset. Nothing downstream answers, so send a 404 here instead
        // of leaving the connection open until it times out.
        if (!res.headersSent) {
          res.statusCode = 404;
          res.end('Not found');
        }
      });
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`tmr-web listening on http://${HOST}:${PORT}`);
});
