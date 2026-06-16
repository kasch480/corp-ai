-- Phase 4 — Team-Management
-- Im Supabase SQL-Editor ausführen (nach phase3.sql).

create table if not exists public.invitations (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by   uuid not null references auth.users (id) on delete cascade,
  email        text,
  token        text not null unique default encode(gen_random_bytes(32), 'hex'),
  accepted_at  timestamptz,
  expires_at   timestamptz not null default (now() + interval '7 days'),
  created_at   timestamptz not null default now()
);

alter table public.invitations enable row level security;

drop policy if exists "invitations_select" on public.invitations;
create policy "invitations_select" on public.invitations
  for select using (public.is_workspace_member(workspace_id));

drop policy if exists "invitations_insert" on public.invitations;
create policy "invitations_insert" on public.invitations
  for insert with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "invitations_delete" on public.invitations;
create policy "invitations_delete" on public.invitations
  for delete using (created_by = auth.uid());

-- Mitgliederliste mit E-Mails (liest auth.users, daher SECURITY DEFINER)
create or replace function public.get_workspace_members(p_workspace_id uuid)
returns table(user_id uuid, email text, role text)
security definer
set search_path = public
language plpgsql as $$
begin
  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'Forbidden';
  end if;
  return query
    select wm.user_id, u.email::text, wm.role
    from workspace_members wm
    join auth.users u on u.id = wm.user_id
    where wm.workspace_id = p_workspace_id;
end;
$$;

-- Einladung per Token laden (ohne Auth-Kontext)
create or replace function public.get_invitation_by_token(p_token text)
returns table(workspace_id uuid, workspace_name text, email text, expires_at timestamptz, accepted_at timestamptz)
security definer
set search_path = public
language plpgsql as $$
begin
  return query
    select i.workspace_id, w.name, i.email, i.expires_at, i.accepted_at
    from invitations i
    join workspaces w on w.id = i.workspace_id
    where i.token = p_token;
end;
$$;

-- Einladung annehmen: Nutzer dem Workspace hinzufügen
create or replace function public.accept_invitation(p_token text)
returns uuid
security definer
set search_path = public
language plpgsql as $$
declare
  v_inv public.invitations;
begin
  select * into v_inv
  from public.invitations
  where token = p_token
    and accepted_at is null
    and expires_at > now();

  if not found then
    raise exception 'Ungültige oder abgelaufene Einladung';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_inv.workspace_id, auth.uid(), 'member')
  on conflict (workspace_id, user_id) do nothing;

  update public.invitations set accepted_at = now() where id = v_inv.id;

  return v_inv.workspace_id;
end;
$$;
