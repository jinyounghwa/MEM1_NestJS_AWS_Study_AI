import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContextManagerModule } from '../context-manager/context-manager.module';
import { GemmaModule } from '../gemma/gemma.module';
import { NestJSAWSLearnController } from './nestjs-aws-learn.controller';
import { LearningSessionService } from './learning-session.service';
import { LearningSession, ConversationMessage, Student } from '../../database/entities';

@Module({
  imports: [
    ContextManagerModule,
    GemmaModule,
    TypeOrmModule.forFeature([Student, LearningSession, ConversationMessage]),
  ],
  controllers: [NestJSAWSLearnController],
  providers: [LearningSessionService],
})
export class NestJSAWSLearnModule {}
