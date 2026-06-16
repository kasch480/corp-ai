"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthState } from "../actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(login, null);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Anmelden</h1>
        <p className="mt-1 text-sm text-zinc-500">Willkommen zurück bei deinem KI-Workspace.</p>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">E-Mail</label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Passwort</label>
            <input
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            />
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {pending ? "Anmelden…" : "Anmelden"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Noch kein Konto?{" "}
          <Link href="/register" className="font-medium text-teal-700 hover:underline">
            Firma registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
