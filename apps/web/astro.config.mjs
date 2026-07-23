import node from '@astrojs/node';
import react from '@astrojs/react';
import { alphaTab } from '@coderline/alphatab-vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

/**
 * Registers `/.well-known/*` endpoints. The route scanner globs `src/pages/**` with dotfiles excluded,
 * so a `.well-known` directory there is never discovered; `injectRoute` maps the paths explicitly.
 */
function wellKnownRoutes() {
  return {
    name: 'well-known-routes',
    hooks: {
      'astro:config:setup': ({ injectRoute }) => {
        injectRoute({
          pattern: '/.well-known/microsoft-identity-association.json',
          entrypoint: './src/well-known/microsoft-identity-association.ts',
        });
      },
    },
  };
}

// SSR so the OpenFeature middleware can evaluate flags per request and gate personalized views.
// `site` gives i18n `hreflang` alternates an absolute base (override with PUBLIC_SITE_URL in prod).
// Locale routing (the `/zh` prefix) is handled in src/middleware.ts, not Astro's built-in `i18n`
// config, so a single set of page files serves every locale (see docs/features/i18n.md).
export default defineConfig({
  output: 'server',
  site: process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321',
  // `middleware` (not `standalone`) so the production server (server.mjs) wraps the SSR handler with
  // response compression and serves the built client assets with long-lived immutable cache headers.
  adapter: node({ mode: 'middleware' }),
  // `icon()` renders Lucide (@iconify-json/lucide) as zero-JS inline SVG in .astro files.
  // `wellKnownRoutes` registers `/.well-known/*` endpoints the route scanner can't discover on its own
  // (it skips dotfile directories). Without an injected route, requests to these paths match nothing and
  // the node adapter's `middleware` mode never runs the SSR handler for them.
  integrations: [react(), icon(), wellKnownRoutes()],
  server: { port: 4321 },
  vite: {
    // alphaTab() (ADR 0027) is the single score engine's build integration: it copies the
    // version-matched Bravura music font → /font and the SONiVOX soundfont → /soundfont/sonivox.sf2,
    // and wires alphaTab's Web Worker + AudioWorklet for the dev server and the SSR build. The engine
    // points `core.fontDirectory`/`player.soundFont` at those paths, so scores need no external CDN.
    // (Plugin lives in its own `@coderline/alphatab-vite` package; the main package's `/vite` subpath
    // is a broken re-export in 1.8.4.)
    plugins: [alphaTab(), tailwindcss()],
    // react-grid-layout's dependency react-draggable calls `process.env.DRAGGABLE_DEBUG` in a debug
    // logger; `process` is undefined in the browser, so a drag/resize start would throw
    // `ReferenceError: process is not defined`. Replace the reference at build time so the guard is a
    // plain `false`. See the dashboard-spaces editor (ADR 0045/0046).
    define: { 'process.env.DRAGGABLE_DEBUG': 'false' },
    // The shared UI packages ship raw source (incl. `.astro`), which Astro must transform rather
    // than treat as externalized node_modules dependencies during SSR. See docs/features/design-system.md.
    ssr: {
      noExternal: [
        '@TheY2T/tmr-ui',
        '@TheY2T/tmr-common-ui',
        '@TheY2T/tmr-musickit-ui',
        '@TheY2T/tmr-music-core',
        '@TheY2T/tmr-web-acl',
        // Raw-source ESM (extensionless .ts imports) — must be transformed, not externalized. It was
        // auto-inlined when only apps/web imported it; now the noExternal UI packages import it too, and
        // Vite externalizes a noExternal package's own deps unless they're listed here. See ADR 0033.
        '@TheY2T/tmr-api-client',
      ],
    },
    // Pre-bundle lucide-react so the Vite dev server doesn't request every icon module individually
    // (barrel-import blowup — hundreds of requests / slow HMR). See docs/features/icons.md.
    // NOTE: pixi.js/@pixi/react and @coderline/alphatab are intentionally NOT pre-bundled here.
    // Including them made Astro's `getViteConfig` pull a second React copy into the Vitest optimizer →
    // "invalid hook call" in island tests. They are lazy-imported per island at runtime, so Vite
    // discovers + optimizes them on first use (a one-time dev `504 Outdated Optimize Dep` that
    // self-heals on reload — same class of gotcha as smplr). See docs/features/pixi-visualization.md.
    optimizeDeps: { include: ['lucide-react'] },
  },
});
