import { createClient } from "@/lib/supabase/server";
import { MODELS, isAvailable, DEFAULT_MODEL_ID } from "@/lib/models";
import { ModelPicker } from "@/components/model-picker";

export default async function EinstellungenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id, workspaces(model)")
    .eq("user_id", user!.id)
    .limit(1)
    .maybeSingle();

  const current =
    (membership?.workspaces as unknown as { model: string } | null)?.model ??
    DEFAULT_MODEL_ID;

  // Nur serialisierbare Daten an die Client-Komponente geben.
  const models = MODELS.map((m) => ({
    id: m.id,
    label: m.label,
    provider: m.provider,
    region: m.region,
    available: isAvailable(m),
    envVar: m.envVar,
  }));

  return <ModelPicker current={current} models={models} />;
}
