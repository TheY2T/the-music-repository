import node from '@astrojs/node';
import react from '@astrojs/react';
import { alphaTab } from '@coderline/alphatab-vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

// The sandbox mounts the same shared UI packages as apps/web, so it mirrors the web app's build:
// SSR output (a per-request middleware seeds dev-only `Astro.locals`), the React + icon integrations,
// the alphaTab asset pipeline, Tailwind v4, and — crucially — the `ssr.noExternal` list and
// `optimizeDeps` tuning that let the raw-source packages render correctly. It runs on 4322 so it can
// sit alongside apps/web (4321) during development. Dev-only: this app is never deployed.
export default defineConfig({
  output: 'server',
  site: process.env.PUBLIC_SITE_URL ?? 'http://localhost:4322',
  adapter: node({ mode: 'standalone' }),
  // `icon()` renders Lucide (@iconify-json/lucide) as zero-JS inline SVG in .astro files.
  integrations: [react(), icon()],
  server: { port: 4322 },
  vite: {
    // alphaTab() copies the version-matched Bravura music font → /font and the SONiVOX soundfont →
    // /soundfont/sonivox.sf2, and wires alphaTab's Web Worker + AudioWorklet, so the score specimens
    // render and play with no external CDN. (The plugin lives in `@coderline/alphatab-vite`.)
    plugins: [alphaTab(), tailwindcss()],
    // react-grid-layout's react-draggable reads `process.env.DRAGGABLE_DEBUG`; `process` is undefined
    // in the browser, so a drag/resize start would throw. Replace the reference at build time with a
    // plain `false` (the dashboard-spaces builder specimen uses it).
    define: { 'process.env.DRAGGABLE_DEBUG': 'false' },
    // The shared UI packages ship raw source (incl. `.astro`), which Astro must transform rather than
    // treat as externalized node_modules during SSR. See docs/features/design-system.md.
    ssr: {
      noExternal: [
        '@TheY2T/tmr-ui',
        '@TheY2T/tmr-common-ui',
        '@TheY2T/tmr-musickit-ui',
        '@TheY2T/tmr-music-core',
        '@TheY2T/tmr-web-acl',
        '@TheY2T/tmr-api-client',
      ],
    },
    // Pre-bundle lucide-react so the dev server doesn't request every icon module individually.
    // pixi.js/@pixi/react and @coderline/alphatab are intentionally NOT pre-bundled (a second React
    // copy in the optimizer breaks island hook calls); they lazy-import per specimen at runtime.
    optimizeDeps: { include: ['lucide-react'] },
  },
});
