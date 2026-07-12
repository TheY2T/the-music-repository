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
    plugins: [tailwindcss()],
    // The UI package ships raw source (incl. `.astro`), which Astro must transform rather than
    // treat as an externalized node_modules dependency during SSR. See docs/features/design-system.md.
    ssr: { noExternal: ['@TheY2T/tmr-ui'] },
    // Pre-bundle lucide-react so the Vite dev server doesn't request every icon module individually
    // (barrel-import blowup — hundreds of requests / slow HMR). See docs/features/icons.md.
    optimizeDeps: { include: ['lucide-react'] },
  },
});
