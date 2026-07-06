import { Injectable } from '@nestjs/common';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { LlmProvider } from './llm.types';

@Injectable()
export class ClaudeProvider implements LlmProvider {
  readonly name = 'claude';

  constructor() {
    // Accept the CLAUDE_OAUTH_TOKEN name; the SDK reads CLAUDE_CODE_OAUTH_TOKEN.
    if (process.env.CLAUDE_OAUTH_TOKEN && !process.env.CLAUDE_CODE_OAUTH_TOKEN) {
      process.env.CLAUDE_CODE_OAUTH_TOKEN = process.env.CLAUDE_OAUTH_TOKEN;
    }
  }

  async generate(system: string, prompt: string): Promise<string> {
    let raw = '';
    for await (const message of query({
      prompt,
      options: {
        maxTurns: 1,
        allowedTools: [], // no file/tool access — one-shot generation
        systemPrompt: system,
      },
    })) {
      if (message.type === 'result' && message.subtype === 'success') {
        raw = message.result;
      }
    }
    return raw;
  }
}
