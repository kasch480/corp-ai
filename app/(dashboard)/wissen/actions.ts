"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function chunkText(text: string, size = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end).trim());
    if (end === text.length) break;
    start += size - overlap;
  }
  return chunks.filter((c) => c.length > 30);
}

async function extractText(buffer: ArrayBuffer, filename: string): Promise<string> {
  const isPdf = filename.toLowerCase().endsWith(".pdf");
  if (isPdf) {
    const pdfParse = await import("pdf-parse");
    const parse = (pdfParse as unknown as { default: typeof pdfParse }).default ?? pdfParse;
    const data = await parse(Buffer.from(buffer));
    return data.text;
  }
  return new TextDecoder().decode(buffer);
}

export async function uploadDocument(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) return { error: "Keine Datei ausgewählt" };

  const allowed = ["application/pdf", "text/plain", "text/markdown"];
  if (!allowed.includes(file.type) && !file.name.endsWith(".md")) {
    return { error: "Nur PDF, TXT und MD-Dateien erlaubt" };
  }

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

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({
      workspace_id: membership.workspace_id,
      user_id: user.id,
      name: file.name,
      size: file.size,
    })
    .select("id")
    .single();
  if (docError || !doc) return { error: "Dokument konnte nicht gespeichert werden" };

  try {
    const buffer = await file.arrayBuffer();
    const text = await extractText(buffer, file.name);
    const chunks = chunkText(text);

    if (chunks.length > 0) {
      await supabase.from("document_chunks").insert(
        chunks.map((content) => ({
          document_id: doc.id,
          workspace_id: membership.workspace_id,
          content,
        }))
      );
    }
  } catch {
    // Text-Extraktion fehlgeschlagen — Dokument bleibt erhalten
  }

  revalidatePath("/wissen");
  return { success: true };
}

export async function deleteDocument(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("documents").delete().eq("id", id);
  revalidatePath("/wissen");
}
