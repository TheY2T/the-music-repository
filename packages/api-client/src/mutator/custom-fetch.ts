/**
 * Custom fetch for the generated Orval client. Injects the API base URL from the Vite env
 * (`PUBLIC_API_BASE_URL`) and returns Orval v8's `{ status, data, headers }` response wrapper.
 * Bundled into the web app, so `import.meta.env` resolves there.
 */
export const customFetch = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  const base = env?.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
  const response = await fetch(`${base}${url}`, options);
  const data = response.headers.get('content-type')?.includes('json')
    ? await response.json()
    : await response.text();

  return { status: response.status, data, headers: response.headers } as T;
};
