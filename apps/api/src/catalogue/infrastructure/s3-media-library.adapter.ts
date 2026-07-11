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
import { MediaLibrary } from '../application/ports/media-library.port';

@Injectable()
export class S3MediaLibrary extends MediaLibrary {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly internalEndpoint: string;
  private readonly publicEndpoint: string;

  constructor(config: ConfigService) {
    super();
    this.internalEndpoint = config.getOrThrow<string>('S3_ENDPOINT');
    this.publicEndpoint = config.get<string>('S3_PUBLIC_ENDPOINT') ?? this.internalEndpoint;
    this.bucket = config.get<string>('S3_BUCKET') ?? 'tmr-media';
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

  async ensureBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
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
    // The SDK signs against the internal endpoint (e.g. minio:9000); rewrite to the browser-reachable host.
    return this.internalEndpoint === this.publicEndpoint
      ? url
      : url.replace(this.internalEndpoint, this.publicEndpoint);
  }
}
