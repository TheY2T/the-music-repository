// Composes the active MSW handler set from the selected services. Services NOT listed in
// TMR_E2E_MOCK_SERVICES get no handler, so their requests fall through to `onUnhandledRequest`
// (bypass → the real backend) — that is what makes "mock a subset, hit real for the rest" work.
import { selectedServices } from '../mocks/data.mjs';
import { serviceHandlers } from './handlers.mjs';

export function selectedHandlers() {
  return selectedServices().flatMap((name) => serviceHandlers[name] ?? []);
}
