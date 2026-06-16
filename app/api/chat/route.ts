import { type NextRequest } from "next/server";
import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getModel } from "@/lib/models";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const message: unknown = body?.message;
  let chatId: string | undefined = body?.chatId;

  if (typeof message !== "string" || !message.trim()) {
    return new Response("Bad request", { status: 400 });
  }

  // Workspace + gewähltes Modell
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id, workspaces(model)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) return new Response("Kein Workspace", { status: 400 });

  const modelId =
    (membership.workspaces as unknown as { model: string } | null)?.model ??
    "claude-sonnet-4-6";

  // IDOR-Schutz: ein übergebener chatId muss dem eingeloggten Nutzer gehören.
  // (RLS schützt vor fremden Workspaces; diese Prüfung zusätzlich vor fremden
  // Chats von Kollegen im selben Workspace.)
  if (chatId) {
    const { data: chat } = await supabase
      .from("chats")
      .select("id, user_id, workspace_id")
      .eq("id", chatId)
      .maybeSingle();
    if (
      !chat ||
      chat.user_id !== user.id ||
      chat.workspace_id !== membership.workspace_id
    ) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  // Neuen Chat anlegen, falls keiner übergeben
  if (!chatId) {
    const title = message.slice(0, 40);
    const { data: chat, error } = await supabase
      .from("chats")
      .insert({
        workspace_id: membership.workspace_id,
        user_id: user.id,
        title,
      })
      .select("id")
      .single();
    if (error || !chat) return new Response("Chat konnte nicht angelegt werden", { status: 500 });
    chatId = chat.id;
  }

  // User-Nachricht speichern
  await supabase.from("messages").insert({ chat_id: chatId, role: "user", content: message });

  // Verlauf laden
  const { data: history } = await supabase
    .from("messages")
    .select("role, content")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  const messages = (history ?? []).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content as string,
  }));

  // RAG: relevante Chunks aus der Wissensbasis laden
  let ragContext = "";
  if (message.trim().length > 3) {
    const { data: chunks } = await supabase
      .from("document_chunks")
      .select("content")
      .eq("workspace_id", membership.workspace_id)
      .textSearch("fts", message, { type: "plain", config: "german" })
      .limit(5);
    if (chunks && chunks.length > 0) {
      ragContext =
        "\n\nRelevante Informationen aus der Wissensbasis des Unternehmens:\n" +
        chunks.map((c, i) => `[${i + 1}] ${c.content}`).join("\n\n");
    }
  }

  const modelInfo = getModel(modelId);
  const encoder = new TextEncoder();
  const finalChatId: string = chatId!;

  const stream = new ReadableStream({
    async start(controller) {
      let full = "";
      try {
        const result = streamText({
          model: modelInfo.build(),
          system:
            "Du bist ein hilfreicher KI-Assistent für ein Unternehmen. Antworte klar und auf Deutsch." +
            ragContext,
          messages,
          abortSignal: req.signal,
        });

        for await (const chunk of result.textStream) {
          full += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch {
        controller.enqueue(encoder.encode("\n[Fehler bei der KI-Antwort]"));
      } finally {
        if (full) {
          await supabase
            .from("messages")
            .insert({ chat_id: finalChatId, role: "assistant", content: full });
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "x-chat-id": finalChatId,
    },
  });
}
