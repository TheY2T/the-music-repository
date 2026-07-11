import base from '@TheY2T/tmr-config-eslint';

export default [
  ...base,
  { ignores: ['dist/**', 'drizzle/**', 'src/**/generated/**'] },
  {
    // Hexagonal boundary: the domain layer must stay framework-free (no HTTP/ORM/OTEL/Pino).
    files: ['src/**/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@nestjs/*', '@opentelemetry/*', 'nestjs-*', 'pino', 'drizzle-orm'],
              message: 'Domain layer must stay framework-free (hexagonal boundary).',
            },
          ],
        },
      ],
    },
  },
];
