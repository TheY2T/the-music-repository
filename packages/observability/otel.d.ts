// Type shim so classic (node10) module resolution can resolve `@TheY2T/tmr-observability/otel`.
// Runtime resolves via the package "exports" map to dist/otel/otel.bootstrap.js.
export * from './dist/otel/otel.bootstrap';
