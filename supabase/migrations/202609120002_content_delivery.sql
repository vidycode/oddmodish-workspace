begin;

create type public.content_kind as enum ('post', 'comment');
create type public.content_status as enum (
  'backlog','assigned','writing','ready_for_review','revision_required','approved',
  'ready_to_upload','scheduled','uploaded','live','removed','replacement_required',
  'replacement_writing','replacement_ready','reuploaded','verified_live','archived'
);
create type public.monitor_classification as enum ('live','removed','author_deleted','account_suspended','private','unknown','error');

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  status text not null default 'active' check (status in ('lead','onboarding','active','paused','churned')),
  owner_id uuid references public.profiles(id) on delete set null,
  timezone text not null default 'Asia/Seoul',
  renewal_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 160),
  deadline_at timestamptz,
  status text not null default 'active' check (status in ('draft','active','at_risk','completed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, name)
);

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  kind public.content_kind not null,
  title text not null check (char_length(title) between 2 and 240),
  body text not null default '',
  subreddit text,
  writer_id uuid references public.profiles(id) on delete set null,
  uploader_id uuid references public.profiles(id) on delete set null,
  status public.content_status not null default 'backlog',
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent','critical')),
  due_at timestamptz,
  reddit_url text check (reddit_url is null or reddit_url ~ '^https://(www\.)?reddit\.com/'),
  original_content_id uuid unique references public.content_items(id) on delete set null,
  revision_reason text,
  monitor_state public.monitor_classification,
  monitor_checked_at timestamptz,
  version integer not null default 1 check (version > 0),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  content_id uuid not null references public.content_items(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  from_status public.content_status,
  to_status public.content_status,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  idempotency_key text,
  created_at timestamptz not null default now(),
  unique (organization_id, idempotency_key)
);

create table public.monitor_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  content_id uuid not null references public.content_items(id) on delete cascade,
  classification public.monitor_classification not null,
  http_status integer,
  evidence jsonb not null default '{}'::jsonb,
  checked_at timestamptz not null default now(),
  idempotency_key text not null,
  unique (content_id, idempotency_key)
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  content_id uuid references public.content_items(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  remind_at timestamptz not null,
  escalation_level integer not null default 0 check (escalation_level between 0 and 4),
  status text not null default 'scheduled' check (status in ('scheduled','sent','snoozed','resolved','cancelled')),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  content_id uuid references public.content_items(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  read_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index content_items_org_status_due_idx on public.content_items (organization_id, status, due_at);
create index content_items_writer_idx on public.content_items (writer_id, status);
create index content_items_uploader_idx on public.content_items (uploader_id, status);
create index content_events_content_created_idx on public.content_events (content_id, created_at desc);
create index reminders_due_idx on public.reminders (organization_id, status, remind_at);
create index notifications_recipient_idx on public.notifications (recipient_id, read_at, created_at desc);

create trigger clients_touch before update on public.clients for each row execute function public.touch_updated_at();
create trigger campaigns_touch before update on public.campaigns for each row execute function public.touch_updated_at();
create trigger content_items_touch before update on public.content_items for each row execute function public.touch_updated_at();

create or replace function public.can_read_delivery(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships
    where organization_id = p_organization_id and user_id = auth.uid() and status = 'active'
      and job_role <> 'client_guest'
  );
$$;

create or replace function public.can_read_content_item(p_content_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.content_items c
    join public.memberships reader on reader.organization_id = c.organization_id
      and reader.user_id = auth.uid() and reader.status = 'active'
    left join public.memberships writer on writer.organization_id = c.organization_id
      and writer.user_id = c.writer_id and writer.status = 'active'
    where c.id = p_content_id and (
      reader.access_level = 'owner'
      or reader.job_role in ('founder','agency_ops_lead','analyst')
      or (reader.job_role = 'team_lead' and reader.team_id is not null and reader.team_id = writer.team_id)
      or (reader.job_role = 'writer' and c.writer_id = auth.uid())
      or (reader.job_role = 'uploader' and c.status in (
        'ready_to_upload','scheduled','uploaded','live','removed',
        'replacement_ready','reuploaded','verified_live'
      ))
    )
  );
$$;

create or replace function public.create_content_item(
  p_organization_id uuid,
  p_client_name text,
  p_campaign_name text,
  p_kind public.content_kind,
  p_title text,
  p_body text,
  p_due_at timestamptz,
  p_writer_id uuid default null,
  p_subreddit text default null
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_member public.memberships%rowtype;
  v_client_id uuid;
  v_campaign_id uuid;
  v_content_id uuid;
  v_writer_id uuid;
begin
  select * into v_member from public.memberships
    where organization_id = p_organization_id and user_id = auth.uid() and status = 'active';

  if v_member.id is null or v_member.access_level = 'viewer'
    or v_member.job_role not in ('founder','agency_ops_lead','team_lead','writer') then
    raise exception 'Content creation permission denied';
  end if;

  if char_length(trim(p_client_name)) < 2 or char_length(trim(p_campaign_name)) < 2
    or char_length(trim(p_title)) < 2 then
    raise exception 'Client, campaign and title are required';
  end if;

  insert into public.clients (organization_id, name, owner_id)
  values (p_organization_id, trim(p_client_name), auth.uid())
  on conflict (organization_id, name) do update set updated_at = now()
  returning id into v_client_id;

  insert into public.campaigns (organization_id, client_id, name, deadline_at)
  values (p_organization_id, v_client_id, trim(p_campaign_name), p_due_at)
  on conflict (client_id, name) do update set deadline_at = coalesce(excluded.deadline_at, public.campaigns.deadline_at)
  returning id into v_campaign_id;

  v_writer_id := case when v_member.job_role = 'writer' then auth.uid() else coalesce(p_writer_id, auth.uid()) end;

  if not exists (
    select 1 from public.memberships
    where organization_id = p_organization_id and user_id = v_writer_id and status = 'active'
      and job_role in ('writer','team_lead','agency_ops_lead','founder')
  ) then raise exception 'Assigned writer is outside this workspace or role'; end if;

  insert into public.content_items (
    organization_id, client_id, campaign_id, kind, title, body, subreddit,
    writer_id, status, due_at, created_by
  ) values (
    p_organization_id, v_client_id, v_campaign_id, p_kind, trim(p_title), p_body,
    nullif(trim(p_subreddit), ''), v_writer_id, 'assigned', p_due_at, auth.uid()
  ) returning id into v_content_id;

  insert into public.content_events (organization_id, content_id, actor_id, event_type, to_status)
  values (p_organization_id, v_content_id, auth.uid(), 'content.created', 'assigned');

  if p_due_at is not null then
    insert into public.reminders (organization_id, content_id, recipient_id, remind_at)
    values (p_organization_id, v_content_id, v_writer_id, greatest(now(), p_due_at - interval '24 hours'));
  end if;

  return v_content_id;
end;
$$;

create or replace function public.transition_content(
  p_content_id uuid,
  p_to public.content_status,
  p_expected_version integer,
  p_reason text default null,
  p_reddit_url text default null,
  p_idempotency_key text default null
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_item public.content_items%rowtype;
  v_member public.memberships%rowtype;
  v_allowed boolean := false;
  v_replacement_id uuid;
  v_from_status public.content_status;
begin
  if p_idempotency_key is not null and exists (
    select 1 from public.content_events where organization_id in (
      select organization_id from public.memberships where user_id = auth.uid() and status = 'active'
    ) and idempotency_key = p_idempotency_key
  ) then
    select * into v_item from public.content_items where id = p_content_id;
    return jsonb_build_object('id', v_item.id, 'status', v_item.status, 'version', v_item.version, 'replayed', true);
  end if;

  select * into v_item from public.content_items where id = p_content_id for update;
  if v_item.id is null then raise exception 'Content item not found'; end if;

  select * into v_member from public.memberships
    where organization_id = v_item.organization_id and user_id = auth.uid() and status = 'active';
  if v_member.id is null or v_member.access_level = 'viewer' then raise exception 'Transition permission denied'; end if;
  if v_item.version <> p_expected_version then raise exception 'Content changed; refresh before retrying'; end if;

  v_allowed := case v_item.status
    when 'backlog' then p_to = 'assigned'
    when 'assigned' then p_to = 'writing'
    when 'writing' then p_to = 'ready_for_review'
    when 'ready_for_review' then p_to in ('revision_required','ready_to_upload')
    when 'revision_required' then p_to = 'writing'
    when 'approved' then p_to = 'ready_to_upload'
    when 'ready_to_upload' then p_to in ('scheduled','uploaded')
    when 'scheduled' then p_to = 'uploaded'
    when 'uploaded' then p_to in ('live','removed')
    when 'live' then p_to in ('removed','archived')
    when 'removed' then p_to in ('replacement_required','archived')
    when 'replacement_required' then p_to = 'replacement_writing'
    when 'replacement_writing' then p_to = 'replacement_ready'
    when 'replacement_ready' then p_to = 'reuploaded'
    when 'reuploaded' then p_to in ('verified_live','removed')
    when 'verified_live' then p_to in ('removed','archived')
    else false
  end;

  if not v_allowed then raise exception 'Invalid content transition'; end if;

  if v_member.job_role = 'writer' and not (
    v_item.writer_id = auth.uid() and (
      (v_item.status in ('assigned','revision_required','replacement_required') and p_to in ('writing','replacement_writing'))
      or (v_item.status in ('writing','replacement_writing') and p_to in ('ready_for_review','replacement_ready'))
    )
  ) then raise exception 'Writer transition permission denied';
  elsif v_member.job_role = 'uploader' and not (
    (v_item.status in ('ready_to_upload','scheduled') and p_to = 'uploaded')
    or (v_item.status = 'replacement_ready' and p_to = 'reuploaded')
    or (v_item.status in ('uploaded','reuploaded') and p_to in ('live','verified_live','removed'))
    or (v_item.status in ('live','verified_live') and p_to = 'removed')
  ) then raise exception 'Upload transition permission denied';
  elsif v_member.job_role = 'team_lead' and v_item.status not in ('ready_for_review','revision_required','writing','replacement_writing') then
    raise exception 'Team lead transition permission denied';
  elsif v_member.job_role not in ('founder','agency_ops_lead','team_lead','writer','uploader') then
    raise exception 'Transition permission denied';
  end if;

  if p_to in ('uploaded','reuploaded') and coalesce(nullif(trim(p_reddit_url),''), v_item.reddit_url) is null then
    raise exception 'A Reddit URL is required';
  end if;
  if p_to = 'revision_required' and nullif(trim(p_reason),'') is null then
    raise exception 'Revision reason is required';
  end if;

  v_from_status := v_item.status;

  update public.content_items set
    status = p_to,
    reddit_url = case when p_to in ('uploaded','reuploaded') then coalesce(nullif(trim(p_reddit_url),''), reddit_url) else reddit_url end,
    revision_reason = case when p_to = 'revision_required' then trim(p_reason) when p_to in ('writing','ready_for_review','ready_to_upload') then null else revision_reason end,
    uploader_id = case when p_to in ('uploaded','reuploaded') then auth.uid() else uploader_id end,
    monitor_state = case when p_to in ('live','verified_live') then 'live' when p_to = 'removed' then 'removed' else monitor_state end,
    monitor_checked_at = case when p_to in ('live','verified_live','removed') then now() else monitor_checked_at end,
    version = version + 1
  where id = v_item.id
  returning * into v_item;

  insert into public.content_events (
    organization_id, content_id, actor_id, event_type, from_status, to_status, reason, idempotency_key
  ) values (
    v_item.organization_id, v_item.id, auth.uid(), 'content.transitioned', v_from_status, p_to, nullif(trim(p_reason),''), p_idempotency_key
  );

  if p_to = 'ready_to_upload' then
    insert into public.notifications (organization_id, recipient_id, content_id, type, title, body)
    select v_item.organization_id, m.user_id, v_item.id, 'upload.ready', 'Content ready to upload', v_item.title
    from public.memberships m
    where m.organization_id = v_item.organization_id and m.status = 'active' and m.job_role in ('uploader','agency_ops_lead');
  elsif p_to in ('uploaded','live','verified_live') and v_item.writer_id is not null then
    insert into public.notifications (organization_id, recipient_id, content_id, type, title, body)
    values (v_item.organization_id, v_item.writer_id, v_item.id, 'delivery.synced', 'Delivery status updated', v_item.title || ' is now ' || p_to::text);
  elsif p_to = 'removed' then
    insert into public.content_items (
      organization_id, client_id, campaign_id, kind, title, body, subreddit, writer_id,
      status, priority, due_at, original_content_id, revision_reason, created_by
    ) values (
      v_item.organization_id, v_item.client_id, v_item.campaign_id, v_item.kind,
      'Replacement · ' || v_item.title, v_item.body, v_item.subreddit, v_item.writer_id,
      'replacement_required', 'urgent', now() + interval '24 hours', v_item.id,
      coalesce(nullif(trim(p_reason),''), 'Original Reddit content was removed'), auth.uid()
    )
    on conflict (original_content_id) do update set updated_at = now()
    returning id into v_replacement_id;

    if v_item.writer_id is not null then
      insert into public.notifications (organization_id, recipient_id, content_id, type, title, body)
      values (v_item.organization_id, v_item.writer_id, v_replacement_id, 'replacement.required', 'Replacement required', v_item.title);
    end if;
  end if;

  return jsonb_build_object('id', v_item.id, 'status', v_item.status, 'version', v_item.version, 'replacement_id', v_replacement_id);
end;
$$;

alter table public.clients enable row level security;
alter table public.campaigns enable row level security;
alter table public.content_items enable row level security;
alter table public.content_events enable row level security;
alter table public.monitor_events enable row level security;
alter table public.reminders enable row level security;
alter table public.notifications enable row level security;

create policy clients_read on public.clients for select using (public.can_read_delivery(organization_id));
create policy clients_manage on public.clients for all using (public.can_manage_members(organization_id)) with check (public.can_manage_members(organization_id));
create policy campaigns_read on public.campaigns for select using (public.can_read_delivery(organization_id));
create policy campaigns_manage on public.campaigns for all using (public.can_manage_members(organization_id)) with check (public.can_manage_members(organization_id));
create policy content_read on public.content_items for select using (public.can_read_content_item(id));
create policy content_events_read on public.content_events for select using (public.can_read_content_item(content_id));
create policy monitor_events_read on public.monitor_events for select using (public.can_read_content_item(content_id));
create policy reminders_read on public.reminders for select using (recipient_id = auth.uid() or public.can_read_team_activity(organization_id));
create policy notifications_read on public.notifications for select using (recipient_id = auth.uid());
create policy notifications_update on public.notifications for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

revoke all on function public.create_content_item(uuid,text,text,public.content_kind,text,text,timestamptz,uuid,text) from public;
revoke all on function public.transition_content(uuid,public.content_status,integer,text,text,text) from public;
grant execute on function public.create_content_item(uuid,text,text,public.content_kind,text,text,timestamptz,uuid,text) to authenticated;
grant execute on function public.transition_content(uuid,public.content_status,integer,text,text,text) to authenticated;

commit;
