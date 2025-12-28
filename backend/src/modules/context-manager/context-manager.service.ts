import { Injectable } from '@nestjs/common';
import {
  ConversationState,
  Message,
  NetworkDiagram,
} from './types/conversation.types';

@Injectable()
export class ContextManagerService {
  private sessions = new Map<string, ConversationState>();

  /**
   * 새 학습 세션 초기화
   */
  initSession(userId: string, topics: string | string[]): void {
    const topicArray = Array.isArray(topics) ? topics : [topics];

    this.sessions.set(userId, {
      currentIS: '',
      currentTopic: topicArray[0],
      allTopics: topicArray,
      currentTopicIndex: 0,
      topicISHistory: new Map(),
      conversationHistory: [],
      lastAIResponse: '',
      stepCount: 0,
      rolePlayMode: true,
      networkVisualizationMode: false,
    });
  }

  /**
   * 다음 주제로 이동
   */
  moveToNextTopic(userId: string): boolean {
    const state = this.sessions.get(userId);
    if (!state) throw new Error('세션을 찾을 수 없습니다.');

    if (state.currentIS) {
      state.topicISHistory.set(state.currentTopic, state.currentIS);
    }

    if (state.currentTopicIndex < state.allTopics.length - 1) {
      state.currentTopicIndex++;
      state.currentTopic = state.allTopics[state.currentTopicIndex];
      state.currentIS = '';

      if (this.isNetworkTopic(state.currentTopic)) {
        state.networkVisualizationMode = true;
      }

      return true;
    }

    return false;
  }

  /**
   * 네트워크 관련 주제 판단
   */
  private isNetworkTopic(topic: string): boolean {
    const networkKeywords = [
      'VPC',
      'Subnet',
      'Security Group',
      'NACL',
      'Route',
      'Gateway',
      'Peering',
      'PrivateLink',
      'Endpoint',
    ];
    return networkKeywords.some((keyword) =>
      topic.toLowerCase().includes(keyword.toLowerCase()),
    );
  }

  /**
   * 이전 주제들의 IS 요약 가져오기
   */
  getPreviousTopicsSummary(userId: string): string {
    const state = this.sessions.get(userId);
    if (!state || state.currentTopicIndex === 0) return '';

    let summary = '\n\n**이전에 학습한 내용 요약:**\n';
    for (let i = 0; i < state.currentTopicIndex; i++) {
      const topic = state.allTopics[i];
      const is = state.topicISHistory.get(topic);
      if (is) {
        summary += `\n- ${topic}: ${is}`;
      }
    }
    return summary;
  }

  /**
   * MEM1 방식의 프롬프트 구성
   */
  buildPrompt(userId: string, userMessage: string): Message[] {
    const state = this.sessions.get(userId);

    if (!state) {
      throw new Error('세션을 찾을 수 없습니다. 먼저 학습을 시작하세요.');
    }

    const previousSummary = this.getPreviousTopicsSummary(userId);

    // System Prompt 동적 임포트 및 생성
    const { NESTJS_AWS_SYSTEM_PROMPT } = require('../nestjs-aws-learn/prompts/system-prompt');

    const systemContent = NESTJS_AWS_SYSTEM_PROMPT(
      state.currentTopic,
      state.currentIS,
      previousSummary,
      state.stepCount,
      state.allTopics,
      state.currentTopicIndex,
      state.rolePlayMode,
    );

    const systemPrompt: Message = {
      role: 'system',
      content: systemContent,
      timestamp: new Date(),
    };

    const userMsg: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    // MEM1 핵심: 과거 대화 제거, IS + 이전 요약 + 현재만 유지
    return [systemPrompt, userMsg];
  }

  /**
   * IS 추출 및 저장
   */
  extractAndSaveIS(userId: string, userMessage: string): boolean {
    const isMatch = userMessage.match(/<IS>([\s\S]*?)<\/IS>/i);

    if (isMatch) {
      const state = this.sessions.get(userId)!;
      state.currentIS = isMatch[1].trim();
      state.stepCount += 1;

      state.conversationHistory.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      });

      return true;
    }

    const state = this.sessions.get(userId)!;
    state.conversationHistory.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    });

    return false;
  }

  /**
   * AI 응답 저장
   */
  saveAIResponse(userId: string, response: string): void {
    const state = this.sessions.get(userId)!;
    state.lastAIResponse = response;
    state.conversationHistory.push({
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    });
  }

  /**
   * 네트워크 다이어그램 저장
   */
  saveNetworkDiagram(userId: string, diagram: NetworkDiagram): void {
    const state = this.sessions.get(userId)!;
    state.currentNetworkDiagram = diagram;
  }

  /**
   * 현재 상태 조회
   */
  getState(userId: string): ConversationState | undefined {
    return this.sessions.get(userId);
  }

  /**
   * 학습 진행 상황 조회
   */
  getProgress(userId: string) {
    const state = this.sessions.get(userId);
    if (!state) return null;

    return {
      currentTopic: state.currentTopic,
      currentIndex: state.currentTopicIndex,
      totalTopics: state.allTopics.length,
      completedTopics: state.allTopics.slice(0, state.currentTopicIndex),
    };
  }

  /**
   * 마크다운 파일 생성
   */
  generateMarkdown(userId: string): string {
    const state = this.sessions.get(userId);

    if (!state) {
      throw new Error('세션을 찾을 수 없습니다.');
    }

    const isMultiObjective = state.allTopics.length > 1;

    let markdown = `# ☁️ NestJS + AWS 학습 노트${isMultiObjective ? ' (Multi-Objective)' : ''}\n\n`;

    if (isMultiObjective) {
      markdown += `## 📚 학습 주제\n\n`;
      state.allTopics.forEach((topic, idx) => {
        const status =
          idx < state.currentTopicIndex ? '✅' : idx === state.currentTopicIndex ? '🔄' : '⏳';
        markdown += `${idx + 1}. ${status} ${topic}\n`;
      });
      markdown += `\n`;
    } else {
      markdown += `**주제**: ${state.currentTopic}\n\n`;
    }

    markdown += `**생성 일시**: ${new Date().toLocaleString('ko-KR')}\n`;
    markdown += `**총 학습 단계**: ${state.stepCount}단계\n\n`;
    markdown += `---\n\n`;

    if (isMultiObjective) {
      state.allTopics.forEach((topic, topicIdx) => {
        markdown += `## 📖 주제 ${topicIdx + 1}: ${topic}\n\n`;

        const topicIS = state.topicISHistory.get(topic);
        if (topicIS) {
          markdown += `### ✅ 최종 이해 요약\n\n`;
          markdown += `<IS>${topicIS}</IS>\n\n`;
        }

        markdown += `---\n\n`;
      });
    } else {
      let stepNum = 1;
      for (let i = 0; i < state.conversationHistory.length; i++) {
        const msg = state.conversationHistory[i];

        if (msg.role === 'user') {
          const hasIS = /<IS>([\s\S]*?)<\/IS>/i.test(msg.content);

          if (hasIS) {
            markdown += `## 📝 Step ${stepNum}: 나의 이해\n\n`;
            markdown += `${msg.content}\n\n`;
          } else {
            markdown += `### 💬 질문/응답\n\n`;
            markdown += `${msg.content}\n\n`;
          }
        } else if (msg.role === 'assistant') {
          markdown += `### 🤖 AI 피드백\n\n`;
          markdown += `${msg.content}\n\n`;
          markdown += `---\n\n`;

          if (i > 0 && state.conversationHistory[i - 1].role === 'user') {
            const prevHasIS = /<IS>([\s\S]*?)<\/IS>/i.test(
              state.conversationHistory[i - 1].content,
            );
            if (prevHasIS) stepNum++;
          }
        }
      }
    }

    markdown += `\n## ✅ 학습 완료!\n\n`;

    if (isMultiObjective) {
      markdown += `총 ${state.allTopics.length}개의 주제를 ${state.stepCount}단계로 나누어 학습했습니다.\n\n`;
      markdown += `**학습한 주제들의 연결고리**:\n`;
      state.allTopics.forEach((topic, idx) => {
        const is = state.topicISHistory.get(topic) || '(요약 없음)';
        markdown += `${idx + 1}. **${topic}**: ${is.substring(0, 100)}...\n`;
      });
    } else {
      markdown += `총 ${state.stepCount}단계의 학습을 완료했습니다.`;
    }

    markdown += `\n\n수고하셨습니다! 🎉\n`;

    return markdown;
  }
}
