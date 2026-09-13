begin;

-- Safe only for a brand-new Oddmodish project with no production data.
-- Removes only objects created by the Oddmodish migrations.
drop trigger if exists auth_user_profile on auth.users;

drop table if exists
  public.notifications,
  public.reminders,
  public.monitor_events,
  public.content_events,
  public.content_items,
  public.campaigns,
  public.clients,
  public.presence_sessions,
  public.time_entries,
  public.activity_events,
  public.resource_grants,
  public.dashboards,
  public.invitations,
  public.memberships,
  public.teams,
  public.profiles,
  public.organizations
cascade;

drop type if exists public.monitor_classification cascade;
drop type if exists public.content_status cascade;
drop type if exists public.content_kind cascade;
drop type if exists public.time_activity cascade;
drop type if exists public.resource_type cascade;
drop type if exists public.subject_type cascade;
drop type if exists public.dashboard_visibility cascade;
drop type if exists public.invitation_status cascade;
drop type if exists public.membership_status cascade;
drop type if exists public.job_role cascade;
drop type if exists public.access_level cascade;

drop function if exists public.can_read_content_item(uuid) cascade;
drop function if exists public.can_read_delivery(uuid) cascade;
drop function if exists public.list_active_presence(uuid) cascade;
drop function if exists public.heartbeat_presence(uuid, text, uuid, integer) cascade;
drop function if exists public.stop_work_session(uuid) cascade;
drop function if exists public.claim_pending_invitation() cascade;
drop function if exists public.bootstrap_workspace(text, text) cascade;
drop function if exists public.can_access_dashboard(uuid) cascade;
drop function if exists public.can_track_time(uuid) cascade;
drop function if exists public.can_read_member_activity(uuid, uuid) cascade;
drop function if exists public.can_read_team_activity(uuid) cascade;
drop function if exists public.can_manage_members(uuid) cascade;
drop function if exists public.is_org_owner(uuid) cascade;
drop function if exists public.is_org_member(uuid) cascade;
drop function if exists public.handle_new_auth_user() cascade;
drop function if exists public.record_audit_event() cascade;
drop function if exists public.touch_updated_at() cascade;

commit;
