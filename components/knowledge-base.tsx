"use client";

import { useRef, useState } from "react";
import { uploadDocument, deleteDocument } from "@/app/(dashboard)/wissen/actions";

type Doc = { id: string; name: string; size: number; created_at: string };

function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function KnowledgeBase({ documents }: { documents: Doc[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex h-dvh flex-1 flex-col bg-white">
      <div className="border-b border-zinc-200 px-8 py-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Wissen</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Lade Dokumente hoch — die KI kann im Chat Fragen dazu beantworten.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <form
            ref={formRef}
            action={async (fd) => {
              if (submittingRef.current) return;
              submittingRef.current = true;
              setUploading(true);
              setError(null);
              const result = await uploadDocument(fd);
              submittingRef.current = false;
              setUploading(false);
              if (result?.error) {
                setError(result.error);
              } else {
                formRef.current?.reset();
              }
            }}
            className="rounded-xl border-2 border-dashed border-zinc-300 p-6 text-center"
          >
            <p className="mb-3 text-sm text-zinc-500">
              PDF, TXT oder MD hochladen (max. 10 MB)
            </p>
            <input
              name="file"
              type="file"
              accept=".pdf,.txt,.md,text/plain,application/pdf"
              required
              className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-teal-700 hover:file:bg-teal-100"
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={uploading}
              className="mt-3 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
            >
              {uploading ? "Wird verarbeitet…" : "Hochladen"}
            </button>
          </form>

          {documents.length === 0 ? (
            <p className="text-sm text-zinc-400">Noch keine Dokumente hochgeladen.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                {documents.length} Dokument{documents.length !== 1 ? "e" : ""}
              </p>
              {documents.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{d.name}</p>
                    <p className="text-xs text-zinc-400">{fileSize(d.size)}</p>
                  </div>
                  <form action={deleteDocument.bind(null, d.id)}>
                    <button type="submit" className="text-xs text-zinc-400 hover:text-red-600">
                      Löschen
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
