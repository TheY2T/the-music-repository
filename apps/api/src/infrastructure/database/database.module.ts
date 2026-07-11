import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/** DI token for the Drizzle database client. */
export const DATABASE = Symbol('DATABASE');

export type Database = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Provides the Drizzle client. Kept in `infrastructure/` — only adapters depend on it,
 * never domain or application code (dependency rule: inward only).
 */
@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Database => {
        const url = config.getOrThrow<string>('DATABASE_URL');
        const client = postgres(url, { max: 5 });
        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
