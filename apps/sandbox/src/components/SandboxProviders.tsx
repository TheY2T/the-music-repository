import { ApiDataProvider } from '@TheY2T/tmr-web-acl/api-data';
import { InstrumentPreferencesProvider } from '@TheY2T/tmr-web-acl/instrument-preferences';
import type { PropsWithChildren } from 'react';
import { mockPort } from '@/lib/mock-port';

/**
 * The sandbox's provider composition, mounted once at the root of each specimen island so every
 * component in that island inherits the contexts it may read. Mirrors the web app's `AppProviders`, but
 * binds the data-access port to a canned mock so specimens render with no live API. Instrument
 * preferences run anonymous (device-local), which is what powers the handedness/skin switchers.
 */
export function SandboxProviders({ children }: PropsWithChildren) {
  return (
    <ApiDataProvider port={mockPort}>
      <InstrumentPreferencesProvider authenticated={false}>
        {children}
      </InstrumentPreferencesProvider>
    </ApiDataProvider>
  );
}
