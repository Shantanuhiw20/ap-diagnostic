import { streamText } from "ai";
import { getModel } from "@/lib/providers";
import { buildReviewSystemPrompt } from "@/lib/report/system-prompt";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { reportText }: { reportText: string } = await req.json();

  const system = await buildReviewSystemPrompt();

  const result = streamText({
    model: getModel(),
    system,
    messages: [
      {
        role: "user",
        content: reportText,
      },
    ],
    maxOutputTokens: 2048,
  });

  return result.toTextStreamResponse();
}
