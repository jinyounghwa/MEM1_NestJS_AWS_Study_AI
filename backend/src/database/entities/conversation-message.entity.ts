import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LearningSession } from './learning-session.entity';

@Entity('conversation_messages')
export class ConversationMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  sessionId!: string;

  @Column('enum', { enum: ['user', 'assistant'] })
  role!: 'user' | 'assistant';

  @Column('text')
  content!: string;

  @CreateDateColumn()
  timestamp!: Date;

  @ManyToOne(() => LearningSession, (session) => session.conversationHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sessionId' })
  session!: LearningSession;
}
