import { alphaTab } from '@coderline/alphatab-vite';
import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';

// Central Storybook host (ADR 0018/0033): a single workbench aggregating the co-located stories from
// every UI package plus the auto-galleries in this package's own src.
const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(ts|tsx)',
    '../../ui/src/**/*.stories.@(ts|tsx)',
    '../../musickit-ui/src/**/*.stories.@(ts|tsx)',
    '../../common-ui/src/**/*.stories.@(ts|tsx)',
  ],
  framework: { name: '@storybook/react-vite', options: {} },
  // Serves the MSW worker copied into public/ by scripts/gen-stories.mjs.
  staticDirs: ['../public'],
  // Mirror the app's Vite setup so stories render with the real tokens/utilities (Tailwind v4 CSS-first).
  // The alphaTab plugin (fonts + soundfont for score components) is added for DEV only — it breaks
  // Storybook's static worker bundling, so `build-storybook` omits it (score components render in
  // `dev`, and degrade to the error boundary in the static build).
  viteFinal: (cfg, { configType }) => {
    cfg.plugins = [...(cfg.plugins ?? []), tailwindcss()];
    if (configType === 'DEVELOPMENT') cfg.plugins.push(alphaTab());
    // Pre-bundle the heavy client-only deps the tool islands lazy-import. Without this, navigating to
    // a story that first pulls them (e.g. ContentEmbeds → ScorePlayer/pixi) makes Vite re-optimize
    // mid-navigation and 504 the in-flight story module ("Failed to fetch dynamically imported
    // module"). Safe here — this is Storybook's own Vite, not Vitest's getViteConfig (the context the
    // repo's optimizeDeps warning is about).
    cfg.optimizeDeps = cfg.optimizeDeps ?? {};
    cfg.optimizeDeps.include = [
      ...(cfg.optimizeDeps.include ?? []),
      'pixi.js',
      '@pixi/react',
      'smplr',
    ];
    // @coderline/alphatab is handled by the alphaTab plugin (dev) — pre-bundling it conflicts, so it
    // stays excluded from optimization.
    cfg.optimizeDeps.exclude = [...(cfg.optimizeDeps.exclude ?? []), '@coderline/alphatab'];
    return cfg;
  },
};

export default config;
