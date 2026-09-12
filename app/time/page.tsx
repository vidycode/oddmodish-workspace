import { ActivityBeacon } from "@/src/components/activity-beacon";
import { TimeTracker } from "@/src/components/time-tracker";
import { hasPermission } from "@/src/domain/access";
import { requireWorkspaceContext } from "@/src/lib/auth/context";
import { createClient } from "@/src/lib/supabase/server";

interface TimeEntryRow { id: string; activity: string; started_at: string; ended_at: string | null; duration_minutes: number | null; profiles: { display_name: string | null; email: string } | null }

export default async function TimePage() {
  const context = await requireWorkspaceContext("time.track");
  const canReadTeam = hasPermission(context, "time.read_team");
  const supabase = await createClient();
  let query = supabase.from("time_entries").select("id, activity, started_at, ended_at, duration_minutes, profiles(display_name, email)").eq("organization_id", context.organizationId).order("started_at", { ascending: false }).limit(100);
  if (!canReadTeam) query = query.eq("user_id", context.userId);
  const { data } = await query;
  const entries = (data ?? []) as unknown as TimeEntryRow[];

  return <main className="managementShell">
    <ActivityBeacon organizationId={context.organizationId} />
    <header className="managementHeader"><div><p className="eyebrow">TIME & PRESENCE</p><h1>{canReadTeam ? "Team time" : "My time"}</h1><p>Track active work, start and end times, activity type, and completed duration.</p></div><TimeTracker organizationId={context.organizationId} canTrack /></header>
    <section className="managementPanel"><div className="historyHeader"><span>Person</span><span>Activity</span><span>Started</span><span>Ended / duration</span></div>{entries.length ? entries.map((entry) => <div className="historyRow" key={entry.id}><strong>{entry.profiles?.display_name ?? entry.profiles?.email ?? "Member"}</strong><span>{entry.activity}</span><time>{new Date(entry.started_at).toLocaleString("en-GB")}</time><span>{entry.ended_at ? `${new Date(entry.ended_at).toLocaleTimeString("en-GB")} · ${entry.duration_minutes ?? 0}m` : "● Active now"}</span></div>) : <p className="emptyState">No tracked sessions yet.</p>}</section>
  </main>;
}
