"use client";

import { useRef } from "react";
import { createPrompt, deletePrompt } from "@/app/(dashboard)/bibliothek/actions";

type P = { id: string; title: string; body: string };

export function PromptLibrary({ prompts }: { prompts: P[] }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex h-dvh flex-1 flex-col bg-white">
      <div className="border-b border-zinc-200 px-8 py-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Bibliothek</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Gespeicherte Prompts für dein Team — einmal anlegen, immer wiederverwenden.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Neuen Prompt anlegen */}
          <form
            ref={formRef}
            action={async (fd) => {
              await createPrompt(fd);
              formRef.current?.reset();
            }}
            className="space-y-2 rounded-xl border border-zinc-200 p-4"
          >
            <input
              name="title"
              required
              placeholder="Titel (z.B. Angebots-E-Mail schreiben)"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            />
            <textarea
              name="body"
              required
              rows={3}
              placeholder="Prompt-Text…"
              className="w-full resize-none rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            />
            <button
              type="submit"
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              Prompt speichern
            </button>
          </form>

          {/* Liste */}
          {prompts.length === 0 ? (
            <p className="text-sm text-zinc-400">Noch keine Prompts gespeichert.</p>
          ) : (
            <div className="space-y-3">
              {prompts.map((p) => (
                <div key={p.id} className="rounded-xl border border-zinc-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-medium text-zinc-900">{p.title}</h3>
                    <form action={deletePrompt.bind(null, p.id)}>
                      <button
                        type="submit"
                        className="text-xs text-zinc-400 hover:text-red-600"
                      >
                        Löschen
                      </button>
                    </form>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">{p.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
