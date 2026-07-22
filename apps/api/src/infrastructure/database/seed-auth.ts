import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { and, eq } from 'drizzle-orm';
import { AppModule } from '../../app.module';
import { account, user } from '../../auth/auth-schema';
import { auth } from '../../auth/better-auth';
import { DATABASE, type Database } from './database.module';

/**
 * Seeds the fixed-role accounts. Each account's password comes from its `SEED_*_PASSWORD` env var; when
 * that's set the seed also **rotates** the password on an already-existing account, so changing the env
 * var and re-running (e.g. on deploy) updates the credential. With no env var set, a new account is
 * created with a local-dev fallback and an existing account is left untouched. Roles + verified status are
 * reasserted every run. NEVER commit real passwords — set them via environment only.
 */
const log = new Logger('SeedAuth');

/** Local-dev fallback, used only when a `SEED_*_PASSWORD` env var is not set (never for a set env). */
const DEV_FALLBACK_PASSWORD = 'password123';

const SEED_USERS = [
  { email: 'admin@local.dev', name: 'Admin', role: 'admin', passwordEnv: 'SEED_ADMIN_PASSWORD' },
  {
    email: 'editor@local.dev',
    name: 'Editor',
    role: 'editor',
    passwordEnv: 'SEED_EDITOR_PASSWORD',
  },
  {
    email: 'teacher@local.dev',
    name: 'Teacher',
    role: 'teacher',
    passwordEnv: 'SEED_TEACHER_PASSWORD',
  },
  {
    email: 'learner@local.dev',
    name: 'Learner',
    role: 'learner',
    passwordEnv: 'SEED_LEARNER_PASSWORD',
  },
] as const;

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const db = app.get<Database>(DATABASE);
  // Better Auth's internal context exposes the same password hasher the credential provider uses, so a
  // rotated hash is verifiable at sign-in.
  const ctx = await auth.$context;

  for (const seed of SEED_USERS) {
    const configuredPassword = process.env[seed.passwordEnv]?.trim() || undefined;
    const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, seed.email));
    const existingId = existing[0]?.id;

    if (!existingId) {
      await auth.api.signUpEmail({
        body: {
          email: seed.email,
          name: seed.name,
          password: configuredPassword ?? DEV_FALLBACK_PASSWORD,
        },
      });
      log.log(`created ${seed.email}`);
    } else if (configuredPassword) {
      const hash = await ctx.password.hash(configuredPassword);
      await db
        .update(account)
        .set({ password: hash, updatedAt: new Date() })
        .where(and(eq(account.userId, existingId), eq(account.providerId, 'credential')));
      log.log(`${seed.email} password rotated`);
    } else {
      log.log(`${seed.email} already exists`);
    }

    // Reassert the role and mark the address verified so these accounts can sign in.
    await db
      .update(user)
      .set({ role: seed.role, emailVerified: true })
      .where(eq(user.email, seed.email));
    log.log(`${seed.email} → role '${seed.role}'`);
  }

  await app.close();
  log.log('auth seed complete');
  // OTEL keeps the event loop alive; exit explicitly once the work is committed.
  process.exit(0);
}

main().catch((error) => {
  log.error(error);
  process.exit(1);
});
