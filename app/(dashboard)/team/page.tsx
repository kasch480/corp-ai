import { createClient } from "@/lib/supabase/server";
import { TeamManager } from "@/components/team-manager";

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) return null;

  const { data: members } = await supabase.rpc("get_workspace_members", {
    p_workspace_id: membership.workspace_id,
  });

  const { data: invitations } = await supabase
    .from("invitations")
    .select("id, email, token, expires_at")
    .eq("workspace_id", membership.workspace_id)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  return (
    <TeamManager
      members={members ?? []}
      invitations={invitations ?? []}
      currentUserId={user.id}
      isOwner={membership.role === "owner"}
    />
  );
}
