import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Res,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { ContextManagerService } from '../context-manager/context-manager.service';
import { GemmaService } from '../gemma/gemma.service';
import { ChatResponse } from '../context-manager/types/conversation.types';

@Controller('api/nestjs-aws-learn')
export class NestJSAWSLearnController {
  constructor(
    private contextManager: ContextManagerService,
    private gemma: GemmaService,
  ) {}

  /**
   * 학습 시작
   */
  @Post('start')
  startLearning(@Body() body: { userId: string; topics: string | string[] }) {
    const { userId, topics } = body;

    const topicsArray = Array.isArray(topics) ? topics : [topics];
    const isMultiObjective = topicsArray.length > 1;

    this.contextManager.initSession(userId, topicsArray);

    return {
      success: true,
      message: isMultiObjective
        ? `"${topicsArray.join(' → ')}" 순서로 학습을 시작합니다!`
        : `"${topicsArray[0]}" 학습을 시작합니다!`,
      instruction:
        'AI의 설명을 듣고 <IS>여기에 요약</IS> 형식으로 작성해주세요.',
      isMultiObjective,
      totalTopics: topicsArray.length,
      userId,
    };
  }

  /**
   * 대화 진행
   */
  @Post('chat')
  async chat(
    @Body() body: { userId: string; message: string },
  ): Promise<ChatResponse> {
    const { userId, message } = body;

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

      // 5. 상태 조회
      const state = this.contextManager.getState(userId);
      const progress = this.contextManager.getProgress(userId);

      // 6. 다음 주제 이동 처리
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
   * Gemma MLX 상태 확인
   */
  @Get('health')
  async healthCheck() {
    const isHealthy = await this.gemma.healthCheck();

    return {
      status: isHealthy ? 'ok' : 'error',
      gemma: isHealthy ? 'connected' : 'disconnected',
      model: 'mlx-community/gemma-2-9b-it-4bit',
      mlx: 'enabled',
      timestamp: new Date().toISOString(),
    };
  }
}
