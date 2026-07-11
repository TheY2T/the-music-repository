import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaLibrary } from '../application/ports/media-library.port';

@Injectable()
export class S3MediaLibrary extends MediaLibrary implements OnApplicationBootstrap {
  private readonly logger = new Logger(S3MediaLibrary.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly internalEndpoint: string;
  private readonly publicEndpoint: string;
  private readonly corsOrigins: string[];

  constructor(config: ConfigService) {
    super();
    this.internalEndpoint = config.getOrThrow<string>('S3_ENDPOINT');
    this.publicEndpoint = config.get<string>('S3_PUBLIC_ENDPOINT') ?? this.internalEndpoint;
    this.bucket = config.get<string>('S3_BUCKET') ?? 'tmr-media';
    this.corsOrigins = (config.get<string>('TRUSTED_ORIGINS') ?? 'http://localhost:4321')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
    this.client = new S3Client({
      endpoint: this.internalEndpoint,
      region: config.get<string>('S3_REGION') ?? 'us-east-1',
      forcePathStyle: true, // required for MinIO / path-style S3
      credentials: {
        accessKeyId: config.getOrThrow<string>('S3_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow<string>('S3_SECRET_ACCESS_KEY'),
      },
    });
  }

  /** Ensure the bucket + CORS exist on boot so browser presigned uploads work. Graceful if MinIO is down. */
  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.ensureBucket();
    } catch {
      this.logger.warn(
        `Could not reach object storage at ${this.internalEndpoint} — media uploads/downloads ` +
          'will fail until it is up. Start it with `pnpm infra:up`.',
      );
    }
  }

  async ensureBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
    await this.ensureCors();
  }

  /**
   * Allow the web origins to PUT (presigned upload) + GET directly from the browser. Best-effort:
   * some MinIO builds return `NotImplemented` for PutBucketCors, and MinIO's default CORS is already
   * permissive — so a failure here must not break bucket setup / seeding.
   */
  private async ensureCors(): Promise<void> {
    try {
      await this.client.send(
        new PutBucketCorsCommand({
          Bucket: this.bucket,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedMethods: ['GET', 'PUT'],
                AllowedOrigins: this.corsOrigins,
                AllowedHeaders: ['*'],
                ExposeHeaders: ['ETag'],
                MaxAgeSeconds: 3600,
              },
            ],
          },
        }),
      );
    } catch {
      this.logger.debug(
        'PutBucketCors not applied (unsupported by this storage); relying on defaults.',
      );
    }
  }

  async putObject(key: string, body: Uint8Array, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
    );
  }

  async presignGetUrl(storageKey: string): Promise<string> {
    const url = await getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }),
      { expiresIn: 3600 },
    );
    return this.toPublicUrl(url);
  }

  async presignPutUrl(storageKey: string, contentType: string): Promise<string> {
    const url = await getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: this.bucket, Key: storageKey, ContentType: contentType }),
      { expiresIn: 3600 },
    );
    return this.toPublicUrl(url);
  }

  /** The SDK signs against the internal endpoint (e.g. minio:9000); rewrite to the browser-reachable host. */
  private toPublicUrl(url: string): string {
    return this.internalEndpoint === this.publicEndpoint
      ? url
      : url.replace(this.internalEndpoint, this.publicEndpoint);
  }
}
