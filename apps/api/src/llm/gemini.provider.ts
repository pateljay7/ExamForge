import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { LlmProvider } from './llm.types';

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
    const res = await this.ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: system,
        responseMimeType: 'application/json',
      },
    });
    return res.text ?? '';
  }
}
