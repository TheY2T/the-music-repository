import astro from 'eslint-plugin-astro';
import base from './index.js';

/** Base thin config + Astro support (Biome does not lint `.astro` files). */
export default [...base, ...astro.configs.recommended];
