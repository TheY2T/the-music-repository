import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { type ApiDataPort, ApiDataProvider, useApiData } from './api-data';

describe('useApiData', () => {
  it('throws when read outside an ApiDataProvider', () => {
    expect(() => renderHook(() => useApiData())).toThrow(/ApiDataProvider/);
  });

  it('exposes the api-client-backed hooks inside a provider', () => {
    const { result } = renderHook(() => useApiData(), {
      wrapper: ({ children }) => <ApiDataProvider>{children}</ApiDataProvider>,
    });
    expect(typeof result.current.useSearchCatalogue).toBe('function');
    expect(typeof result.current.useGetHealth).toBe('function');
    expect(typeof result.current.useGetCollectionWithProgress).toBe('function');
  });

  it('honours an injected port override', () => {
    const stub = { useGetHealth: () => undefined } as unknown as ApiDataPort;
    const { result } = renderHook(() => useApiData(), {
      wrapper: ({ children }) => <ApiDataProvider port={stub}>{children}</ApiDataProvider>,
    });
    expect(result.current).toBe(stub);
  });
});
