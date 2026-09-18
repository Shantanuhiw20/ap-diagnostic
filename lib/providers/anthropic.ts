import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModelV4 } from "@ai-sdk/provider";

/**
 * Direct Anthropic API access: the alternative to the local CLI provider,
 * selected via AI_PROVIDER=anthropic (see ./index.ts). Needs no API key on
 * the machine's CLI login, just ANTHROPIC_API_KEY and a real model id in
 * the environment.
 */
export function createAnthropicModel(): LanguageModelV4 {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "AI_PROVIDER=anthropic requires ANTHROPIC_API_KEY to be set (see .env.local).",
    );
  }

  const modelId = process.env.AI_MODEL;
  if (!modelId) {
    throw new Error(
      "AI_PROVIDER=anthropic requires AI_MODEL to be set to a real model id, e.g. claude-sonnet-5 (see .env.local).",
    );
  }

  const anthropic = createAnthropic({ apiKey });
  return anthropic(modelId);
}
