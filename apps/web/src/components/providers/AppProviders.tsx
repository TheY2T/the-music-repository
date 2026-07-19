import { ApiDataProvider } from '@TheY2T/tmr-web-acl/api-data';
import type { ComponentType, PropsWithChildren } from 'react';

/**
 * The web app's provider composition, mounted at the root of an interactive region so every island in
 * that region inherits it. Add cross-cutting client providers here as they are introduced.
 */
export function AppProviders({ children }: PropsWithChildren) {
  return <ApiDataProvider>{children}</ApiDataProvider>;
}

/** Wraps a package island in {@link AppProviders} so a page can mount it directly with its own props. */
export function withAppProviders<P extends object>(Island: ComponentType<P>) {
  return function AppProvidedIsland(props: P) {
    return (
      <AppProviders>
        <Island {...props} />
      </AppProviders>
    );
  };
}
