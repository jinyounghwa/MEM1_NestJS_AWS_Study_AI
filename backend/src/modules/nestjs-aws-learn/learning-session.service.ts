import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningSession, ConversationMessage, Student } from '../../database/entities';

@Injectable()
export class LearningSessionService {
  constructor(
    @InjectRepository(LearningSession)
    private sessionRepository: Repository<LearningSession>,
    @InjectRepository(ConversationMessage)
    private messageRepository: Repository<ConversationMessage>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  /**
   * 새 학습 세션을 DB에 생성
   */
  async createSession(
    userId: string,
    topics: string[],
  ): Promise<LearningSession> {
    // Student 존재 여부 확인, 없으면 생성
    let student = await this.studentRepository.findOne({
      where: { userId },
    });

    if (!student) {
      student = this.studentRepository.create({
        userId,
      });
      await this.studentRepository.save(student);
    }

    const session = this.sessionRepository.create({
      userId,
      topics,
      currentTopicIndex: 0,
      currentIS: '',
      topicISHistory: {},
      stepCount: 0,
      rolePlayMode: true,
      networkVisualizationMode: false,
    });

    return this.sessionRepository.save(session);
  }

  /**
   * 사용자의 모든 세션 조회
   */
  async getUserSessions(userId: string): Promise<LearningSession[]> {
    return this.sessionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['conversationHistory'],
    });
  }

  /**
   * 특정 세션 상세 조회
   */
  async getSessionById(sessionId: string): Promise<LearningSession | null> {
    return this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['conversationHistory'],
    });
  }

  /**
   * 세션 업데이트
   */
  async updateSession(sessionId: string, data: Partial<LearningSession>): Promise<LearningSession> {
    await this.sessionRepository.update(sessionId, data);
    return this.getSessionById(sessionId) as Promise<LearningSession>;
  }

  /**
   * 대화 메시지 저장
   */
  async saveMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
  ): Promise<ConversationMessage> {
    const message = this.messageRepository.create({
      sessionId,
      role,
      content,
    });

    return this.messageRepository.save(message);
  }

  /**
   * 세션의 모든 메시지 조회
   */
  async getSessionMessages(sessionId: string): Promise<ConversationMessage[]> {
    return this.messageRepository.find({
      where: { sessionId },
      order: { timestamp: 'ASC' },
    });
  }

  /**
   * 세션 삭제
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.sessionRepository.delete(sessionId);
  }

  /**
   * 세션의 최근 메시지 개수 조회
   */
  async getSessionMessageCount(sessionId: string): Promise<number> {
    return this.messageRepository.count({
      where: { sessionId },
    });
  }
}
