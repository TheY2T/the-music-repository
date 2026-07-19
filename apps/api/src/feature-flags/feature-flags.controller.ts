import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { FeatureFlagCatalogue } from './application/ports/feature-flag-catalogue.port';

/** Structural request/response shapes (avoids an express import). */
interface ConditionalRequest {
  headers: Record<string, string | string[] | undefined>;
}
interface CacheableResponse {
  status(code: number): unknown;
  setHeader(name: string, value: string): unknown;
}

/**
 * Public feature-flag read path (ADR 0035). Serves the evaluatable per-environment snapshot the web SSR
 * provider (`@TheY2T/tmr-flags-eval` `HttpSnapshotSource`) loads per request. Ungated. The per-environment
 * ETag lets the web layer skip re-downloading an unchanged snapshot (conditional GET → 304).
 */
@Controller('feature-flags')
export class FeatureFlagController {
  constructor(private readonly catalogue: FeatureFlagCatalogue) {}

  @Get('environments')
  async environments() {
    return { items: await this.catalogue.environments() };
  }

  @Get('snapshot/:env')
  async snapshot(
    @Param('env') env: string,
    @Req() req: ConditionalRequest,
    @Res({ passthrough: true }) res: CacheableResponse,
  ) {
    const snapshot = await this.catalogue.snapshot(env);
    const etag = `"${snapshot.version}"`;
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    if (req.headers['if-none-match'] === etag) {
      res.status(304);
      return undefined;
    }
    return snapshot;
  }
}
