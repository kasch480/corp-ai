"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export type Msg = { role: "user" | "assistant"; content: string };
export type PromptItem = { id: string; title: string; body: string };

export function ChatWindow({
  chatId,
  initialMessages,
  prompts = [],
}: {
  chatId?: string;
  initialMessages: Msg[];
  prompts?: PromptItem[];
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Live-Suche: Prompts, deren Titel mit dem getippten Text beginnt.
  const query = input.trim().toLowerCase();
  const matches =
    query.length > 0
      ? prompts.filter((p) => p.title.toLowerCase().startsWith(query))
      : showAll
        ? prompts
        : [];
  const dropdownOpen = matches.length > 0 && !dismissed;

  function insertPrompt(body: string) {
    setInput(body);
    setShowAll(false);
    setDismissed(true);
    setActiveIndex(0);
  }

  function onInputChange(v: string) {
    setInput(v);
    setActiveIndex(0);
    if (v.trim() === "") setDismissed(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (dropdownOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % matches.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + matches.length) % matches.length);
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        insertPrompt((matches[activeIndex] ?? matches[0]).body);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setDismissed(true);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // Laufende Antwort abbrechen.
  function stop() {
    abortRef.current?.abort();
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setShowAll(false);
    setDismissed(false);
    setBusy(true);
    setMessages((m) => [
      ...m,
      { role: "user", content: text },
      { role: "assistant", content: "" },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;
    let newChatId: string | null = null;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, message: text }),
        signal: controller.signal,
      });

      newChatId = res.headers.get("x-chat-id");
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages((m) => {
            const copy = [...m];
            const last = copy[copy.length - 1];
            copy[copy.length - 1] = { role: "assistant", content: last.content + chunk };
            return copy;
          });
        }
      }
    } catch (e) {
      // Abbruch durch den Nutzer: bereits geschriebenen Teil stehen lassen.
      if ((e as Error)?.name !== "AbortError") {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: "assistant",
            content: "[Fehler — bitte erneut versuchen]",
          };
          return copy;
        });
      }
    } finally {
      abortRef.current = null;
      setBusy(false);
      if (!chatId && newChatId) {
        router.replace(`/chat/${newChatId}`);
      }
      router.refresh();
    }
  }

  return (
    <div className="flex h-dvh flex-1 flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-200 px-6 py-3">
        <span className="text-sm font-medium text-zinc-700">Chat</span>
      </div>

      {/* Nachrichten */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-semibold text-zinc-900">Wie kann ich helfen?</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Stelle eine Frage, um den Chat zu starten.
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-6">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-teal-700 text-white"
                      : "bg-zinc-100 text-zinc-800"
                  }`}
                >
                  {m.content || (busy ? "…" : "")}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Eingabe */}
      <div className="border-t border-zinc-200 px-6 py-4">
        <div className="mx-auto max-w-2xl">
          {prompts.length > 0 && (
            <div className="relative mb-2">
              <button
                type="button"
                onClick={() => {
                  setShowAll((v) => !v);
                  setDismissed(false);
                }}
                className="rounded-lg border border-zinc-300 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
              >
                📋 Prompts ({prompts.length})
              </button>

              {dropdownOpen && (
                <div className="absolute bottom-9 left-0 z-10 max-h-64 w-96 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-lg">
                  <div className="flex items-center justify-between px-3 py-1">
                    <span className="text-xs text-zinc-400">
                      {query.length > 0
                        ? `${matches.length} Treffer · ↑↓ wählen, Enter einfügen, Esc abbrechen`
                        : "↑↓ wählen, Enter einfügen, Esc schließen"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDismissed(true)}
                      className="text-xs text-zinc-400 hover:text-zinc-700"
                    >
                      ✕
                    </button>
                  </div>
                  {matches.map((p, idx) => (
                    <button
                      key={p.id}
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => insertPrompt(p.body)}
                      className={`block w-full rounded-lg px-3 py-2 text-left ${
                        idx === activeIndex ? "bg-teal-50" : "hover:bg-zinc-100"
                      }`}
                    >
                      <span className="block text-sm font-medium text-zinc-800">{p.title}</span>
                      <span className="block truncate text-xs text-zinc-400">{p.body}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder="Nachricht schreiben… (Prompt-Titel tippen zum Suchen)"
              className="max-h-40 flex-1 resize-none rounded-xl border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            />
            {busy ? (
              <button
                onClick={stop}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
              >
                ◼ Stoppen
              </button>
            ) : (
              <button
                onClick={send}
                disabled={!input.trim()}
                className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
              >
                Senden
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
