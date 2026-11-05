import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV4 } from "@ai-sdk/provider";
import { createAnthropicModel } from "./anthropic";
import { builtInApDiagnosticModel } from "./ap-diagnostic-engine";

const DEFAULT_OPENAI_MODEL = "gpt-4o";

/**
 * Resolves the AI model provider for Vercel & local environments:
 * 1. Explicit AI_PROVIDER="anthropic" or ANTHROPIC_API_KEY present -> Anthropic API
 * 2. Explicit AI_PROVIDER="openai" or OPENAI_API_KEY present       -> OpenAI API
 * 3. Otherwise (or AI_PROVIDER="built-in")                         -> Built-in EY AP Diagnostic Engine
 *    (Zero-config serverless fallback so Vercel deployments work out of the box)
 */
export function getModel(): LanguageModelV4 {
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (provider === "anthropic") {
    return createAnthropicModel();
  }

  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("AI_PROVIDER=openai requires OPENAI_API_KEY to be set.");
    }
    const openai = createOpenAI({ apiKey });
    return openai(process.env.AI_MODEL || DEFAULT_OPENAI_MODEL);
  }

  if (provider === "built-in") {
    return builtInApDiagnosticModel;
  }

  // Auto-detect based on configured API keys in Vercel environment
  if (process.env.ANTHROPIC_API_KEY) {
    return createAnthropicModel();
  }

  if (process.env.OPENAI_API_KEY) {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return openai(process.env.AI_MODEL || DEFAULT_OPENAI_MODEL);
  }

  return builtInApDiagnosticModel;
}

