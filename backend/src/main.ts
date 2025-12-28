import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 설정
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  const PORT = process.env.PORT || 3001;

  await app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    🚀 NestJS AWS Learning Tutor System (MEM1 Based)          ║
║                                                              ║
║    ☁️  Backend running on: http://localhost:${PORT}         ║
║    🧠 LLM: Gemma 3 4B IT (MLX)                              ║
║    💾 Memory: MEM1 (Constant Memory Management)              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
  });
}

bootstrap();
