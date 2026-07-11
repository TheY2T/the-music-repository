import { Module } from '@nestjs/common';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { CurrentUser } from './application/current-user';
import { AuthController } from './auth.controller';
import { auth } from './better-auth';
import { BetterAuthCurrentUser } from './infrastructure/better-auth-current-user';

/**
 * Wires Better Auth at the presentation edge and exposes the domain-capability `CurrentUser` port.
 * Better Auth mounts `/api/auth/*` and manages body parsing (NestFactory runs with `bodyParser: false`).
 */
@Module({
  imports: [
    BetterAuthModule.forRoot({
      auth,
      isGlobal: true,
      // Public catalogue + health must stay anonymous; routes opt into auth via @RequireAuth /
      // @RequirePermissions rather than a global guard.
      disableGlobalAuthGuard: true,
      // We configure CORS once at the app level (main.ts) from TRUSTED_ORIGINS.
      disableTrustedOriginsCors: true,
    }),
  ],
  controllers: [AuthController],
  providers: [{ provide: CurrentUser, useClass: BetterAuthCurrentUser }],
  exports: [CurrentUser],
})
export class AuthModule {}
