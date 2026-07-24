import 'reflect-metadata';
import type { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import type { Database } from '../infrastructure/database/database.module';
import { CatalogueSearch } from './application/ports/catalogue-search.port';
import { ContentRepository } from './application/ports/content-repository.port';
import { MediaLibrary } from './application/ports/media-library.port';
import { CatalogueModule } from './catalogue.module';
import { MeiliCatalogueSearch } from './infrastructure/meili-catalogue-search.adapter';
import { PostgresCatalogueSearch } from './infrastructure/postgres-catalogue-search.adapter';
import { PostgresMediaLibrary } from './infrastructure/postgres-media-library.adapter';
import { S3MediaLibrary } from './infrastructure/s3-media-library.adapter';

// The bindings pick the adapter from env — assert the factories directly (no Nest DI / DB needed).
interface FactoryProvider {
  provide: unknown;
  useFactory: (...args: unknown[]) => unknown;
}

function factoryFor(token: unknown): FactoryProvider {
  const providers = Reflect.getMetadata('providers', CatalogueModule) as FactoryProvider[];
  const provider = providers.find(
    (p) => p?.provide === token && typeof p?.useFactory === 'function',
  );
  if (!provider) throw new Error('factory provider not found');
  return provider;
}

const configWith = (env: Record<string, string>) =>
  ({ get: (key: string) => env[key] }) as unknown as ConfigService;

const db = {} as Database;
const repository = {} as ContentRepository;

describe('CatalogueModule adapter selection', () => {
  it('binds MediaLibrary to R2 when R2_BUCKET is set, else Postgres', () => {
    const { useFactory } = factoryFor(MediaLibrary);
    expect(useFactory(configWith({ R2_BUCKET: 'tmr-media' }), db)).toBeInstanceOf(S3MediaLibrary);
    expect(useFactory(configWith({}), db)).toBeInstanceOf(PostgresMediaLibrary);
  });

  it('binds CatalogueSearch to Meilisearch when MEILI_HOST is set, else Postgres', () => {
    const { useFactory } = factoryFor(CatalogueSearch);
    expect(useFactory(configWith({ MEILI_HOST: 'http://meili:7700' }), repository)).toBeInstanceOf(
      MeiliCatalogueSearch,
    );
    expect(useFactory(configWith({}), repository)).toBeInstanceOf(PostgresCatalogueSearch);
  });
});
