import { Button, Card } from '@TheY2T/tmr-ui';
import { useApiData } from '@TheY2T/tmr-web-acl/api-data';

/** Interactive island reporting API health via the data-access port's health query hook. */
function HealthView() {
  const { useGetHealth } = useApiData();
  const { data, error, refetch, isFetching } = useGetHealth();
  const health = data?.data; // Orval fetch client wraps the body: { status, data, headers }
  const dbUp = health?.checks.database === 'up';

  return (
    <Card className="space-y-3 p-4">
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
    </Card>
  );
}

export default function HealthCard() {
  return <HealthView />;
}
