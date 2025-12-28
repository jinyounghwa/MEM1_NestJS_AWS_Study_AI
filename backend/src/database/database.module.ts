import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student, LearningSession, ConversationMessage } from './entities';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'nestjs_aws_learn',
      entities: [Student, LearningSession, ConversationMessage],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    TypeOrmModule.forFeature([Student, LearningSession, ConversationMessage]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
