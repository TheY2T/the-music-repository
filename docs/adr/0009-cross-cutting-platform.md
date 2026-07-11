# ADR 0009 — Cross-cutting platform module

- **Status:** Accepted
- **Context:** Every API service must behave identically for logging, tracing, request context,
  validation, and error shaping — without repeating wiring or leaking framework into the domain.
- **Decision:** `@TheY2T/tmr-nest-platform` exports one **`PlatformModule`**. A service does
  `imports: [PlatformModule]` and inherits: `ObservabilityModule` (logging/tracing/ALS ports), a global
  `ZodValidationPipe` (APP_PIPE), the `TracingInterceptor` (APP_INTERCEPTOR), and the
  `ProblemDetailsExceptionFilter` (APP_FILTER).
- **Package layering (dependency direction):** `errors` (pure) ← `observability` (nest+otel+pino) ←
  `nest-platform`. `errors` is framework-free so the **domain** can import `DomainError`. The filter
  lives in `nest-platform` (not `errors`) precisely to keep `errors` importable by the domain.
- **Boundary enforcement:** an ESLint `no-restricted-imports` rule fails the build if `**/domain/**`
  imports `@nestjs/*`, `@opentelemetry/*`, `nestjs-*`, `pino`, or `drizzle-orm`.
- **Consequences:** consistent behaviour across services from a single import; the domain stays pure;
  cross-cutting concerns are testable in isolation.
