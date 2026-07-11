import { Controller, Get } from '@nestjs/common';
import { TrackNotFoundError } from './track-not-found.error';

/**
 * Reference endpoint proving the platform: throwing a pure domain error yields an RFC 9457
 * problem+json 404 (via the ProblemDetails filter), an ERROR-status span, and a single error log —
 * all sharing one traceId.
 */
@Controller('demo')
export class DemoErrorController {
  @Get('error')
  raise(): never {
    throw new TrackNotFoundError('demo-track-123');
  }
}
