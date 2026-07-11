import { PlatformModule } from '@TheY2T/tmr-nest-platform';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CatalogueModule } from './catalogue/catalogue.module';
import { validateEnv } from './config/env';
import { DemoModule } from './demo/demo.module';
import { FeatureFlagsModule } from './flags/feature-flags.module';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './infrastructure/database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      // Load the repo-root .env first, then a local override if present.
      envFilePath: ['../../.env', '.env'],
    }),
    // Cross-cutting platform: logging, tracing, request context, Zod validation,
    // and the RFC 9457 Problem Details exception filter (§8–§9 of the plan).
    PlatformModule,
    DatabaseModule,
    AuthModule,
    FeatureFlagsModule,
    HealthModule,
    DemoModule,
    CatalogueModule,
  ],
})
export class AppModule {}
