import { nodePreset } from '@TheY2T/tmr-config-vitest';
import { defineConfig } from 'vitest/config';

// Pure logic package — node env, no DOM. See ADR 0020.
export default defineConfig(nodePreset());
