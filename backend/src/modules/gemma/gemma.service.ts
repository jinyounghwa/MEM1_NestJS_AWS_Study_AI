import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

interface GemmaMessage {
  role: string;
  content: string;
}

@Injectable()
export class GemmaService {
  private readonly mlxPath = 'mlx_lm.generate';
  private readonly modelName = 'mlx-community/gemma-2-9b-it-4bit';
  private readonly tempDir = '/tmp/gemma-chat';

  constructor() {
    this.initTempDir();
  }

  private async initTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  /**
   * Gemma 모델과 대화 (MLX 사용)
   */
  async chat(messages: GemmaMessage[]): Promise<string> {
    try {
      const prompt = this.formatPrompt(messages);

      const promptFile = path.join(this.tempDir, `prompt-${Date.now()}.txt`);
      await fs.writeFile(promptFile, prompt, 'utf-8');

      const command = `${this.mlxPath} --model ${this.modelName} --prompt "$(cat ${promptFile})" --max-tokens 1000 --temp 0.7 --top-p 0.9`;

      const { stdout, stderr } = await execAsync(command, {
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024,
      });

      await fs.unlink(promptFile).catch(() => {});

      if (stderr && !stderr.includes('Loading')) {
        console.error('Gemma stderr:', stderr);
      }

      const response = this.parseResponse(stdout);
      return response;
    } catch (error) {
      const err = error as any;
      if (err.code === 'ETIMEDOUT') {
        throw new HttpException(
          'Gemma 응답 시간이 초과되었습니다. 다시 시도해주세요.',
          HttpStatus.REQUEST_TIMEOUT,
        );
      }

      throw new HttpException(
        `Gemma API 오류: ${err.message || String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 메시지를 Gemma 프롬프트 형식으로 변환
   */
  private formatPrompt(messages: GemmaMessage[]): string {
    let prompt = '';

    for (const msg of messages) {
      if (msg.role === 'system') {
        prompt += `<start_of_turn>user\nSystem: ${msg.content}<end_of_turn>\n`;
      } else if (msg.role === 'user') {
        prompt += `<start_of_turn>user\n${msg.content}<end_of_turn>\n`;
      } else if (msg.role === 'assistant') {
        prompt += `<start_of_turn>model\n${msg.content}<end_of_turn>\n`;
      }
    }

    prompt += '<start_of_turn>model\n';
    return prompt;
  }

  /**
   * MLX 출력에서 응답 추출
   */
  private parseResponse(output: string): string {
    const lines = output.split('\n');
    const responseLines = lines.filter(
      (line) =>
        !line.includes('Loading') &&
        !line.includes('==========') &&
        !line.includes('Prompt:') &&
        line.trim().length > 0,
    );

    return responseLines.join('\n').trim();
  }

  /**
   * MLX 및 모델 상태 확인
   */
  async healthCheck(): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`${this.mlxPath} --help`);
      return stdout.includes('usage:');
    } catch {
      return false;
    }
  }

  /**
   * 모델 다운로드 (최초 1회)
   */
  async downloadModel(): Promise<void> {
    try {
      console.log('Downloading Gemma 2 9B IT Q4 model...');
      const command = `mlx_lm.generate --model ${this.modelName} --prompt "test" --max-tokens 1`;
      await execAsync(command, { timeout: 600000 });
      console.log('Model downloaded successfully');
    } catch (error) {
      const err = error as any;
      throw new Error(`Failed to download model: ${err.message || String(error)}`);
    }
  }
}
