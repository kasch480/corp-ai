import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatWindow, type Msg } from "@/components/chat-window";

// Bestehender Chat — Verlauf serverseitig laden (RLS gibt nur eigene Chats frei).
export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: chat } = await supabase
    .from("chats")
    .select("id")
    .eq("id", id)
    .single();

  if (!chat) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("role, content")
    .eq("chat_id", id)
    .order("created_at", { ascending: true });

  const { data: prompts } = await supabase
    .from("prompts")
    .select("id, title, body")
    .order("created_at", { ascending: false });

  return (
    <ChatWindow
      chatId={id}
      initialMessages={(messages as Msg[]) ?? []}
      prompts={prompts ?? []}
    />
  );
}
