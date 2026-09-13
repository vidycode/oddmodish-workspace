import { requireWorkspaceContext } from "@/src/lib/auth/context";
import { createClient } from "@/src/lib/supabase/server";
import { ActivityBeacon } from "@/src/components/activity-beacon";

export const dynamic = "force-dynamic";

interface EventRow { id: string; action: string; entity_type: string; created_at: string; profiles: { display_name: string | null; email: string } | null }
interface PresenceRow { id: string; current_path: string; last_seen_at: string; active_seconds: number; display_name: string | null; email: string }

export default async function ActivityPage() {
  const context = await requireWorkspaceContext("activity.read_team");
  const supabase = await createClient();
  const [{ data: eventData }, { data: presenceData }] = await Promise.all([
    supabase.from("activity_events").select("id, action, entity_type, created_at, profiles(display_name, email)").eq("organization_id", context.organizationId).order("created_at", { ascending: false }).limit(100),
    supabase.rpc("list_active_presence", { p_organization_id: context.organizationId }),
  ]);
  const events = (eventData ?? []) as unknown as EventRow[];
  const presence = (presenceData ?? []) as unknown as PresenceRow[];

  return <main className="managementShell"><ActivityBeacon organizationId={context.organizationId} /><header className="managementHeader"><div><p className="eyebrow">AUDIT & ACCOUNTABILITY</p><h1>Activity history</h1><p>Who changed what, where they worked, and when the event occurred.</p></div></header><section className="managementPanel"><h2>Active now</h2><div className="presenceGrid">{presence.length ? presence.map((row) => <article key={row.id}><span className="online">●</span><div><strong>{row.display_name ?? row.email}</strong><small>{row.current_path} · {Math.round(row.active_seconds / 60)} active min</small></div><time>{new Date(row.last_seen_at).toLocaleTimeString("en-GB")}</time></article>) : <p className="emptyState">No one was active in the last two minutes.</p>}</div></section><section className="managementPanel activityLog"><div className="historyHeader"><span>Time</span><span>Actor</span><span>Action</span><span>Object</span></div>{events.length ? events.map((event) => <div className="historyRow" key={event.id}><time>{new Date(event.created_at).toLocaleString("en-GB")}</time><strong>{event.profiles?.display_name ?? event.profiles?.email ?? "System"}</strong><span>{event.action.replaceAll("_", " ")}</span><span>{event.entity_type}</span></div>) : <p className="emptyState">Activity will appear after members start using the configured workspace.</p>}</section><p className="securityNote">Tracking is transparent and limited to in-app page presence, data changes, and timer events. It never captures key contents, passwords, screenshots, clipboard data, or activity outside Oddmodish OS.</p></main>;
}
