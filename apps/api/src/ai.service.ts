import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { query } from '@anthropic-ai/claude-agent-sdk';

export interface GeneratedQuestion {
  text: string;
  options: string[]; // exactly 4
  correctIndex: number; // 0-3
}

@Injectable()
export class AiService {
  constructor() {
    // Accept the CLAUDE_OAUTH_TOKEN name the spec used; the SDK reads CLAUDE_CODE_OAUTH_TOKEN.
    if (process.env.CLAUDE_OAUTH_TOKEN && !process.env.CLAUDE_CODE_OAUTH_TOKEN) {
      process.env.CLAUDE_CODE_OAUTH_TOKEN = process.env.CLAUDE_OAUTH_TOKEN;
    }
  }

  async generateQuestions(
    content: string,
    count: number,
    difficulty: string,
  ): Promise<GeneratedQuestion[]> {
    const prompt = `From the study content below, write ${count} multiple-choice questions at ${difficulty} difficulty.
Rules:
- Exactly 4 options per question.
- Exactly one correct option.
- Base every question strictly on the provided content.
Return ONLY a JSON array, no prose, no markdown fences, shaped like:
[{"text":"...","options":["a","b","c","d"],"correctIndex":0}]

CONTENT:
${content}`;

    let raw = '';
    for await (const message of query({
      prompt,
      options: {
        maxTurns: 1,
        allowedTools: [], // no file/tool access — one-shot generation
        systemPrompt:
          'You are an exam author. You only ever output a raw JSON array of MCQ objects.',
      },
    })) {
      if (message.type === 'result' && message.subtype === 'success') {
        raw = message.result;
      }
    }

    const questions = this.parse(raw);
    if (!questions.length) {
      throw new InternalServerErrorException('AI returned no usable questions');
    }
    return questions;
  }

  private parse(raw: string): GeneratedQuestion[] {
    if (!raw) return [];
    // Strip markdown fences and grab the JSON array if surrounded by prose.
    let text = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start !== -1 && end !== -1) text = text.slice(start, end + 1);

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return [];
    }
    if (!Array.isArray(data)) return [];

    return data
      .filter(
        (q: any) =>
          q &&
          typeof q.text === 'string' &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          Number.isInteger(q.correctIndex) &&
          q.correctIndex >= 0 &&
          q.correctIndex <= 3,
      )
      .map((q: any) => ({
        text: q.text,
        options: q.options.map(String),
        correctIndex: q.correctIndex,
      }));
  }
}
