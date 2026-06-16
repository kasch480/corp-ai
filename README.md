# Corporate AI Platform — Prototyp

Ein KI-Workspace für Unternehmen (Multi-Tenant), ähnlich Dify.ai. Firmen registrieren
sich, bekommen einen eigenen Bereich und chatten mit Claude. Aufbau: Next.js 16 +
Supabase (Auth/DB) + Anthropic Claude.

## Setup (einmalig)

### 1. Supabase-Projekt anlegen (kostenlos)
1. Auf [supabase.com](https://supabase.com) registrieren → **New project**.
2. Wenn das Projekt bereit ist: **SQL Editor** → **New query** → den Inhalt von
   `supabase/schema.sql` einfügen → **Run**. Das legt Tabellen + Sicherheits-Policies an.
3. **Authentication → Providers → Email**: „Confirm email" **ausschalten**
   (für den Prototyp, damit Login sofort funktioniert).
4. **Project Settings → API**: `Project URL` und `anon public` Key kopieren.

### 2. Anthropic API-Key
Auf [console.anthropic.com](https://console.anthropic.com) → **API Keys** → Key erstellen.

### 3. `.env.local` anlegen
`.env.local.example` nach `.env.local` kopieren und die drei Werte eintragen:

```
NEXT_PUBLIC_SUPABASE_URL=https://dein-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-anon-key
ANTHROPIC_API_KEY=sk-ant-...
```

## Starten

```bash
npm install
npm run dev
```

→ [http://localhost:3000](http://localhost:3000) öffnen, Firma registrieren, chatten.

## Was drin ist
- **Login / Registrierung** mit automatischer Workspace-Anlage pro Firma
- **Dashboard** mit Sidebar (Chat, Inbox, Bibliothek, Spaces, Agenten, Wissen, Atelier)
- **Chat mit Claude**, Antworten live gestreamt, Verlauf in der DB gespeichert
- **Multi-Tenant**: jede Firma sieht nur ihre eigenen Daten (Row Level Security)

## Noch nicht drin (nächste Schritte)
Dokumenten-Upload + RAG (Wissensbasis), Agenten-Builder, Team-Einladungen, Billing.

## Tech
Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Supabase, Anthropic SDK.
Modell: `claude-sonnet-4-6` (in `lib/claude.ts` änderbar).
