import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// SSR so the OpenFeature middleware can evaluate flags per request and gate personalized views.
// `site` gives i18n `hreflang` alternates an absolute base (override with PUBLIC_SITE_URL in prod).
// Locale routing (the `/zh` prefix) is handled in src/middleware.ts, not Astro's built-in `i18n`
// config, so a single set of page files serves every locale (see docs/features/i18n.md).
export default defineConfig({
  output: 'server',
  site: process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  server: { port: 4321 },
  vite: {
    plugins: [tailwindcss()],
  },
});
