import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { getModel } from "@/lib/providers";
import { buildInterviewSystemPrompt } from "@/lib/interview/system-prompt";

export async function POST(req: Request) {
  const { messages, clientName }: { messages: UIMessage[]; clientName?: string } = await req.json();

  const system = await buildInterviewSystemPrompt(clientName);

  const result = streamText({
    model: getModel(),
    system,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    // Default is `() => 'An error occurred.'`. This is an internal tool
    // talking to a local CLI, so surfacing the real message (e.g. "Not
    // logged in") is more useful than hiding it.
    onError: (error) => (error instanceof Error ? error.message : "An error occurred."),
  });
}
