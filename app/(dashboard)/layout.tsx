import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Workspace des Nutzers (erste Mitgliedschaft)
  let { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id, workspaces(name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  // Noch kein Workspace → jetzt anlegen (Firmenname aus den Registrierungs-Metadaten).
  if (!membership) {
    const company =
      (user.user_metadata?.company as string | undefined) ||
      user.email?.split("@")[0] ||
      "Mein Workspace";
    await supabase.rpc("create_workspace", { workspace_name: company });

    const reload = await supabase
      .from("workspace_members")
      .select("workspace_id, workspaces(name)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    membership = reload.data;
  }

  if (!membership) redirect("/login");

  const workspaceName =
    (membership.workspaces as unknown as { name: string } | null)?.name ?? "Workspace";

  // Chats für die Sidebar — nur die eigenen des Nutzers
  const { data: chats } = await supabase
    .from("chats")
    .select("id, title")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex">
      <Sidebar workspaceName={workspaceName} chats={chats ?? []} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
