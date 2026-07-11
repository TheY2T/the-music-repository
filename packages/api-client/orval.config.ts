import { defineConfig } from 'orval';

// FE client generated FROM the OpenAPI spec: TanStack Query hooks + standalone Zod schemas.
export default defineConfig({
  hooks: {
    input: '../api-spec/openapi.json',
    output: {
      mode: 'tags-split',
      client: 'react-query',
      httpClient: 'fetch',
      target: './src/generated',
      schemas: './src/generated/model',
      clean: true,
      override: {
        mutator: { path: './src/mutator/custom-fetch.ts', name: 'customFetch' },
      },
    },
  },
  zod: {
    input: '../api-spec/openapi.json',
    output: {
      mode: 'tags-split',
      client: 'zod',
      target: './src/generated',
      fileExtension: '.zod.ts',
      clean: false,
      override: { zod: { version: 4 } },
    },
  },
});
