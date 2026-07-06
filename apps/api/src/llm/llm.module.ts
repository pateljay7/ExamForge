import { Module } from '@nestjs/common';
import { AiService } from '../ai.service';
import { ClaudeProvider } from './claude.provider';
import { GeminiProvider } from './gemini.provider';

@Module({
  providers: [AiService, ClaudeProvider, GeminiProvider],
  exports: [AiService],
})
export class LlmModule {}
