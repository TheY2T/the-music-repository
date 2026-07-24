import { Module } from '@nestjs/common';
import { AppleDomainAssociationController } from './apple-domain-association.controller';

/** Presentation-only endpoints served under `/.well-known/*` (domain-verification documents). */
@Module({
  controllers: [AppleDomainAssociationController],
})
export class WellKnownModule {}
