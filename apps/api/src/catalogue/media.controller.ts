import {
  Controller,
  Get,
  NotFoundException,
  Query,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { MediaLibrary } from './application/ports/media-library.port';

/** Just the request/response surface this controller touches (structural — avoids an express import). */
interface ConditionalRequest {
  headers: Record<string, string | string[] | undefined>;
}
interface CacheableResponse {
  status(code: number): unknown;
  setHeader(name: string, value: string): unknown;
}

/** Serves stored media bytes to the browser. `presignGetUrl` hands out `/media?key=<storageKey>`. */
@Controller()
export class MediaController {
  constructor(private readonly media: MediaLibrary) {}

  @Get('media')
  async download(
    @Req() req: ConditionalRequest,
    @Res({ passthrough: true }) res: CacheableResponse,
    @Query('key') key?: string,
  ): Promise<StreamableFile | undefined> {
    const object = key ? await this.media.getObject(key) : null;
    if (!object) {
      throw new NotFoundException();
    }

    // A stored key's bytes change only on re-upload, so cache for an hour and let the edge serve stale
    // while it revalidates. The validators make a repeat fetch a cheap 304 rather than a full re-download.
    const lastModified = object.updatedAt.toUTCString();
    const etag = `W/"${object.bytes}-${object.updatedAt.getTime()}"`;
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.setHeader('ETag', etag);
    res.setHeader('Last-Modified', lastModified);

    const ifNoneMatch = req.headers['if-none-match'];
    const ifModifiedSince = req.headers['if-modified-since'];
    if (ifNoneMatch === etag || ifModifiedSince === lastModified) {
      res.status(304);
      return undefined;
    }

    return new StreamableFile(Buffer.from(object.data), { type: object.mime });
  }
}
