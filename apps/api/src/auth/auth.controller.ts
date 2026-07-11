import { Controller, Get } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { RequireAuth, RequirePermissions } from './require-permissions.decorator';

/**
 * Thin identity surface alongside Better Auth's own `/api/auth/*` routes.
 * `GET /me` proves the session round-trip; `GET /me/permissions/publish` is the RBAC smoke probe
 * (401 anonymous / 403 learner / 200 editor+admin).
 */
@Controller()
export class AuthController {
  @Get('me')
  @RequireAuth()
  me(@Session() session: UserSession): { user: UserSession['user'] } {
    return { user: session.user };
  }

  @Get('me/permissions/publish')
  @RequirePermissions({ content: ['publish'] })
  canPublish(): { allowed: true } {
    return { allowed: true };
  }
}
