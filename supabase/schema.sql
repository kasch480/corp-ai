-- ============================================================
-- Corporate AI Platform — Datenbankschema + RLS
-- Im Supabase SQL-Editor ausführen (Dashboard → SQL Editor → New query).
-- ============================================================

-- ---------- Tabellen ----------

-- Eine Firma / ein Mandant
create table if not exists public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  owner_id    uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Wer gehört zu welchem Workspace
create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  role         text not null default 'member' check (role in ('owner', 'member')),
  created_at   timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- Ein Chat-Verlauf
create table if not exists public.chats (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  title        text not null default 'Neuer Chat',
  created_at   timestamptz not null default now()
);

-- Einzelne Nachrichten in einem Chat
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  chat_id     uuid not null references public.chats (id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_chats_workspace on public.chats (workspace_id, created_at desc);
create index if not exists idx_messages_chat on public.messages (chat_id, created_at);

-- ---------- Hilfsfunktion (gegen RLS-Rekursion) ----------
-- SECURITY DEFINER umgeht RLS auf workspace_members und verhindert
-- so eine Endlosschleife in den Policies.
create or replace function public.is_workspace_member(ws uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws and user_id = auth.uid()
  );
$$;

-- ---------- RLS aktivieren ----------
alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;
alter table public.chats             enable row level security;
alter table public.messages          enable row level security;

-- ---------- Policies: workspaces ----------
drop policy if exists "workspaces_select" on public.workspaces;
create policy "workspaces_select" on public.workspaces
  for select using (public.is_workspace_member(id));

-- ---------- Policies: workspace_members ----------
drop policy if exists "members_select" on public.workspace_members;
create policy "members_select" on public.workspace_members
  for select using (public.is_workspace_member(workspace_id));

-- ---------- Policies: chats ----------
drop policy if exists "chats_select" on public.chats;
create policy "chats_select" on public.chats
  for select using (public.is_workspace_member(workspace_id));

drop policy if exists "chats_insert" on public.chats;
create policy "chats_insert" on public.chats
  for insert with check (
    public.is_workspace_member(workspace_id) and user_id = auth.uid()
  );

drop policy if exists "chats_update" on public.chats;
create policy "chats_update" on public.chats
  for update using (public.is_workspace_member(workspace_id));

drop policy if exists "chats_delete" on public.chats;
create policy "chats_delete" on public.chats
  for delete using (public.is_workspace_member(workspace_id));

-- ---------- Policies: messages ----------
-- Zugriff über die Zugehörigkeit zum Chat (und damit zum Workspace).
drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages
  for select using (
    exists (
      select 1 from public.chats c
      where c.id = chat_id and public.is_workspace_member(c.workspace_id)
    )
  );

drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages
  for insert with check (
    exists (
      select 1 from public.chats c
      where c.id = chat_id and public.is_workspace_member(c.workspace_id)
    )
  );

-- ---------- RPC: Workspace bei Registrierung anlegen ----------
-- Legt Workspace + Owner-Mitgliedschaft atomar an. SECURITY DEFINER,
-- damit der frisch registrierte Nutzer das trotz RLS darf.
create or replace function public.create_workspace(workspace_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  base_slug text;
  final_slug text;
  suffix int := 0;
begin
  if auth.uid() is null then
    raise exception 'Nicht authentifiziert';
  end if;

  -- Slug aus dem Namen bauen (kleinbuchstaben, nur a-z0-9-)
  base_slug := regexp_replace(lower(workspace_name), '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then base_slug := 'workspace'; end if;
  final_slug := base_slug;

  -- Eindeutigen Slug finden
  while exists (select 1 from public.workspaces where slug = final_slug) loop
    suffix := suffix + 1;
    final_slug := base_slug || '-' || suffix;
  end loop;

  insert into public.workspaces (name, slug, owner_id)
  values (workspace_name, final_slug, auth.uid())
  returning id into new_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_id, auth.uid(), 'owner');

  return new_id;
end;
$$;
