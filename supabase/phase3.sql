-- Phase 3 — Wissen / RAG
-- Im Supabase SQL-Editor ausführen (nach schema.sql + phase1.sql + phase2.sql).

create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  name         text not null,
  size         bigint not null default 0,
  created_at   timestamptz not null default now()
);

create table if not exists public.document_chunks (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references public.documents (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  content      text not null,
  fts          tsvector generated always as (to_tsvector('german', content)) stored
);

create index if not exists idx_document_chunks_fts
  on public.document_chunks using gin (fts);

create index if not exists idx_documents_workspace
  on public.documents (workspace_id, created_at desc);

alter table public.documents       enable row level security;
alter table public.document_chunks enable row level security;

drop policy if exists "documents_select" on public.documents;
create policy "documents_select" on public.documents
  for select using (public.is_workspace_member(workspace_id));

drop policy if exists "documents_insert" on public.documents;
create policy "documents_insert" on public.documents
  for insert with check (public.is_workspace_member(workspace_id) and user_id = auth.uid());

drop policy if exists "documents_delete" on public.documents;
create policy "documents_delete" on public.documents
  for delete using (user_id = auth.uid());

drop policy if exists "chunks_select" on public.document_chunks;
create policy "chunks_select" on public.document_chunks
  for select using (public.is_workspace_member(workspace_id));

drop policy if exists "chunks_insert" on public.document_chunks;
create policy "chunks_insert" on public.document_chunks
  for insert with check (public.is_workspace_member(workspace_id));
