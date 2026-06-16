"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createInvitation(formData: FormData) {
  const email = (formData.get("email") as string)?.trim() || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet" };

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) return { error: "Kein Workspace" };

  const { data: inv, error } = await supabase
    .from("invitations")
    .insert({ workspace_id: membership.workspace_id, created_by: user.id, email })
    .select("token")
    .single();

  if (error || !inv) return { error: "Einladung konnte nicht erstellt werden" };

  const h = await headers();
  const host = h.get("host") ?? "localhost:3003";
  const proto = host.startsWith("localhost") ? "http" : "https";

  revalidatePath("/team");
  return { link: `${proto}://${host}/einladung/${inv.token}` };
}

export async function deleteInvitation(id: string) {
  const supabase = await createClient();
  await supabase.from("invitations").delete().eq("id", id);
  revalidatePath("/team");
}

export async function removeMember(userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id === userId) return;

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership || membership.role !== "owner") return;

  await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", membership.workspace_id)
    .eq("user_id", userId);

  revalidatePath("/team");
}
