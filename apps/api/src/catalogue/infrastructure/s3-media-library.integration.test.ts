import type { ConfigService } from '@nestjs/config';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { S3MediaLibrary } from './s3-media-library.adapter';

// Integration: the S3 media adapter against a real MinIO (an S3-compatible stand-in for R2) via
// Testcontainers. Proves ensureBucket + put/get roundtrip + presigned PUT. Requires a Docker/podman
// socket (opt-in via `test:integration`). See ADR 0020/0055 · docs/features/testing.md.
describe('S3MediaLibrary (Testcontainers MinIO)', () => {
  let container: StartedTestContainer;
  let media: S3MediaLibrary;

  beforeAll(async () => {
    container = await new GenericContainer('minio/minio:latest')
      .withCommand(['server', '/data'])
      .withEnvironment({ MINIO_ROOT_USER: 'minioadmin', MINIO_ROOT_PASSWORD: 'minioadmin' })
      .withExposedPorts(9000)
      .withWaitStrategy(Wait.forHttp('/minio/health/live', 9000))
      .start();

    const endpoint = `http://${container.getHost()}:${container.getMappedPort(9000)}`;
    const env: Record<string, string> = {
      R2_ENDPOINT: endpoint,
      R2_REGION: 'us-east-1',
      R2_ACCESS_KEY_ID: 'minioadmin',
      R2_SECRET_ACCESS_KEY: 'minioadmin',
      R2_BUCKET: 'tmr-media',
      R2_PUBLIC_URL: `${endpoint}/tmr-media`,
    };
    const config = { get: (k: string) => env[k] } as unknown as ConfigService;
    media = new S3MediaLibrary(config);
    await media.ensureBucket();
  }, 120_000);

  afterAll(async () => {
    await container?.stop();
  });

  it('stores and reads back an object with its content type', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    await media.putObject('content/x/file.bin', bytes, 'application/octet-stream');
    const obj = await media.getObject('content/x/file.bin');
    expect(obj?.mime).toBe('application/octet-stream');
    expect(obj?.bytes).toBe(4);
    expect(Array.from(obj?.data ?? [])).toEqual([1, 2, 3, 4]);
  });

  it('returns null for a missing key', async () => {
    expect(await media.getObject('content/does-not-exist')).toBeNull();
  });

  it('presigns an upload URL pointing at the object store', async () => {
    const url = await media.presignPutUrl('content/x/upload.png', 'image/png');
    expect(url).toContain('/tmr-media/content/x/upload.png');
    expect(url).toContain('X-Amz-Signature');
  });

  it('serves public reads from the public base URL', async () => {
    const url = await media.presignGetUrl('content/x/file.bin');
    expect(url).toMatch(/^http:\/\/.+\/tmr-media\/content\/x\/file\.bin$/);
  });
});
