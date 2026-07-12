import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { eq } from 'drizzle-orm';
import { AppModule } from '../../app.module';
import { user } from '../../auth/auth-schema';
import { auth } from '../../auth/better-auth';
import { DATABASE, type Database } from './database.module';

/**
 * Seeds local-only dev accounts. Passwords are hashed by Better Auth (via `signUpEmail`); roles are
 * then set directly in the DB — the bootstrap case, since no admin yet exists to authorize the
 * admin-plugin `createUser`. NEVER reuse these credentials outside local development.
 */
const log = new Logger('SeedAuth');

const SEED_USERS = [
  { email: 'admin@local.dev', name: 'Admin', password: 'password123', role: 'admin' },
  { email: 'editor@local.dev', name: 'Editor', password: 'password123', role: 'editor' },
  { email: 'teacher@local.dev', name: 'Teacher', password: 'password123', role: 'teacher' },
  { email: 'learner@local.dev', name: 'Learner', password: 'password123', role: 'learner' },
] as const;

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const db = app.get<Database>(DATABASE);

  for (const seed of SEED_USERS) {
    const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, seed.email));
    if (existing.length === 0) {
      await auth.api.signUpEmail({
        body: { email: seed.email, name: seed.name, password: seed.password },
      });
      log.log(`created ${seed.email}`);
    } else {
      log.log(`${seed.email} already exists`);
    }
    // Elevate/refresh the role every run so the mapping is deterministic.
    await db.update(user).set({ role: seed.role }).where(eq(user.email, seed.email));
    log.log(`${seed.email} → role '${seed.role}'`);
  }

  await app.close();
  log.log('auth seed complete');
  // OTEL/flagd keep the event loop alive; exit explicitly once the work is committed.
  process.exit(0);
}

main().catch((error) => {
  log.error(error);
  process.exit(1);
});
