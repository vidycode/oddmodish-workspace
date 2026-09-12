begin;

create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.access_level as enum ('owner', 'editor', 'viewer');
create type public.job_role as enum ('founder', 'agency_ops_lead', 'team_lead', 'writer', 'uploader', 'sales', 'analyst', 'client_guest');
create type public.membership_status as enum ('active', 'suspended', 'left');
create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired', 'failed');
create type public.dashboard_visibility as enum ('organization', 'team', 'private');
create type public.subject_type as enum ('user', 'team');
create type public.resource_type as enum ('dashboard', 'client', 'campaign', 'report', 'document');
create type public.time_activity as enum ('writing', 'review', 'upload', 'monitoring', 'reporting', 'sales', 'operations');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  slug citext not null unique check (slug ~ '^[a-z0-9-]+$'),
  timezone text not null default 'Asia/Seoul',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext not null,
  display_name text,
  avatar_url text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug citext not null,
  created_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  access_level public.access_level not null default 'viewer',
  job_role public.job_role not null default 'client_guest',
  status public.membership_status not null default 'active',
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email citext not null,
  access_level public.access_level not null,
  job_role public.job_role not null,
  team_id uuid references public.teams(id) on delete set null,
  invited_by uuid not null references public.profiles(id) on delete restrict,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index invitations_one_pending_email_per_org
  on public.invitations (organization_id, email)
  where status = 'pending';

create table public.dashboards (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  name text not null,
  slug citext not null,
  visibility public.dashboard_visibility not null default 'organization',
  allowed_roles public.job_role[] not null default array[]::public.job_role[],
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table public.resource_grants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  resource_type public.resource_type not null,
  resource_id uuid not null,
  subject_type public.subject_type not null,
  subject_id uuid not null,
  access_level public.access_level not null check (access_level <> 'owner'),
  granted_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (resource_type, resource_id, subject_type, subject_id)
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  request_id uuid,
  created_at timestamptz not null default now()
);

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  task_id uuid,
  activity public.time_activity not null,
  notes text check (char_length(notes) <= 1000),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_minutes integer generated always as (
    case when ended_at is null then null else greatest(0, floor(extract(epoch from (ended_at - started_at)) / 60)::integer) end
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);

create table public.presence_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  current_path text not null check (current_path ~ '^/' and char_length(current_path) <= 200),
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  active_seconds integer not null default 0 check (active_seconds >= 0),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index one_open_timer_per_user on public.time_entries (user_id) where ended_at is null;
create index memberships_org_user_idx on public.memberships (organization_id, user_id) where status = 'active';
create index activity_org_created_idx on public.activity_events (organization_id, created_at desc);
create index time_entries_org_started_idx on public.time_entries (organization_id, started_at desc);
create index presence_org_last_seen_idx on public.presence_sessions (organization_id, last_seen_at desc);
create index grants_resource_idx on public.resource_grants (resource_type, resource_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger organizations_touch before update on public.organizations for each row execute function public.touch_updated_at();
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger memberships_touch before update on public.memberships for each row execute function public.touch_updated_at();
create trigger dashboards_touch before update on public.dashboards for each row execute function public.touch_updated_at();
create trigger time_entries_touch before update on public.time_entries for each row execute function public.touch_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger auth_user_profile after insert or update of email on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.is_org_member(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships
    where organization_id = p_organization_id and user_id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.is_org_owner(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships
    where organization_id = p_organization_id and user_id = auth.uid() and status = 'active' and access_level = 'owner'
  );
$$;

create or replace function public.can_manage_members(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships
    where organization_id = p_organization_id and user_id = auth.uid() and status = 'active'
      and (access_level = 'owner' or (access_level = 'editor' and job_role = 'agency_ops_lead'))
  );
$$;

create or replace function public.can_read_team_activity(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships
    where organization_id = p_organization_id and user_id = auth.uid() and status = 'active'
      and (access_level = 'owner' or job_role in ('founder', 'agency_ops_lead', 'team_lead', 'analyst'))
  );
$$;

create or replace function public.can_track_time(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships
    where organization_id = p_organization_id and user_id = auth.uid() and status = 'active'
      and access_level <> 'viewer' and job_role <> 'client_guest'
  );
$$;

create or replace function public.can_access_dashboard(p_dashboard_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.dashboards d
    join public.memberships m on m.organization_id = d.organization_id and m.user_id = auth.uid() and m.status = 'active'
    where d.id = p_dashboard_id and (
      m.access_level = 'owner'
      or (d.visibility = 'organization' and (cardinality(d.allowed_roles) = 0 or m.job_role = any(d.allowed_roles)))
      or (d.visibility = 'team' and d.team_id = m.team_id)
      or m.job_role = any(d.allowed_roles)
      or d.created_by = auth.uid()
      or exists (
        select 1 from public.resource_grants g
        where g.resource_type = 'dashboard' and g.resource_id = d.id
          and ((g.subject_type = 'user' and g.subject_id = auth.uid()) or (g.subject_type = 'team' and g.subject_id = m.team_id))
      )
    )
  );
$$;

create or replace function public.bootstrap_workspace(p_name text, p_slug text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_org_id uuid; v_writing uuid; v_upload uuid; v_sales uuid; v_operations uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if exists (select 1 from public.organizations) then raise exception 'Workspace already bootstrapped'; end if;
  insert into public.organizations (name, slug) values (p_name, p_slug) returning id into v_org_id;
  insert into public.memberships (organization_id, user_id, access_level, job_role)
  values (v_org_id, auth.uid(), 'owner', 'founder');
  insert into public.teams (organization_id, name, slug) values (v_org_id, 'Operations', 'operations') returning id into v_operations;
  insert into public.teams (organization_id, name, slug) values (v_org_id, 'Content Writing', 'writing') returning id into v_writing;
  insert into public.teams (organization_id, name, slug) values (v_org_id, 'Upload & Monitoring', 'upload') returning id into v_upload;
  insert into public.teams (organization_id, name, slug) values (v_org_id, 'Sales', 'sales') returning id into v_sales;
  insert into public.dashboards (organization_id, name, slug, visibility, allowed_roles, created_by) values
    (v_org_id, 'Founder Overview', 'founder', 'private', array['founder']::public.job_role[], auth.uid()),
    (v_org_id, 'Agency Operations', 'operations', 'private', array['founder','agency_ops_lead']::public.job_role[], auth.uid()),
    (v_org_id, 'Content Writing', 'writing', 'team', array['founder','agency_ops_lead','team_lead','writer']::public.job_role[], auth.uid()),
    (v_org_id, 'Upload & Live Monitor', 'upload', 'team', array['founder','agency_ops_lead','team_lead','uploader']::public.job_role[], auth.uid()),
    (v_org_id, 'Sales CRM', 'sales', 'team', array['founder','agency_ops_lead','sales']::public.job_role[], auth.uid()),
    (v_org_id, 'Client Reporting', 'reports', 'private', array['founder','agency_ops_lead','analyst','client_guest']::public.job_role[], auth.uid());
  update public.dashboards set team_id = case slug::text when 'writing' then v_writing when 'upload' then v_upload when 'sales' then v_sales else team_id end where organization_id = v_org_id;
  return v_org_id;
end;
$$;

create or replace function public.claim_pending_invitation()
returns uuid language plpgsql security definer set search_path = public as $$
declare v_invite public.invitations%rowtype; v_email citext;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  v_email := (auth.jwt() ->> 'email')::citext;
  select * into v_invite from public.invitations
    where email = v_email and status = 'pending' and expires_at > now()
    order by created_at desc limit 1 for update;
  if v_invite.id is null then raise exception 'No valid invitation found for this email'; end if;
  insert into public.memberships (organization_id, user_id, team_id, access_level, job_role, invited_by)
  values (v_invite.organization_id, auth.uid(), v_invite.team_id, v_invite.access_level, v_invite.job_role, v_invite.invited_by)
  on conflict (organization_id, user_id) do update set team_id = excluded.team_id, access_level = excluded.access_level, job_role = excluded.job_role, status = 'active', updated_at = now();
  update public.invitations set status = 'accepted', accepted_at = now() where id = v_invite.id;
  return v_invite.organization_id;
end;
$$;

create or replace function public.start_work_session(p_organization_id uuid, p_task_id uuid, p_activity public.time_activity)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_entry public.time_entries%rowtype;
begin
  if not public.can_track_time(p_organization_id) then raise exception 'Time tracking permission denied'; end if;
  insert into public.time_entries (organization_id, user_id, task_id, activity)
  values (p_organization_id, auth.uid(), p_task_id, p_activity) returning * into v_entry;
  return jsonb_build_object('id', v_entry.id, 'started_at', v_entry.started_at);
exception when unique_violation then raise exception 'A timer is already running';
end;
$$;

create or replace function public.stop_work_session(p_entry_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_entry public.time_entries%rowtype;
begin
  update public.time_entries set ended_at = now()
    where id = p_entry_id and user_id = auth.uid() and ended_at is null returning * into v_entry;
  if v_entry.id is null then raise exception 'Open timer not found'; end if;
  return jsonb_build_object('id', v_entry.id, 'ended_at', v_entry.ended_at, 'duration_minutes', v_entry.duration_minutes);
end;
$$;

create or replace function public.heartbeat_presence(p_organization_id uuid, p_path text, p_session_id uuid, p_active_seconds integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_presence public.presence_sessions%rowtype;
begin
  if not public.is_org_member(p_organization_id) then raise exception 'Presence permission denied'; end if;
  if p_path !~ '^/' or char_length(p_path) > 200 then raise exception 'Invalid application path'; end if;
  if p_active_seconds < 0 or p_active_seconds > 30 then raise exception 'Invalid heartbeat duration'; end if;
  if p_session_id is not null then
    update public.presence_sessions
      set current_path = p_path, last_seen_at = now(), active_seconds = active_seconds + p_active_seconds, ended_at = null
      where id = p_session_id and user_id = auth.uid() and organization_id = p_organization_id
      returning * into v_presence;
  end if;
  if v_presence.id is null then
    insert into public.presence_sessions (organization_id, user_id, current_path, active_seconds)
    values (p_organization_id, auth.uid(), p_path, p_active_seconds) returning * into v_presence;
  end if;
  return jsonb_build_object('id', v_presence.id, 'last_seen_at', v_presence.last_seen_at, 'active_seconds', v_presence.active_seconds);
end;
$$;

create or replace function public.list_active_presence(p_organization_id uuid)
returns table (id uuid, current_path text, last_seen_at timestamptz, active_seconds integer, user_id uuid, display_name text, email citext)
language sql stable security definer set search_path = public as $$
  select ps.id, ps.current_path, ps.last_seen_at, ps.active_seconds, ps.user_id, p.display_name, p.email
  from public.presence_sessions ps
  join public.profiles p on p.id = ps.user_id
  where ps.organization_id = p_organization_id
    and public.can_read_team_activity(p_organization_id)
    and ps.last_seen_at >= now() - interval '2 minutes'
  order by ps.last_seen_at desc;
$$;

create or replace function public.record_audit_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_entity uuid; v_action text;
begin
  if tg_op = 'DELETE' then
    v_org := old.organization_id;
    v_entity := old.id;
  else
    v_org := new.organization_id;
    v_entity := new.id;
  end if;
  v_action := lower(tg_table_name || '_' || tg_op);
  insert into public.activity_events (organization_id, actor_id, action, entity_type, entity_id, metadata)
  values (v_org, auth.uid(), v_action, tg_table_name, v_entity, jsonb_build_object('operation', tg_op));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger audit_memberships after insert or update or delete on public.memberships for each row execute function public.record_audit_event();
create trigger audit_invitations after insert or update or delete on public.invitations for each row execute function public.record_audit_event();
create trigger audit_dashboards after insert or update or delete on public.dashboards for each row execute function public.record_audit_event();
create trigger audit_resource_grants after insert or update or delete on public.resource_grants for each row execute function public.record_audit_event();
create trigger audit_time_entries after insert or update on public.time_entries for each row execute function public.record_audit_event();

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.dashboards enable row level security;
alter table public.resource_grants enable row level security;
alter table public.activity_events enable row level security;
alter table public.time_entries enable row level security;
alter table public.presence_sessions enable row level security;

create policy organizations_read on public.organizations for select using (public.is_org_member(id));
create policy organizations_update on public.organizations for update using (public.is_org_owner(id)) with check (public.is_org_owner(id));
create policy profiles_self_or_colleague_read on public.profiles for select using (id = auth.uid() or exists (select 1 from public.memberships mine join public.memberships theirs on theirs.organization_id = mine.organization_id where mine.user_id = auth.uid() and mine.status = 'active' and theirs.user_id = profiles.id));
create policy profiles_self_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy teams_read on public.teams for select using (public.is_org_member(organization_id));
create policy teams_manage on public.teams for all using (public.can_manage_members(organization_id)) with check (public.can_manage_members(organization_id));
create policy memberships_read on public.memberships for select using (public.is_org_member(organization_id));
create policy memberships_owner_manage on public.memberships for all using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));
create policy invitations_read on public.invitations for select using (public.can_manage_members(organization_id));
create policy invitations_insert on public.invitations for insert with check (public.can_manage_members(organization_id) and invited_by = auth.uid() and (access_level <> 'owner' or public.is_org_owner(organization_id)));
create policy invitations_update on public.invitations for update using (public.can_manage_members(organization_id)) with check (public.can_manage_members(organization_id));
create policy dashboards_read on public.dashboards for select using (public.can_access_dashboard(id));
create policy dashboards_manage on public.dashboards for all using (public.can_manage_members(organization_id)) with check (public.can_manage_members(organization_id));
create policy grants_read on public.resource_grants for select using (public.is_org_member(organization_id));
create policy grants_manage on public.resource_grants for all using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));
create policy activity_read on public.activity_events for select using (actor_id = auth.uid() or public.can_read_team_activity(organization_id));
create policy time_read on public.time_entries for select using (user_id = auth.uid() or public.can_read_team_activity(organization_id));
create policy time_insert on public.time_entries for insert with check (user_id = auth.uid() and public.can_track_time(organization_id));
create policy time_update on public.time_entries for update using (user_id = auth.uid()) with check (user_id = auth.uid() and public.can_track_time(organization_id));
create policy presence_read on public.presence_sessions for select using (user_id = auth.uid() or public.can_read_team_activity(organization_id));
create policy presence_insert on public.presence_sessions for insert with check (user_id = auth.uid() and public.is_org_member(organization_id));
create policy presence_update on public.presence_sessions for update using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_org_member(organization_id));

revoke all on function public.bootstrap_workspace(text, text) from public;
revoke all on function public.claim_pending_invitation() from public;
revoke all on function public.start_work_session(uuid, uuid, public.time_activity) from public;
revoke all on function public.stop_work_session(uuid) from public;
revoke all on function public.heartbeat_presence(uuid, text, uuid, integer) from public;
revoke all on function public.list_active_presence(uuid) from public;
grant execute on function public.bootstrap_workspace(text, text) to authenticated;
grant execute on function public.claim_pending_invitation() to authenticated;
grant execute on function public.start_work_session(uuid, uuid, public.time_activity) to authenticated;
grant execute on function public.stop_work_session(uuid) to authenticated;
grant execute on function public.heartbeat_presence(uuid, text, uuid, integer) to authenticated;
grant execute on function public.list_active_presence(uuid) to authenticated;

commit;
