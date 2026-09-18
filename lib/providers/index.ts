import type { LanguageModelV4 } from "@ai-sdk/provider";
import { claudeCliModel } from "./claude-cli";
import { createAnthropicModel } from "./anthropic";

/**
 * The one place that decides which backend actually answers a request.
 * Every route imports this instead of a specific provider, so AI_PROVIDER
 * is the only thing that needs to change to swap backends everywhere at
 * once.
 *
 *   AI_PROVIDER unset, or "claude-cli"  -> the local Claude Code CLI
 *   AI_PROVIDER=anthropic               -> the Anthropic API directly
 */
export function getModel(): LanguageModelV4 {
  const provider = process.env.AI_PROVIDER;

  if (provider === "anthropic") {
    return createAnthropicModel();
  }

  if (provider && provider !== "claude-cli") {
    throw new Error(`Unknown AI_PROVIDER "${provider}". Expected "claude-cli" (default) or "anthropic".`);
  }

  return claudeCliModel;
}
