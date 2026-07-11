import { Module } from '@nestjs/common';
import { DemoErrorController } from './demo-error.controller';

@Module({ controllers: [DemoErrorController] })
export class DemoModule {}
