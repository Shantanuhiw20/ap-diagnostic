import { StudioWorkspace } from "@/components/studio/StudioWorkspace";

export default async function ChatPage({ searchParams }: PageProps<"/chat">) {
  const params = await searchParams;
  const rawClient = params.client;

  const clientName =
    typeof rawClient === "string" && rawClient.trim()
      ? rawClient.trim()
      : undefined;

  return (
    <StudioWorkspace
      initialSection="interview"
      initialClientName={clientName}
    />
  );
}


