import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { mediaObjects } from '../../infrastructure/database/schema';
import { MediaLibrary, type MediaObject } from '../application/ports/media-library.port';

/**
 * Media storage backed by Postgres. Object bytes live in `media_objects`, keyed by `storageKey`; the
 * browser reads and uploads them through the API's media route rather than a separate object store.
 */
@Injectable()
export class PostgresMediaLibrary extends MediaLibrary {
  private readonly publicBase: string;

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    config: ConfigService,
  ) {
    super();
    const base =
      config.get<string>('MEDIA_PUBLIC_URL') ??
      config.get<string>('BETTER_AUTH_URL') ??
      'http://localhost:3000';
    this.publicBase = base.replace(/\/+$/, '');
  }

  private urlFor(storageKey: string): string {
    return `${this.publicBase}/media?key=${encodeURIComponent(storageKey)}`;
  }

  async presignGetUrl(storageKey: string): Promise<string> {
    return this.urlFor(storageKey);
  }

  async presignPutUrl(storageKey: string, _contentType: string): Promise<string> {
    return this.urlFor(storageKey);
  }

  /** No bucket to create — objects live in Postgres. */
  async ensureBucket(): Promise<void> {}

  async putObject(key: string, body: Uint8Array, contentType: string): Promise<void> {
    const data = Buffer.from(body);
    await this.db
      .insert(mediaObjects)
      .values({ storageKey: key, data, mime: contentType, bytes: data.byteLength })
      .onConflictDoUpdate({
        target: mediaObjects.storageKey,
        set: { data, mime: contentType, bytes: data.byteLength, updatedAt: new Date() },
      });
  }

  async getObject(storageKey: string): Promise<MediaObject | null> {
    const [row] = await this.db
      .select({
        data: mediaObjects.data,
        mime: mediaObjects.mime,
        bytes: mediaObjects.bytes,
        updatedAt: mediaObjects.updatedAt,
      })
      .from(mediaObjects)
      .where(eq(mediaObjects.storageKey, storageKey))
      .limit(1);
    return row
      ? { data: row.data, mime: row.mime, bytes: row.bytes, updatedAt: row.updatedAt }
      : null;
  }
}
