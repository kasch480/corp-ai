-- Phase 2 — Prompt-Bibliothek
-- Im Supabase SQL-Editor ausführen (nach schema.sql + phase1.sql).

create table if not exists public.prompts (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  title        text not null,
  body         text not null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_prompts_workspace
  on public.prompts (workspace_id, created_at desc);

alter table public.prompts enable row level security;

-- Prompts sind im Workspace geteilt (Team-Bibliothek): alle Mitglieder sehen sie.
drop policy if exists "prompts_select" on public.prompts;
create policy "prompts_select" on public.prompts
  for select using (public.is_workspace_member(workspace_id));

drop policy if exists "prompts_insert" on public.prompts;
create policy "prompts_insert" on public.prompts
  for insert with check (
    public.is_workspace_member(workspace_id) and user_id = auth.uid()
  );

-- Löschen darf nur, wer den Prompt erstellt hat.
drop policy if exists "prompts_delete" on public.prompts;
create policy "prompts_delete" on public.prompts
  for delete using (user_id = auth.uid());
