"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Setzt das aktive Modell für den Workspace (nur Owner per RLS).
export async function updateModel(modelId: string) {
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

  await supabase
    .from("workspaces")
    .update({ model: modelId })
    .eq("id", membership.workspace_id);

  revalidatePath("/einstellungen");
}
