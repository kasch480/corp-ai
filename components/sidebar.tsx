"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(auth)/actions";

type Chat = { id: string; title: string };

const NAV = [
  { href: "/chat", label: "Neuer Chat", primary: true },
  { href: "/inbox", label: "Inbox" },
  { href: "/bibliothek", label: "Bibliothek" },
  { href: "/spaces", label: "Spaces" },
  { href: "/agenten", label: "Agenten" },
  { href: "/wissen", label: "Wissen" },
  { href: "/team", label: "Team" },
  { href: "/atelier", label: "Atelier" },
];

export function Sidebar({
  workspaceName,
  chats,
}: {
  workspaceName: string;
  chats: Chat[];
}) {
  const pathname = usePathname();
  const initials = workspaceName
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="flex h-dvh w-64 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50">
      {/* Workspace-Header */}
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-xs font-semibold text-white">
          {initials || "W"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900">{workspaceName}</p>
          <p className="text-xs text-zinc-500">Eigentümer</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 px-3">
        {NAV.map((item) => {
          const active = pathname === item.href;
          if (item.primary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800"
              >
                <span className="text-base leading-none">+</span> {item.label}
              </Link>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm ${
                active
                  ? "bg-zinc-200 font-medium text-zinc-900"
                  : "text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Chat-Liste */}
      <div className="mt-4 flex-1 overflow-y-auto px-3">
        <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
          Chats
        </p>
        {chats.length === 0 ? (
          <p className="px-3 py-2 text-xs text-zinc-400">Noch keine Chats</p>
        ) : (
          chats.map((c) => {
            const active = pathname === `/chat/${c.id}`;
            return (
              <Link
                key={c.id}
                href={`/chat/${c.id}`}
                className={`block truncate rounded-lg px-3 py-2 text-sm ${
                  active
                    ? "bg-zinc-200 font-medium text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {c.title}
              </Link>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-200 p-3">
        <Link
          href="/einstellungen"
          className={`block rounded-lg px-3 py-2 text-sm ${
            pathname === "/einstellungen"
              ? "bg-zinc-200 font-medium text-zinc-900"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          Einstellungen
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-100"
          >
            Abmelden
          </button>
        </form>
      </div>
    </aside>
  );
}
