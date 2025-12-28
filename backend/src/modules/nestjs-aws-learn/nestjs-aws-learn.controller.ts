import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Res,
  HttpStatus,
  HttpException,
  Delete,
} from '@nestjs/common';
import { Response } from 'express';
import { ContextManagerService } from '../context-manager/context-manager.service';
import { GemmaService } from '../gemma/gemma.service';
import { LearningSessionService } from './learning-session.service';
import { ChatResponse } from '../context-manager/types/conversation.types';

@Controller('api/nestjs-aws-learn')
export class NestJSAWSLearnController {
  constructor(
    private contextManager: ContextManagerService,
    private gemma: GemmaService,
    private sessionService: LearningSessionService,
  ) {}

  /**
   * 학습 시작 - 초기 AI 설명 생성 포함
   */
  @Post('start')
  async startLearning(@Body() body: { userId: string; topics: string | string[] }) {
    const { userId, topics } = body;

    const topicsArray = Array.isArray(topics) ? topics : [topics];
    const isMultiObjective = topicsArray.length > 1;

    // 메모리에 세션 초기화
    this.contextManager.initSession(userId, topicsArray);

    // DB에 세션 저장
    const dbSession = await this.sessionService.createSession(userId, topicsArray);

    // 초기 AI 설명 생성
    const initialPrompt = this.contextManager.buildPrompt(userId, '학습을 시작해주세요');
    const initialAIResponse = await this.gemma.chat(
      initialPrompt.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    );

    // AI 응답을 메모리와 DB에 저장
    this.contextManager.saveAIResponse(userId, initialAIResponse);
    await this.sessionService.saveMessage(dbSession.id, 'assistant', initialAIResponse);

    return {
      success: true,
      sessionId: dbSession.id,
      message: isMultiObjective
        ? `"${topicsArray.join(' → ')}" 순서로 학습을 시작합니다!`
        : `"${topicsArray[0]}" 학습을 시작합니다!`,
      initialMessage: initialAIResponse,
      instruction:
        'AI의 설명을 듣고 <IS>여기에 요약</IS> 형식으로 작성해주세요.',
      isMultiObjective,
      totalTopics: topicsArray.length,
      userId,
    };
  }

  /**
   * 사용자의 모든 이전 세션 조회
   */
  @Get('sessions/:userId')
  async getPreviousSessions(@Param('userId') userId: string) {
    try {
      const sessions = await this.sessionService.getUserSessions(userId);

      const sessionsWithMetadata = await Promise.all(
        sessions.map(async (session) => {
          const messageCount = await this.sessionService.getSessionMessageCount(session.id);
          return {
            id: session.id,
            topics: session.topics,
            currentTopic: session.topics[session.currentTopicIndex],
            currentTopicIndex: session.currentTopicIndex,
            totalTopics: session.topics.length,
            stepCount: session.stepCount,
            messageCount,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
          };
        }),
      );

      return {
        success: true,
        userId,
        sessions: sessionsWithMetadata,
      };
    } catch (error) {
      const err = error as any;
      throw new HttpException(
        err.message || '세션 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 이전 세션 재개
   */
  @Post('resume/:sessionId')
  async resumeSession(@Param('sessionId') sessionId: string, @Body() body: { userId: string }) {
    try {
      const { userId } = body;
      const session = await this.sessionService.getSessionById(sessionId);

      if (!session) {
        throw new HttpException('세션을 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
      }

      if (session.userId !== userId) {
        throw new HttpException('권한이 없습니다.', HttpStatus.FORBIDDEN);
      }

      // 메모리에 세션 로드
      this.contextManager.initSession(userId, session.topics);
      const state = this.contextManager.getState(userId)!;
      state.currentTopicIndex = session.currentTopicIndex;
      state.currentIS = session.currentIS || '';
      state.stepCount = session.stepCount;
      // Record to Map 변환
      if (session.topicISHistory) {
        for (const [key, value] of Object.entries(session.topicISHistory)) {
          state.topicISHistory.set(key, value);
        }
      }

      return {
        success: true,
        sessionId,
        message: `"${session.topics.join(' → ')}" 세션을 재개합니다.`,
        topics: session.topics,
        currentTopic: session.topics[session.currentTopicIndex],
        currentTopicIndex: session.currentTopicIndex,
        totalTopics: session.topics.length,
      };
    } catch (error) {
      const err = error as any;
      throw new HttpException(
        err.message || '세션 재개 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 대화 진행 - 스트리밍 응답
   */
  @Post('chat/stream')
  async chatStream(
    @Body() body: { userId: string; sessionId?: string; message: string; rolePlayMode?: boolean },
    @Res() res: Response,
  ) {
    const { userId, sessionId, message, rolePlayMode } = body;

    try {
      // 1. IS 추출
      const hasIS = this.contextManager.extractAndSaveIS(userId, message);

      // 2. 역할극 모드 설정
      const state = this.contextManager.getState(userId);
      if (state) {
        state.rolePlayMode = rolePlayMode ?? true;
      }

      // 3. 프롬프트 구성
      const prompt = this.contextManager.buildPrompt(userId, message);

      // 4. 스트리밍 응답 설정
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');

      // 5. Gemma MLX 호출 (스트리밍)
      const aiResponse = await this.gemma.chat(
        prompt.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      );

      // 응답 스트리밍
      res.write(aiResponse);

      // 6. 응답 저장
      this.contextManager.saveAIResponse(userId, aiResponse);

      // 7. DB에 메시지 저장
      if (sessionId) {
        await this.sessionService.saveMessage(sessionId, 'user', message);
        await this.sessionService.saveMessage(sessionId, 'assistant', aiResponse);

        const currentState = this.contextManager.getState(userId);
        if (currentState) {
          const historyRecord: Record<string, string> = {};
          for (const [key, value] of currentState.topicISHistory.entries()) {
            historyRecord[key] = value;
          }

          await this.sessionService.updateSession(sessionId, {
            currentIS: currentState.currentIS,
            stepCount: currentState.stepCount,
            currentTopicIndex: currentState.currentTopicIndex,
            topicISHistory: historyRecord,
          });
        }
      }

      // 8. 메타데이터 추가 (마지막에)
      const progress = this.contextManager.getProgress(userId);
      const metadata = { progress };
      res.write('\n' + JSON.stringify(metadata));

      res.end();
    } catch (error) {
      const err = error as any;
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: err.message || '대화 처리 중 오류가 발생했습니다.',
      });
    }
  }

  /**
   * 대화 진행 (레거시)
   */
  @Post('chat')
  async chat(
    @Body() body: { userId: string; sessionId?: string; message: string },
  ): Promise<ChatResponse> {
    const { userId, sessionId, message } = body;

    try {
      // 1. IS 추출
      const hasIS = this.contextManager.extractAndSaveIS(userId, message);

      // 2. 프롬프트 구성 (MEM1)
      const prompt = this.contextManager.buildPrompt(userId, message);

      // 3. Gemma MLX 호출
      const aiResponse = await this.gemma.chat(
        prompt.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      );

      // 4. 응답 저장
      this.contextManager.saveAIResponse(userId, aiResponse);

      // 5. DB에 메시지 저장 (sessionId가 있는 경우)
      if (sessionId) {
        await this.sessionService.saveMessage(sessionId, 'user', message);
        await this.sessionService.saveMessage(sessionId, 'assistant', aiResponse);

        // 세션 상태 업데이트
        const state = this.contextManager.getState(userId);
        if (state) {
          // Map to Record 변환
          const historyRecord: Record<string, string> = {};
          for (const [key, value] of state.topicISHistory.entries()) {
            historyRecord[key] = value;
          }

          await this.sessionService.updateSession(sessionId, {
            currentIS: state.currentIS,
            stepCount: state.stepCount,
            currentTopicIndex: state.currentTopicIndex,
            topicISHistory: historyRecord,
          });
        }
      }

      // 6. 상태 조회
      const state = this.contextManager.getState(userId);
      const progress = this.contextManager.getProgress(userId);

      // 7. 다음 주제 이동 처리
      let movedToNext = false;
      let nextTopicMessage = '';

      if (hasIS && aiResponse.includes('다음') && progress) {
        if (message.toLowerCase().includes('다음')) {
          movedToNext = this.contextManager.moveToNextTopic(userId);
          if (movedToNext) {
            const newProgress = this.contextManager.getProgress(userId);
            if (newProgress) {
              nextTopicMessage = `\n\n✨ ${newProgress.currentTopic} 주제로 넘어갑니다!`;
            }
          }
        }
      }

      return {
        response: aiResponse + nextTopicMessage,
        hasIS: hasIS,
        tip: hasIS
          ? progress && progress.currentIndex < progress.totalTopics - 1
            ? '✅ 훌륭합니다! "다음 주제"라고 입력하면 다음으로 넘어갑니다.'
            : '✅ 모든 주제를 완료했습니다! 마크다운을 다운로드하세요.'
          : '💡 <IS>태그로 요약해야 다음 단계로 진행됩니다.',
        currentStep: state?.stepCount || 0,
        progress: progress || undefined,
      };
    } catch (error) {
      const err = error as any;
      throw new HttpException(
        err.message || '대화 처리 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 마크다운 다운로드
   */
  @Get('export/:userId')
  async exportMarkdown(
    @Param('userId') userId: string,
    @Res() res: Response,
  ) {
    try {
      const markdown = this.contextManager.generateMarkdown(userId);
      const state = this.contextManager.getState(userId);

      const filename = `nestjs-aws-study-${state?.currentTopic || 'export'}-${Date.now()}.md`;

      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.status(HttpStatus.OK).send(markdown);
    } catch (error) {
      const err = error as any;
      throw new HttpException(
        err.message || '마크다운 생성 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 세션의 메시지 조회
   */
  @Get('session/:sessionId/messages')
  async getSessionMessages(@Param('sessionId') sessionId: string) {
    try {
      const messages = await this.sessionService.getSessionMessages(sessionId);

      return {
        success: true,
        sessionId,
        messages: messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        })),
      };
    } catch (error) {
      const err = error as any;
      throw new HttpException(
        err.message || '메시지 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 세션 삭제
   */
  @Delete('session/:sessionId')
  async deleteSession(
    @Param('sessionId') sessionId: string,
    @Body() body: { userId: string },
  ) {
    try {
      const { userId } = body;
      const session = await this.sessionService.getSessionById(sessionId);

      if (!session) {
        throw new HttpException('세션을 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
      }

      if (session.userId !== userId) {
        throw new HttpException('권한이 없습니다.', HttpStatus.FORBIDDEN);
      }

      // 세션의 모든 메시지 삭제 (자동으로 처리됨 - cascade delete)
      await this.sessionService.deleteSession(sessionId);

      return {
        success: true,
        message: '세션이 삭제되었습니다.',
        sessionId,
      };
    } catch (error) {
      const err = error as any;
      throw new HttpException(
        err.message || '세션 삭제 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Gemma MLX 상태 확인
   */
  @Get('health')
  async healthCheck() {
    const isHealthy = await this.gemma.healthCheck();

    return {
      status: isHealthy ? 'ok' : 'error',
      gemma: isHealthy ? 'connected' : 'disconnected',
      model: 'mlx-community/gemma-2-2b-it-4bit',
      mlx: 'enabled',
      optimized: true,
      timestamp: new Date().toISOString(),
    };
  }
}
