import { ApiDataProvider } from '@TheY2T/tmr-web-acl/api-data';
import { InstrumentPreferencesProvider } from '@TheY2T/tmr-web-acl/instrument-preferences';
import type { ComponentType, PropsWithChildren } from 'react';

/**
 * The web app's provider composition, mounted at the root of an interactive region so every island in
 * that region inherits it. `authenticated` lets the instrument-preferences provider sync with the
 * account; anonymous regions fall back to a device-local (localStorage) copy.
 */
export function AppProviders({
  authenticated = false,
  children,
}: PropsWithChildren<{ authenticated?: boolean }>) {
  return (
    <ApiDataProvider>
      <InstrumentPreferencesProvider authenticated={authenticated}>
        {children}
      </InstrumentPreferencesProvider>
    </ApiDataProvider>
  );
}

/** Wraps a package island in {@link AppProviders} so a page can mount it directly with its own props. */
export function withAppProviders<P extends object>(Island: ComponentType<P>) {
  return function AppProvidedIsland(props: P & { authenticated?: boolean }) {
    const { authenticated, ...islandProps } = props;
    return (
      <AppProviders authenticated={authenticated}>
        <Island {...(islandProps as P)} />
      </AppProviders>
    );
  };
}
