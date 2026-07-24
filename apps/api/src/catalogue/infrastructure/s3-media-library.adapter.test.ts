import type { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

/** Args of a recorded mock call (throws if the call was never made) — keeps strict index access happy. */
function argsOf(mock: Mock, callIndex = 0): unknown[] {
  const call = mock.mock.calls[callIndex];
  if (!call) throw new Error(`expected mock call #${callIndex}`);
  return call as unknown[];
}

const sendMock = vi.fn();

vi.mock('@aws-sdk/client-s3', () => {
  class S3Client {
    send = sendMock;
    constructor(public readonly config: unknown) {}
  }
  // Command classes capture their input so tests can assert on it.
  class GetObjectCommand {
    readonly _name = 'GetObjectCommand';
    constructor(public readonly input: unknown) {}
  }
  class PutObjectCommand {
    readonly _name = 'PutObjectCommand';
    constructor(public readonly input: unknown) {}
  }
  class HeadBucketCommand {
    readonly _name = 'HeadBucketCommand';
    constructor(public readonly input: unknown) {}
  }
  class CreateBucketCommand {
    readonly _name = 'CreateBucketCommand';
    constructor(public readonly input: unknown) {}
  }
  return { S3Client, GetObjectCommand, PutObjectCommand, HeadBucketCommand, CreateBucketCommand };
});

const getSignedUrlMock = vi.fn();
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: (...args: unknown[]) => getSignedUrlMock(...args),
}));

import { S3MediaLibrary } from './s3-media-library.adapter';

const config = {
  get: (key: string) =>
    (
      ({
        R2_ACCOUNT_ID: 'acct',
        R2_BUCKET: 'tmr-media',
        R2_PUBLIC_URL: 'https://media.example.com',
        R2_ACCESS_KEY_ID: 'key',
        R2_SECRET_ACCESS_KEY: 'secret',
      }) as Record<string, string>
    )[key],
} as unknown as ConfigService;

describe('S3MediaLibrary', () => {
  let media: S3MediaLibrary;

  beforeEach(() => {
    sendMock.mockReset();
    getSignedUrlMock.mockReset();
    media = new S3MediaLibrary(config);
  });

  it('serves public reads from the public base URL (no signing)', async () => {
    expect(await media.presignGetUrl('content/slug/a b.png')).toBe(
      'https://media.example.com/content/slug/a%20b.png',
    );
    expect(getSignedUrlMock).not.toHaveBeenCalled();
  });

  it('presigns uploads with the content type', async () => {
    getSignedUrlMock.mockResolvedValue('https://signed.example/put');
    const url = await media.presignPutUrl('content/x/y.png', 'image/png');
    expect(url).toBe('https://signed.example/put');
    const command = argsOf(getSignedUrlMock)[1] as { input: Record<string, unknown> };
    expect(command.input).toMatchObject({
      Bucket: 'tmr-media',
      Key: 'content/x/y.png',
      ContentType: 'image/png',
    });
  });

  it('maps a stored object to bytes + validators', async () => {
    const updatedAt = new Date('2026-01-02T03:04:05Z');
    sendMock.mockResolvedValue({
      Body: { transformToByteArray: async () => new Uint8Array([1, 2, 3]) },
      ContentType: 'image/png',
      ContentLength: 3,
      LastModified: updatedAt,
    });
    const obj = await media.getObject('content/x/y.png');
    expect(obj).toEqual({
      data: new Uint8Array([1, 2, 3]),
      mime: 'image/png',
      bytes: 3,
      updatedAt,
    });
  });

  it('returns null for a missing key', async () => {
    sendMock.mockRejectedValue({ name: 'NoSuchKey' });
    expect(await media.getObject('missing')).toBeNull();
  });

  it('rethrows non-404 errors', async () => {
    sendMock.mockRejectedValue({ name: 'AccessDenied', $metadata: { httpStatusCode: 403 } });
    await expect(media.getObject('x')).rejects.toMatchObject({ name: 'AccessDenied' });
  });

  it('creates the bucket only when it is missing', async () => {
    sendMock.mockResolvedValueOnce({}); // HeadBucket succeeds
    await media.ensureBucket();
    expect(sendMock).toHaveBeenCalledTimes(1);

    sendMock.mockReset();
    sendMock.mockRejectedValueOnce({ name: 'NotFound' }); // HeadBucket fails
    sendMock.mockResolvedValueOnce({}); // CreateBucket
    await media.ensureBucket();
    const created = argsOf(sendMock, 1)[0] as { _name: string };
    expect(created._name).toBe('CreateBucketCommand');
  });
});
