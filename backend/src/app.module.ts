import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { NestJSAWSLearnModule } from './modules/nestjs-aws-learn/nestjs-aws-learn.module';

@Module({
  imports: [DatabaseModule, NestJSAWSLearnModule],
})
export class AppModule {}
