/**
 * DatastoreHealthCheck — the health feature's requirement: is the primary datastore reachable?
 * Named for the capability the application needs, not the technology. Infrastructure supplies an adapter.
 */
export abstract class DatastoreHealthCheck {
  abstract ping(): Promise<boolean>;
}
