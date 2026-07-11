// Starts the OpenTelemetry SDK. Imported first in main.ts and also preloadable via
// `node --require ./dist/otel.js` so instrumentation patches modules before they load.
import { startOtel } from '@TheY2T/tmr-observability/otel';

startOtel();
