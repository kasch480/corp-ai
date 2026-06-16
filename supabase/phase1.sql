-- Phase 1 — Multi-LLM-Gateway
-- Im Supabase SQL-Editor ausführen (nach schema.sql).

-- Gewähltes Modell pro Workspace
alter table public.workspaces
  add column if not exists model text not null default 'claude-sonnet-4-6';

-- Nur der Owner darf den Workspace (und damit das Modell) ändern
drop policy if exists "workspaces_update" on public.workspaces;
create policy "workspaces_update" on public.workspaces
  for update using (owner_id = auth.uid());

-- Sicherheits-Härtung: Chats sind privat pro Nutzer (statt nur pro Workspace).
-- Verhindert, dass Kollegen im selben Workspace fremde Chats lesen/ändern.
drop policy if exists "chats_select" on public.chats;
create policy "chats_select" on public.chats
  for select using (user_id = auth.uid());

drop policy if exists "chats_update" on public.chats;
create policy "chats_update" on public.chats
  for update using (user_id = auth.uid());

drop policy if exists "chats_delete" on public.chats;
create policy "chats_delete" on public.chats
  for delete using (user_id = auth.uid());

-- Nachrichten: Zugriff nur, wenn der zugehörige Chat dem Nutzer gehört.
drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages
  for select using (
    exists (select 1 from public.chats c
      where c.id = chat_id and c.user_id = auth.uid())
  );

drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages
  for insert with check (
    exists (select 1 from public.chats c
      where c.id = chat_id and c.user_id = auth.uid())
  );
