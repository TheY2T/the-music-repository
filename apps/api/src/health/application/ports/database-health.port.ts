/**
 * Port (abstract class = DI token) describing what the health use-case needs from the database.
 * The application layer depends on this abstraction, never on Drizzle. Infrastructure supplies
 * an adapter that implements it.
 */
export abstract class DatabaseHealthPort {
  abstract ping(): Promise<boolean>;
}
