import 'reflect-metadata';
import './otel';
import { Logger as NestLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  // `bodyParser: false` is mandatory for Better Auth — the @thallesp module re-adds body parsing for
  // non-auth routes while keeping the raw body for `/api/auth/*`.
  const app = await NestFactory.create(AppModule, { bufferLogs: true, bodyParser: false });
  app.useLogger(app.get(PinoLogger));
  app.enableShutdownHooks();

  // Only serve traffic that arrives through the front door (custom domain via Cloudflare). Render's
  // default `*.onrender.com` URL bypasses Cloudflare (and its Access gate), so refuse it — except the
  // health check, which Render calls directly, and internal service-to-service calls (non-onrender host).
  app.use(
    (
      req: { headers: Record<string, string | undefined>; url?: string },
      res: { statusCode: number; end: (body?: string) => void },
      next: () => void,
    ) => {
      const host = (req.headers.host ?? '').split(':')[0] ?? '';
      const path = (req.url ?? '').split('?')[0];
      if (host.endsWith('.onrender.com') && path !== '/health') {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }
      next();
    },
  );

  const config = app.get(ConfigService);
  // Echo the exact allowed origins (not `*`) so credentialed requests can carry the auth cookie.
  const trustedOrigins = (config.get<string>('TRUSTED_ORIGINS') ?? 'http://localhost:4321')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: trustedOrigins, credentials: true });

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);

  NestLogger.log(`tmr-api listening on http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();
