import { PlatformModule } from '@TheY2T/tmr-nest-platform';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AttemptsModule } from './attempts/attempts.module';
import { AuthModule } from './auth/auth.module';
import { AuthoringModule } from './authoring/authoring.module';
import { BillingModule } from './billing/billing.module';
import { CatalogueModule } from './catalogue/catalogue.module';
import { ClassroomsModule } from './classrooms/classrooms.module';
import { CollectionsModule } from './collections/collections.module';
import { validateEnv } from './config/env';
import { DemoModule } from './demo/demo.module';
import { EntitlementsModule } from './entitlements/entitlements.module';
import { FavoritesModule } from './favorites/favorites.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { HealthModule } from './health/health.module';
import { HelpModule } from './help/help.module';
import { I18nModule } from './i18n/i18n.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { ProgressModule } from './progress/progress.module';
import { ProgressionsModule } from './progressions/progressions.module';
import { RedemptionModule } from './redemption/redemption.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SupportModule } from './support/support.module';
import { TranslationsModule } from './translations/translations.module';

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
    EntitlementsModule,
    BillingModule,
    RedemptionModule,
    AuthoringModule,
    FavoritesModule,
    CollectionsModule,
    ClassroomsModule,
    ProgressModule,
    ProgressionsModule,
    HelpModule,
    ReviewsModule,
    AttemptsModule,
    I18nModule,
    TranslationsModule,
    SupportModule,
  ],
})
export class AppModule {}
