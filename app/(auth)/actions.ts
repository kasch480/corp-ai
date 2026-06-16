"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error: string } | null;

// Login mit E-Mail + Passwort.
export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Login fehlgeschlagen: " + error.message };
  }
  redirect("/chat");
}

// Registrierung: Account anlegen + Workspace (Firma) erstellen.
export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const company = String(formData.get("company") ?? "").trim();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!company) {
    return { error: "Bitte einen Firmennamen angeben." };
  }

  const supabase = await createClient();
  // Firmenname als User-Metadaten mitgeben — überlebt auch eine E-Mail-Bestätigung.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { company } },
  });

  if (error) {
    return { error: "Registrierung fehlgeschlagen: " + error.message };
  }

  // Ohne Session ist die E-Mail-Bestätigung aktiv → Hinweis zeigen.
  if (!data.session) {
    return {
      error:
        "Fast geschafft! Wir haben dir eine Bestätigungs-Mail geschickt. " +
        "Klicke den Link darin, danach kannst du dich anmelden.",
    };
  }

  // Workspace wird beim ersten Laden des Dashboards angelegt (siehe (dashboard)/layout).
  redirect("/chat");
}

// Logout.
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
