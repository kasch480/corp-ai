"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Legt einen Prompt im Workspace des Nutzers an.
export async function createPrompt(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const bodyText = String(formData.get("body") ?? "").trim();
  if (!title || !bodyText) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) return;

  await supabase.from("prompts").insert({
    workspace_id: membership.workspace_id,
    user_id: user.id,
    title,
    body: bodyText,
  });

  revalidatePath("/bibliothek");
}

// Löscht einen Prompt (RLS erlaubt nur dem Ersteller).
export async function deletePrompt(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("prompts").delete().eq("id", id);
  revalidatePath("/bibliothek");
}
