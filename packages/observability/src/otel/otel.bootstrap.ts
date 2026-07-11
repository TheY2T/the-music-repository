import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

let sdk: NodeSDK | undefined;

/**
 * Start the OpenTelemetry Node SDK. MUST run before NestJS/Express/pg are imported, so load it
 * via `node --require .../otel.js`. Endpoint comes from OTEL_EXPORTER_OTLP_ENDPOINT (OTLP → Collector).
 */
export function startOtel(): void {
  if (sdk) {
    return;
  }
  const isProd = process.env.NODE_ENV === 'production';
  const ratio = process.env.OTEL_TRACES_SAMPLER_ARG
    ? Number(process.env.OTEL_TRACES_SAMPLER_ARG)
    : isProd
      ? 0.1
      : 1;

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? 'tmr-api',
    [ATTR_SERVICE_VERSION]: process.env.SERVICE_VERSION ?? '0.0.0',
    'deployment.environment.name': process.env.NODE_ENV ?? 'development',
  });

  sdk = new NodeSDK({
    resource,
    sampler: new ParentBasedSampler({ root: new TraceIdRatioBasedSampler(ratio) }),
    traceExporter: new OTLPTraceExporter(),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter(),
      exportIntervalMillis: 15000,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  sdk.start();

  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.on(signal, () => {
      void sdk
        ?.shutdown()
        .catch(() => undefined)
        .finally(() => process.exit(0));
    });
  }
}
