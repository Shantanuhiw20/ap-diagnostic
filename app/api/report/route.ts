import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { getModel } from "@/lib/providers";
import { buildReportSystemPrompt } from "@/lib/report/system-prompt";
import { AP_CHECKLIST_FIELDS } from "@/lib/ap-diagnostic-data";

export const maxDuration = 90;

export async function POST(req: Request) {
  const {
    messages,
    clientName,
    checklistOverrides,
  }: {
    messages: UIMessage[];
    clientName?: string;
    checklistOverrides?: Record<string, string>;
  } = await req.json();

  const system = await buildReportSystemPrompt(clientName);
  const transcript = await convertToModelMessages(messages);

  const overrideLines = checklistOverrides
    ? Object.entries(checklistOverrides)
        .filter(([, val]) => val && val.trim().length > 0)
        .map(([fieldId, val]) => {
          const spec = AP_CHECKLIST_FIELDS.find((f) => f.field_id === fieldId);
          return `- [${fieldId}] ${spec?.shortLabel ?? fieldId}: ${val.trim()}`;
        })
    : [];

  const overrideBlock =
    overrideLines.length > 0
      ? `\n\nAdditional structured checklist inputs confirmed by the client:\n${overrideLines.join("\n")}`
      : "";

  const result = streamText({
    model: getModel(),
    system,
    messages: [
      ...transcript,
      {
        role: "user",
        content:
          `The interview above is complete.${overrideBlock}\n\nProduce the full diagnostic report now, following the instructions and shape given in the system prompt exactly.`,
      },
    ],
    maxOutputTokens: 8192,
  });

  return result.toTextStreamResponse();
}

