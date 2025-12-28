import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Student } from './student.entity';
import { ConversationMessage } from './conversation-message.entity';

@Entity('learning_sessions')
export class LearningSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 255 })
  userId!: string;

  @Column('text', { array: true })
  topics!: string[];

  @Column('int', { default: 0 })
  currentTopicIndex!: number;

  @Column('text', { nullable: true })
  currentIS!: string;

  @Column('json', { nullable: true })
  topicISHistory!: Record<string, string>;

  @Column('int', { default: 0 })
  stepCount!: number;

  @Column('boolean', { default: true })
  rolePlayMode!: boolean;

  @Column('boolean', { default: false })
  networkVisualizationMode!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Student, (student) => student.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', referencedColumnName: 'userId' })
  student!: Student;

  @OneToMany(() => ConversationMessage, (message) => message.session)
  conversationHistory!: ConversationMessage[];
}
