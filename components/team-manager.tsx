"use client";

import { useRef, useState } from "react";
import { createInvitation, deleteInvitation, removeMember } from "@/app/(dashboard)/team/actions";

type Member = { user_id: string; email: string; role: string };
type Invitation = { id: string; email: string | null; token: string; expires_at: string };

export function TeamManager({
  members,
  invitations,
  currentUserId,
  isOwner,
}: {
  members: Member[];
  invitations: Invitation[];
  currentUserId: string;
  isOwner: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleInvite(fd: FormData) {
    setError(null);
    setLink(null);
    const result = await createInvitation(fd);
    if (result?.error) {
      setError(result.error);
    } else if (result?.link) {
      setLink(result.link);
      formRef.current?.reset();
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex h-dvh flex-1 flex-col bg-white">
      <div className="border-b border-zinc-200 px-8 py-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Team</h1>
        <p className="mt-1 text-sm text-zinc-500">Mitglieder verwalten und neue einladen.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-2xl space-y-8">

          {/* Mitglieder */}
          <section>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
              {members.length} Mitglied{members.length !== 1 ? "er" : ""}
            </p>
            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.user_id}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{m.email}</p>
                    <p className="text-xs text-zinc-400">
                      {m.role === "owner" ? "Inhaber" : "Mitglied"}
                    </p>
                  </div>
                  {isOwner && m.user_id !== currentUserId && (
                    <form action={removeMember.bind(null, m.user_id)}>
                      <button type="submit" className="text-xs text-zinc-400 hover:text-red-600">
                        Entfernen
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Einladen */}
          <section>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
              Einladen
            </p>
            <form ref={formRef} action={handleInvite} className="space-y-3">
              <input
                name="email"
                type="email"
                placeholder="E-Mail (optional, nur zur Beschriftung)"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
              >
                Einladungslink erstellen
              </button>
            </form>

            {link && (
              <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50 p-4">
                <p className="mb-2 text-sm font-medium text-teal-800">Link kopieren und teilen:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700">
                    {link}
                  </code>
                  <button
                    type="button"
                    onClick={() => copy(link)}
                    className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800"
                  >
                    {copied ? "Kopiert!" : "Kopieren"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-teal-600">Gültig für 7 Tage.</p>
              </div>
            )}
          </section>

          {/* Offene Einladungen */}
          {invitations.length > 0 && (
            <section>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
                Offene Einladungen ({invitations.length})
              </p>
              <div className="space-y-2">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm text-zinc-700">{inv.email ?? "Ohne E-Mail"}</p>
                      <p className="text-xs text-zinc-400">
                        Läuft ab: {new Date(inv.expires_at).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                    <form action={deleteInvitation.bind(null, inv.id)}>
                      <button type="submit" className="text-xs text-zinc-400 hover:text-red-600">
                        Widerrufen
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
