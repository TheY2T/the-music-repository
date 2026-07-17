import { reactPreset } from '@TheY2T/tmr-config-vitest';
import { defineConfig } from 'vitest/config';

// Raw-source ESM UI package — happy-dom preset (ADR 0020). Island/hook components that need
// Astro's getViteConfig or hit the duplicate-React optimizer are covered by E2E in apps/web.
export default defineConfig(reactPreset());
