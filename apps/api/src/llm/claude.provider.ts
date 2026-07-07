import { BadRequestException, Injectable } from "@nestjs/common";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { LlmProvider } from "./llm.types";

const URL_RE = /https?:\/\/\S+/i;

@Injectable()
export class ClaudeProvider implements LlmProvider {
  readonly name = "claude";

  constructor() {
    // Accept the CLAUDE_OAUTH_TOKEN name; the SDK reads CLAUDE_CODE_OAUTH_TOKEN.
    if (
      process.env.CLAUDE_OAUTH_TOKEN &&
      !process.env.CLAUDE_CODE_OAUTH_TOKEN
    ) {
      process.env.CLAUDE_CODE_OAUTH_TOKEN = process.env.CLAUDE_OAUTH_TOKEN;
    }
  }

  async generate(system: string, prompt: string): Promise<string> {
    // Only grant web tools (and the extra permissions they need) when the
    // prompt actually references a URL — the no-URL case never gets tools.
    const needsWeb = URL_RE.test(prompt);

    let raw = "";
    try {
      for await (const message of query({
        prompt,
        options: {
          // A single turn is too tight even for plain-text generation — the
          // model can spend a turn on internal reasoning before finalizing.
          // URL fetching needs more headroom still (fetch, then generate).
          maxTurns: needsWeb ? 6 : 3,
          allowedTools: needsWeb ? ["WebFetch", "WebSearch"] : [],
          ...(needsWeb && {
            permissionMode: "bypassPermissions",
            allowDangerouslySkipPermissions: true,
          }),
          systemPrompt: system,
        },
      })) {
        if (message.type === "result" && message.subtype === "success") {
          raw = message.result;
        }
      }
    } catch (err) {
      // The SDK throws (rather than yielding an error message) when the
      // agent can't finish — e.g. it couldn't reach the page in time.
      throw new BadRequestException(
        `Claude couldn't finish generating from that content: ${
          err instanceof Error ? err.message : "unknown error"
        }. Try a different URL or paste the content directly.`,
      );
    }
    return raw;
  }
}
