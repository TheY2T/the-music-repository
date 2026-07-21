import { Controller, Headers, HttpCode, Put, Query, Req } from '@nestjs/common';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { MediaLibrary } from '../catalogue/application/ports/media-library.port';

/** A readable request carrying the uploaded bytes (raw, or pre-parsed into a Buffer/string). */
interface UploadRequest extends AsyncIterable<Buffer | string> {
  body?: unknown;
}

/** Receives the bytes for a reserved media upload and stores them under the ticket's storage key. */
@Controller()
export class MediaUploadController {
  constructor(private readonly media: MediaLibrary) {}

  @Put('media')
  @HttpCode(200)
  @RequirePermissions({ content: ['update'] })
  async upload(
    @Req() req: UploadRequest,
    @Query('key') key: string,
    @Headers('content-type') contentType?: string,
  ): Promise<{ ok: true }> {
    const body = await readRawBody(req);
    await this.media.putObject(key, body, contentType || 'application/octet-stream');
    return { ok: true };
  }
}

/** Read the raw request bytes, tolerating a body parser having already buffered them. */
async function readRawBody(req: UploadRequest): Promise<Buffer> {
  if (Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === 'string') {
    return Buffer.from(req.body);
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
