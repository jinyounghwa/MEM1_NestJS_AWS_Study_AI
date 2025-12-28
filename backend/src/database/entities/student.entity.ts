import { Entity, PrimaryColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { LearningSession } from './learning-session.entity';

@Entity('students')
export class Student {
  @PrimaryColumn('varchar', { length: 255 })
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => LearningSession, (session) => session.student)
  sessions!: LearningSession[];
}
