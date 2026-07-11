import { ApiProvider, useGetHealth } from '@TheY2T/tmr-api-client';
import { Button } from '@/components/ui/button';

/**
 * Interactive island consuming the spec-first generated client: the `useGetHealth` TanStack Query
 * hook (from `@TheY2T/tmr-api-client`, generated from the OpenAPI spec) replaces the old manual fetch.
 */
function HealthView() {
  const { data, error, refetch, isFetching } = useGetHealth();
  const health = data?.data; // Orval fetch client wraps the body: { status, data, headers }
  const dbUp = health?.checks.database === 'up';

  return (
    <section className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">API health</h2>
        <Button size="sm" variant="outline" onClick={() => void refetch()} disabled={isFetching}>
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-red-500">
          Error: {error instanceof Error ? error.message : 'Request failed'}
        </p>
      ) : null}
      {health && (
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            status: <span className="font-mono">{health.status}</span>
          </li>
          <li>
            database:{' '}
            <span className={dbUp ? 'font-mono text-green-600' : 'font-mono text-amber-600'}>
              {health.checks.database}
            </span>
          </li>
          <li>
            service: <span className="font-mono">{health.service}</span>
          </li>
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        via generated <span className="font-mono">useGetHealth()</span> hook (spec-first client)
      </p>
    </section>
  );
}

export default function HealthCard() {
  return (
    <ApiProvider>
      <HealthView />
    </ApiProvider>
  );
}
