import { defineConfig } from 'orval';

// Backend Zod DTOs generated FROM the OpenAPI spec (the source of truth is TypeSpec → openapi.json).
export default defineConfig({
  schemas: {
    input: '../api-spec/openapi.json',
    output: {
      mode: 'single',
      client: 'zod',
      target: './src/generated/schemas.ts',
      clean: true,
      override: { zod: { version: 4 } },
    },
  },
});
