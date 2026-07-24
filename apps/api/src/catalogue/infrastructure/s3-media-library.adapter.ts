import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaLibrary, type MediaObject } from '../application/ports/media-library.port';

/** Signed-upload lifetime — long enough for a CMS upload, short enough to limit replay. */
const PUT_URL_TTL_SECONDS = 15 * 60;

/**
 * Media storage backed by an S3-compatible object store (Cloudflare R2 in production, MinIO locally).
 * Reads are served from a public bucket domain, so the browser fetches bytes directly from the edge;
 * uploads use a short-lived presigned PUT. Object bytes never pass through the API.
 */
@Injectable()
export class S3MediaLibrary extends MediaLibrary {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBase: string;

  constructor(config: ConfigService) {
    super();
    const accountId = config.get<string>('R2_ACCOUNT_ID');
    const endpoint =
      config.get<string>('R2_ENDPOINT') ??
      (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);
    this.bucket = config.get<string>('R2_BUCKET') ?? '';
    this.publicBase = (config.get<string>('R2_PUBLIC_URL') ?? '').replace(/\/+$/, '');
    this.client = new S3Client({
      region: config.get<string>('R2_REGION') ?? 'auto',
      endpoint,
      // R2 and MinIO both address the bucket as a path segment rather than a subdomain.
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.get<string>('R2_ACCESS_KEY_ID') ?? '',
        secretAccessKey: config.get<string>('R2_SECRET_ACCESS_KEY') ?? '',
      },
    });
  }

  async presignGetUrl(storageKey: string): Promise<string> {
    // Public bucket on a custom domain — reads need no signature and are edge-cacheable.
    return `${this.publicBase}/${encodeURI(storageKey)}`;
  }

  async presignPutUrl(storageKey: string, contentType: string): Promise<string> {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: this.bucket, Key: storageKey, ContentType: contentType }),
      { expiresIn: PUT_URL_TTL_SECONDS },
    );
  }

  async ensureBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }

  async putObject(key: string, body: Uint8Array, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ContentLength: body.byteLength,
      }),
    );
  }

  async getObject(storageKey: string): Promise<MediaObject | null> {
    try {
      const res = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }),
      );
      const data = await res.Body?.transformToByteArray();
      if (!data) return null;
      return {
        data,
        mime: res.ContentType ?? 'application/octet-stream',
        bytes: res.ContentLength ?? data.byteLength,
        updatedAt: res.LastModified ?? new Date(),
      };
    } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
    }
  }
}

/** S3/R2 report a missing key as `NoSuchKey` or an HTTP 404. */
function isNotFound(err: unknown): boolean {
  const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
  return e?.name === 'NoSuchKey' || e?.name === 'NotFound' || e?.$metadata?.httpStatusCode === 404;
}
