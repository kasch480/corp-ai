"use client";

import { useState, useTransition } from "react";
import { updateModel } from "@/app/(dashboard)/einstellungen/actions";

type M = {
  id: string;
  label: string;
  provider: string;
  region: "EU" | "US";
  available: boolean;
  envVar: string;
};

export function ModelPicker({ current, models }: { current: string; models: M[] }) {
  const [selected, setSelected] = useState(current);
  const [pending, startTransition] = useTransition();

  function choose(id: string) {
    setSelected(id);
    startTransition(() => updateModel(id));
  }

  return (
    <div className="flex h-dvh flex-1 flex-col bg-white">
      <div className="border-b border-zinc-200 px-8 py-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Einstellungen</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Wähle das KI-Modell für deinen Workspace.{" "}
          {pending && <span className="text-teal-700">Wird gespeichert…</span>}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-2xl space-y-3">
          {models.map((m) => {
            const active = selected === m.id;
            return (
              <button
                key={m.id}
                onClick={() => m.available && choose(m.id)}
                disabled={!m.available}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                  active
                    ? "border-teal-600 bg-teal-50"
                    : "border-zinc-200 hover:border-zinc-300"
                } ${!m.available ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900">{m.label}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                        m.region === "EU"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {m.region === "EU" ? "🇪🇺 EU" : "US"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {m.provider}
                    {!m.available && ` · API-Key fehlt (${m.envVar})`}
                  </p>
                </div>
                <div
                  className={`h-4 w-4 rounded-full border ${
                    active ? "border-teal-600 bg-teal-600" : "border-zinc-300"
                  }`}
                />
              </button>
            );
          })}
          <p className="pt-2 text-xs text-zinc-400">
            Modelle mit „API-Key fehlt" werden aktiv, sobald der jeweilige Schlüssel in
            <code className="mx-1 rounded bg-zinc-100 px-1">.env.local</code> hinterlegt ist.
          </p>
        </div>
      </div>
    </div>
  );
}
