import { Module } from '@nestjs/common';
import { ContextManagerModule } from '../context-manager/context-manager.module';
import { GemmaModule } from '../gemma/gemma.module';
import { NestJSAWSLearnController } from './nestjs-aws-learn.controller';

@Module({
  imports: [ContextManagerModule, GemmaModule],
  controllers: [NestJSAWSLearnController],
})
export class NestJSAWSLearnModule {}
