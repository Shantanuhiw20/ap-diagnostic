import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { getModel } from "@/lib/providers";
import { buildReportSystemPrompt } from "@/lib/report/system-prompt";

// Report generation reads a lot of context and writes a long, structured
// document, give it real headroom to actually finish once this is deployed
// behind a platform that enforces function timeouts.
export const maxDuration = 90;

export async function POST(req: Request) {
  const { messages, clientName }: { messages: UIMessage[]; clientName?: string } = await req.json();

  const system = await buildReportSystemPrompt(clientName);
  const transcript = await convertToModelMessages(messages);

  const result = streamText({
    model: getModel(),
    system,
    messages: [
      ...transcript,
      {
        role: "user",
        content:
          "The interview above is complete. Produce the full diagnostic report now, following the instructions and shape given in the system prompt exactly.",
      },
    ],
    // Generous on purpose: extended thinking shares this same output-token
    // budget on current Claude models, so a tight cap makes some runs finish
    // fine and others cut the report off mid-section for no obvious reason.
    //
    // Honest caveat: this only takes effect on the AI_PROVIDER=anthropic
    // path. The claude-cli provider does not forward it to the underlying
    // CLI process, `claude -p` has no equivalent flag (checked `claude
    // --help`, there's --max-budget-usd for spend, nothing for output
    // length). On that provider this setting is a no-op; if truncation
    // shows up while running on the CLI, this alone won't fix it.
    maxOutputTokens: 8192,
  });

  // Plain text stream, not the UI-message-chunk protocol: the report panel
  // just accumulates markdown text, it isn't a `useChat` conversation.
  return result.toTextStreamResponse();
}
