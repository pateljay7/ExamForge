import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { LlmProvider } from './llm/llm.types';
import { ClaudeProvider } from './llm/claude.provider';
import { GeminiProvider } from './llm/gemini.provider';

export interface GeneratedQuestion {
  text: string;
  options: string[]; // exactly 4
  correctIndex: number; // 0-3
}

const SYSTEM =
  'You are an exam author. You only ever output a raw JSON array of MCQ objects.';

@Injectable()
export class AiService {
  private readonly providers: Record<string, LlmProvider>;

  constructor(claude: ClaudeProvider, gemini: GeminiProvider) {
    // Adapter registry — add a provider here, nothing else changes.
    this.providers = { claude, gemini };
  }

  private provider(name?: string): LlmProvider {
    return this.providers[name ?? 'claude'] ?? this.providers.claude;
  }

  // Split `count` questions across weighted sections, then generate each set.
  async generateForSections(
    sections: { content: string; weight: number }[],
    count: number,
    difficulty: string,
    providerName?: string,
  ): Promise<(GeneratedQuestion & { sectionIndex: number })[]> {
    const counts = this.distribute(
      sections.map((s) => s.weight),
      count,
    );
    const all: (GeneratedQuestion & { sectionIndex: number })[] = [];
    for (let i = 0; i < sections.length; i++) {
      if (counts[i] > 0) {
        const qs = await this.generateQuestions(
          sections[i].content,
          counts[i],
          difficulty,
          [],
          providerName,
        );
        all.push(...qs.map((q) => ({ ...q, sectionIndex: i })));
      }
    }
    return all;
  }

  // Proportional allocation of `count` across weights, remainder to heaviest.
  private distribute(weights: number[], count: number): number[] {
    const total = weights.reduce((a, b) => a + b, 0) || 1;
    const counts = weights.map((w) => Math.floor((count * w) / total));
    let remaining = count - counts.reduce((a, b) => a + b, 0);
    const byWeightDesc = weights
      .map((w, i) => ({ i, w }))
      .sort((a, b) => b.w - a.w);
    for (let k = 0; remaining > 0; k = (k + 1) % byWeightDesc.length) {
      counts[byWeightDesc[k].i]++;
      remaining--;
    }
    return counts;
  }

  async generateQuestions(
    content: string,
    count: number,
    difficulty: string,
    avoid: string[] = [],
    providerName?: string,
  ): Promise<GeneratedQuestion[]> {
    // If `content` references a URL, the provider itself is given web tools
    // (Claude: WebFetch/WebSearch; Gemini: URL context grounding) and reads
    // it directly — no server-side scraping here.
    const avoidBlock = avoid.length
      ? `\nDo NOT repeat or closely paraphrase any of these existing questions:\n${avoid
          .map((t) => `- ${t}`)
          .join('\n')}\n`
      : '';
    const prompt = `From the study content below, write ${count} multiple-choice questions at ${difficulty} difficulty.
Rules:
- Exactly 4 options per question.
- Exactly one correct option.
- Base every question strictly on the provided content.${avoidBlock}
Return ONLY a JSON array, no prose, no markdown fences, shaped like:
[{"text":"...","options":["a","b","c","d"],"correctIndex":0}]

CONTENT:
${content}`;

    const raw = await this.provider(providerName).generate(SYSTEM, prompt);

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
