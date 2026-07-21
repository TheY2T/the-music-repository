import { Controller, Get, NotFoundException, Query, StreamableFile } from '@nestjs/common';
import { MediaLibrary } from './application/ports/media-library.port';

/** Serves stored media bytes to the browser. `presignGetUrl` hands out `/media?key=<storageKey>`. */
@Controller()
export class MediaController {
  constructor(private readonly media: MediaLibrary) {}

  @Get('media')
  async download(@Query('key') key?: string): Promise<StreamableFile> {
    const object = key ? await this.media.getObject(key) : null;
    if (!object) {
      throw new NotFoundException();
    }
    return new StreamableFile(Buffer.from(object.data), { type: object.mime });
  }
}
