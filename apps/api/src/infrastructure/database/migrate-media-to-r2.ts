import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { MediaLibrary } from '../../catalogue/application/ports/media-library.port';
import { DATABASE, type Database } from './database.module';
import { mediaObjects } from './schema';

const log = new Logger('MigrateMedia');

/**
 * Copies media bytes from Postgres (`media_objects`) into the configured object store (Cloudflare R2)
 * so a deployment can switch the `MediaLibrary` binding without losing existing media. Idempotent —
 * re-running overwrites each key. Requires R2 to be configured (otherwise the bound library is
 * Postgres and there is nothing to copy).
 */
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const config = app.get(ConfigService);
    if (!config.get<string>('R2_BUCKET')) {
      log.warn('R2_BUCKET is not set — media stays in Postgres, nothing to migrate. Skipping.');
      return;
    }

    const db = app.get<Database>(DATABASE);
    const media = app.get(MediaLibrary);
    await media.ensureBucket();

    const rows = await db
      .select({
        storageKey: mediaObjects.storageKey,
        data: mediaObjects.data,
        mime: mediaObjects.mime,
      })
      .from(mediaObjects);

    log.log(`Copying ${rows.length} media object(s) to R2…`);
    let copied = 0;
    for (const row of rows) {
      await media.putObject(row.storageKey, row.data, row.mime);
      copied += 1;
    }
    log.log(`Done — ${copied}/${rows.length} media object(s) now in R2.`);
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  log.error(err);
  process.exit(1);
});
