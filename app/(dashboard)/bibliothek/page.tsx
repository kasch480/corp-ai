import { createClient } from "@/lib/supabase/server";
import { PromptLibrary } from "@/components/prompt-library";

export default async function BibliothekPage() {
  const supabase = await createClient();

  // RLS gibt nur Prompts des eigenen Workspace frei.
  const { data: prompts } = await supabase
    .from("prompts")
    .select("id, title, body")
    .order("created_at", { ascending: false });

  return <PromptLibrary prompts={prompts ?? []} />;
}
