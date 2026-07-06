// Adapter contract — every LLM provider is a black box that turns
// (system prompt, user prompt) into raw text. Core question-generation
// logic in AiService never changes when a provider is added.
export interface LlmProvider {
  readonly name: string; // 'claude' | 'gemini'
  generate(system: string, prompt: string): Promise<string>;
}

export const LLM_PROVIDERS = [
  { id: 'claude', label: 'Claude (Anthropic)' },
  { id: 'gemini', label: 'Gemini (Google)' },
];
