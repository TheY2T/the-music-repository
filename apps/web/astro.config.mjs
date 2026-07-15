import { alphaTab } from '@coderline/alphatab-vite';
import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

// SSR so the OpenFeature middleware can evaluate flags per request and gate personalized views.
// `site` gives i18n `hreflang` alternates an absolute base (override with PUBLIC_SITE_URL in prod).
// Locale routing (the `/zh` prefix) is handled in src/middleware.ts, not Astro's built-in `i18n`
// config, so a single set of page files serves every locale (see docs/features/i18n.md).
export default defineConfig({
  output: 'server',
  site: process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321',
  adapter: node({ mode: 'standalone' }),
  // `icon()` renders Lucide (@iconify-json/lucide) as zero-JS inline SVG in .astro files.
  integrations: [react(), icon()],
  server: { port: 4321 },
  vite: {
    // alphaTab() (ADR 0027) is the single score engine's build integration: it copies the
    // version-matched Bravura music font → /font and the SONiVOX soundfont → /soundfont/sonivox.sf2,
    // and wires alphaTab's Web Worker + AudioWorklet for the dev server and the SSR build. The engine
    // points `core.fontDirectory`/`player.soundFont` at those paths, so scores need no external CDN.
    // (Plugin lives in its own `@coderline/alphatab-vite` package; the main package's `/vite` subpath
    // is a broken re-export in 1.8.4.)
    plugins: [alphaTab(), tailwindcss()],
    // The UI package ships raw source (incl. `.astro`), which Astro must transform rather than
    // treat as an externalized node_modules dependency during SSR. See docs/features/design-system.md.
    ssr: { noExternal: ['@TheY2T/tmr-ui'] },
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
