import { buildOpeningMessageText } from "@/lib/interview/opening-message";
import ChatClient from "./chat-client";

export default async function ChatPage({ searchParams }: PageProps<"/chat">) {
  const params = await searchParams;
  const rawClient = params.client;
  const rawPreset = params.preset;

  const clientName =
    typeof rawClient === "string" && rawClient.trim() ? rawClient.trim() : undefined;
  const preset =
    typeof rawPreset === "string" && rawPreset.trim() ? rawPreset.trim() : undefined;

  const openingText = await buildOpeningMessageText();

  return <ChatClient openingText={openingText} clientName={clientName} preset={preset} />;
}

