import { reactPreset } from '@TheY2T/tmr-config-vitest';
import { defineConfig } from 'vitest/config';

// Data-seam layer (API wrappers, auth client, shell config). happy-dom for fetch/localStorage/DOM.
export default defineConfig(reactPreset());
