import type { HealthStatus } from '@TheY2T/tmr-contracts';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Interactive island: fetches the API `/health` contract and renders it.
 * Proves the FE↔BE wiring (shared `@TheY2T/tmr-contracts` types) and island hydration.
 */
export default function HealthCard({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/health`);
      setHealth((await response.json()) as HealthStatus);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Request failed');
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    void load();
  }, [load]);

  const dbUp = health?.checks.database === 'up';

  return (
    <section className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">API health</h2>
        <Button size="sm" variant="outline" onClick={() => void load()}>
          Refresh
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">Error: {error}</p>}
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
    </section>
  );
}
