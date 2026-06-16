import { createClient } from "@/lib/supabase/server";
import { ChatWindow } from "@/components/chat-window";

// Neuer Chat — leerer Verlauf, aber Prompts der Bibliothek verfügbar.
export default async function NewChatPage() {
  const supabase = await createClient();
  const { data: prompts } = await supabase
    .from("prompts")
    .select("id, title, body")
    .order("created_at", { ascending: false });

  return <ChatWindow initialMessages={[]} prompts={prompts ?? []} />;
}
