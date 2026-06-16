import { createClient } from "@/lib/supabase/server";
import { KnowledgeBase } from "@/components/knowledge-base";

export default async function WissenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: documents } = user
    ? await supabase
        .from("documents")
        .select("id, name, size, created_at")
        .order("created_at", { ascending: false })
    : { data: [] };

  return <KnowledgeBase documents={documents ?? []} />;
}
