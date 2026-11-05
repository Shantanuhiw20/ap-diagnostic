import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModelV4 } from "@ai-sdk/provider";

const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

/**
 * Direct Anthropic API access for Vercel and cloud deployments.
 * Uses AI_MODEL if configured, otherwise defaults to claude-sonnet-4-20250514.
 */
export function createAnthropicModel(): LanguageModelV4 {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "AI_PROVIDER=anthropic requires ANTHROPIC_API_KEY to be set in environment variables.",
    );
  }

  const modelId = process.env.AI_MODEL || DEFAULT_ANTHROPIC_MODEL;
  const anthropic = createAnthropic({ apiKey });
  return anthropic(modelId);
}

