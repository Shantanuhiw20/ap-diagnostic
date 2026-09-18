import { spawn } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline";
import type {
  LanguageModelV4,
  LanguageModelV4CallOptions,
  LanguageModelV4Message,
  LanguageModelV4StreamPart,
  LanguageModelV4TextPart,
} from "@ai-sdk/provider";

/**
 * A single turn in the conversation, in the shape this provider actually
 * needs: just a role and flattened text. Anything richer (tool calls, files)
 * is not meaningful here since the CLI runs with --allowed-tools "".
 */
export interface ClaudeCliMessage {
  role: "user" | "assistant";
  text: string;
}

// Never let the subprocess inherit credentials for a different provider.
// This provider authenticates however the `claude` CLI itself is logged in,
// not via these env vars.
const STRIPPED_ENV_KEYS = [
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_AUTH_TOKEN",
  "OPENROUTER_API_KEY",
];

// Quote a single argument for a manually-built cmd.exe command line. An
// empty string must still become a visible, non-empty token ("") or it
// disappears entirely when the line is split into words.
function quoteWindowsArg(arg: string): string {
  if (arg === "") return '""';
  if (/[\s"]/.test(arg)) return `"${arg.replace(/"/g, '\\"')}"`;
  return arg;
}

function formatConversation(conversation: ClaudeCliMessage[]): string {
  return conversation
    .map((m) => `${m.role === "user" ? "Human" : "Assistant"}: ${m.text}`)
    .join("\n\n");
}

type ParsedLine =
  | { kind: "delta"; text: string }
  | { kind: "result"; isError: boolean; message?: string }
  | null;

function parseLine(line: string): ParsedLine {
  const trimmed = line.trim();
  if (!trimmed) return null;

  let event: unknown;
  try {
    event = JSON.parse(trimmed);
  } catch {
    // Partial/malformed line, ignore rather than crash the stream over it.
    return null;
  }
  if (typeof event !== "object" || event === null) return null;
  const obj = event as Record<string, unknown>;

  if (obj.type === "stream_event") {
    const streamEvent = obj.event as Record<string, unknown> | undefined;
    if (streamEvent?.type === "content_block_delta") {
      const delta = streamEvent.delta as Record<string, unknown> | undefined;
      const text = delta?.text;
      if (typeof text === "string") return { kind: "delta", text };
    }
    return null;
  }

  if (obj.type === "result") {
    return {
      kind: "result",
      isError: Boolean(obj.is_error),
      message: typeof obj.result === "string" ? obj.result : undefined,
    };
  }

  // Includes the final `assistant` event: a complete, non-partial repeat of
  // everything the stream_event deltas already sent. Ignoring it here is
  // what stops every reply arriving twice.
  return null;
}

/**
 * The one function this provider is built around: spawn the Claude Code CLI
 * in print mode, hand it a system prompt and a conversation, and yield the
 * assistant's reply as text arrives. Swapping to a different backend later
 * means writing a new function with this same shape, not touching the chat
 * route.
 */
export async function* runClaudeCli(
  systemPrompt: string,
  conversation: ClaudeCliMessage[],
): AsyncGenerator<string> {
  const workDir = await mkdtemp(join(tmpdir(), "ey-fin-os-claude-cli-"));
  const systemPromptFile = join(workDir, "system-prompt.txt");

  try {
    await writeFile(systemPromptFile, systemPrompt, "utf8");

    const env = { ...process.env };
    for (const key of STRIPPED_ENV_KEYS) delete env[key];

    // The `claude` CLI is an npm global install, so it lives in npm's global
    // bin directory, which is not guaranteed to be on this process's own
    // PATH (it depends entirely on how *this* server process itself got
    // started, not on whether `claude` is on PATH in some other terminal).
    // Make sure it's findable regardless.
    if (process.platform === "win32") {
      const candidateDirs = [
        process.env.APPDATA ? join(process.env.APPDATA, "npm") : null,
        dirname(process.execPath), // node.exe's own directory
      ].filter((dir): dir is string => Boolean(dir));

      const pathKey = Object.keys(env).find((k) => k.toLowerCase() === "path") ?? "Path";
      const existing = env[pathKey] ?? "";
      const existingParts = existing.split(";");
      const toAdd = candidateDirs.filter((dir) => !existingParts.includes(dir));
      if (toAdd.length > 0) {
        env[pathKey] = [...toAdd, existing].filter(Boolean).join(";");
      }
    }

    const cliArgs = [
      "-p",
      "--system-prompt-file",
      systemPromptFile,
      "--allowed-tools",
      "",
      "--output-format",
      "stream-json",
      "--verbose",
      "--include-partial-messages",
    ];

    // On Windows "claude" resolves through a .cmd shim, which needs a shell
    // to run at all. But Node's spawn(cmd, args, {shell:true}) does NOT
    // escape each array element when shell is true, it only concatenates
    // them with spaces (Node emits DEP0190 for exactly this). An empty
    // string argument like the "" for --allowed-tools above then vanishes
    // entirely from the command line, silently shifting every argument
    // after it, "--output-format" ends up consumed as the value of
    // "--allowed-tools" instead of being its own flag. Building the whole
    // command as one pre-quoted string sidesteps that: passed this way,
    // Node hands the string to the shell as-is instead of re-joining args.
    const child =
      process.platform === "win32"
        ? spawn(["claude", ...cliArgs.map(quoteWindowsArg)].join(" "), {
            cwd: workDir,
            env,
            shell: true,
          })
        : spawn("claude", cliArgs, { cwd: workDir, env });

    // State the 'error'/'line'/'close' handlers below all mutate, bundled into
    // one object. (A generator's suspend/resume at `yield` confuses plain
    // `let` narrowing across these closures; an object property doesn't.)
    // Declared before any listener is registered so there's no window where a
    // handler could fire before `state.wake` exists.
    const state: {
      spawnError: Error | null;
      stderr: string;
      queue: string[];
      yieldedAny: boolean;
      lastResult: { isError: boolean; message?: string } | null;
      closed: boolean;
      wake: () => void;
    } = {
      spawnError: null,
      stderr: "",
      queue: [],
      yieldedAny: false,
      lastResult: null,
      closed: false,
      wake: () => {},
    };

    // A process that fails to spawn at all (bad PATH, missing binary) only
    // ever emits 'error', never 'close'. Track it explicitly so the loop
    // below can throw instead of waiting forever on stdout that never comes.
    child.once("error", (err) => {
      state.spawnError = new Error(`Failed to start the Claude Code CLI: ${err.message}`);
      state.wake();
    });

    // Writing to stdin of a process that never started can throw EPIPE;
    // the 'error' handler above is what actually reports the failure.
    child.stdin.on("error", () => {});
    child.stdin.write(formatConversation(conversation));
    child.stdin.end();

    child.stderr.on("data", (chunk) => {
      state.stderr += chunk;
    });

    const rl = createInterface({ input: child.stdout });

    rl.on("line", (line) => {
      const parsed = parseLine(line);
      if (parsed?.kind === "delta") {
        state.queue.push(parsed.text);
        state.yieldedAny = true;
      } else if (parsed?.kind === "result") {
        state.lastResult = parsed;
      }
      state.wake();
    });

    child.once("close", () => {
      state.closed = true;
      state.wake();
    });

    try {
      while (true) {
        if (state.spawnError) throw state.spawnError;
        if (state.queue.length > 0) {
          yield state.queue.shift()!;
          continue;
        }
        if (state.closed) break;
        await new Promise<void>((resolve) => {
          state.wake = resolve;
        });
      }

      if (state.spawnError) throw state.spawnError;

      if (!state.yieldedAny) {
        if (state.lastResult?.isError) {
          throw new Error(`Claude Code CLI error: ${state.lastResult.message ?? "unknown error"}`);
        }
        if (!state.lastResult) {
          throw new Error(
            `Claude Code CLI exited with no output.${state.stderr ? ` stderr: ${state.stderr.trim().slice(0, 500)}` : ""}`,
          );
        }
      }
    } finally {
      rl.close();
      if (child.exitCode === null && !child.killed) child.kill();
    }
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

function flattenText(parts: Array<LanguageModelV4TextPart | { type: string }>): string {
  return parts
    .filter((part): part is LanguageModelV4TextPart => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

function toClaudeCliInput(prompt: LanguageModelV4Message[]): {
  systemPrompt: string;
  conversation: ClaudeCliMessage[];
} {
  let systemPrompt = "";
  const conversation: ClaudeCliMessage[] = [];

  for (const message of prompt) {
    if (message.role === "system") {
      systemPrompt += (systemPrompt ? "\n\n" : "") + message.content;
      continue;
    }
    if (message.role === "user") {
      const text = flattenText(message.content);
      if (text) conversation.push({ role: "user", text });
      continue;
    }
    if (message.role === "assistant") {
      const text = flattenText(message.content);
      if (text) conversation.push({ role: "assistant", text });
      continue;
    }
    // 'tool' role messages don't apply: this provider runs with
    // --allowed-tools "" and never produces or receives tool calls.
  }

  return { systemPrompt, conversation };
}

/**
 * The swappable unit: a LanguageModelV4 that routes generation through the
 * local Claude Code CLI instead of an HTTP API. The chat route only ever
 * imports this export; replacing it with a real API-backed provider later
 * (e.g. from @ai-sdk/openai) means changing this file, not the route.
 */
export const claudeCliModel: LanguageModelV4 = {
  specificationVersion: "v4",
  provider: "claude-cli",
  modelId: "claude-code-cli",
  supportedUrls: {},

  async doGenerate() {
    throw new Error("claude-cli provider only supports streaming (doStream), not doGenerate.");
  },

  async doStream(options: LanguageModelV4CallOptions) {
    const { systemPrompt, conversation } = toClaudeCliInput(options.prompt);
    const textId = "claude-cli-text-0";

    const stream = new ReadableStream<LanguageModelV4StreamPart>({
      async start(controller) {
        controller.enqueue({ type: "stream-start", warnings: [] });
        controller.enqueue({ type: "text-start", id: textId });

        try {
          for await (const delta of runClaudeCli(systemPrompt, conversation)) {
            controller.enqueue({ type: "text-delta", id: textId, delta });
          }
          controller.enqueue({ type: "text-end", id: textId });
          controller.enqueue({
            type: "finish",
            finishReason: { unified: "stop", raw: undefined },
            usage: {
              inputTokens: { total: undefined, noCache: undefined, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: undefined, text: undefined, reasoning: undefined },
            },
          });
          controller.close();
        } catch (err) {
          controller.enqueue({ type: "error", error: err });
          controller.close();
        }
      },
    });

    return { stream };
  },
};
