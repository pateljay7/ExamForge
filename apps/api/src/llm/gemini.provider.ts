import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { LlmProvider } from './llm.types';

const URL_RE = /https?:\/\/\S+/i;

@Injectable()
export class GeminiProvider implements LlmProvider {
  readonly name = 'gemini';
  private client: GoogleGenAI | null = null;

  private get ai(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException(
        'Gemini is not configured — set GEMINI_API_KEY on the server.',
      );
    }
    if (!this.client) this.client = new GoogleGenAI({ apiKey });
    return this.client;
  }

  async generate(system: string, prompt: string): Promise<string> {
    // Only ground on the URL (Google-hosted fetch) when the prompt actually
    // references one — the common no-URL case is unaffected.
    const needsWeb = URL_RE.test(prompt);

    try {
      const res = await this.ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: system,
          responseMimeType: 'application/json',
          ...(needsWeb && { tools: [{ urlContext: {} }] }),
        },
      });
      return res.text ?? '';
    } catch (err) {
      if (needsWeb) {
        throw new BadRequestException(
          `Gemini couldn't finish generating from that content: ${
            err instanceof Error ? err.message : 'unknown error'
          }. Try a different URL or paste the content directly.`,
        );
      }
      throw err;
    }
  }
}
