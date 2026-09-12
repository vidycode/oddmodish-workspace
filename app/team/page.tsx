import { signOut } from "@/app/sign-in/actions";
import { ActivityBeacon } from "@/src/components/activity-beacon";
import { InviteMemberForm } from "@/src/components/invite-member-form";
import { hasPermission } from "@/src/domain/access";
import { requireWorkspaceContext } from "@/src/lib/auth/context";
import { createClient } from "@/src/lib/supabase/server";

export const dynamic = "force-dynamic";

interface Member { id: string; access_level: string; job_role: string; status: string; profiles: { display_name: string | null; email: string } | null }
interface Invitation { id: string; email: string; access_level: string; job_role: string; status: string }
interface Team { id: string; name: string }

export default async function TeamPage() {
  const context = await requireWorkspaceContext("members.invite");
  const supabase = await createClient();
  const [{ data: memberData }, { data: invitationData }, { data: teamData }] = await Promise.all([
    supabase.from("memberships").select("id, access_level, job_role, status, profiles(display_name, email)").eq("organization_id", context.organizationId).order("created_at"),
    supabase.from("invitations").select("id, email, access_level, job_role, status").eq("organization_id", context.organizationId).order("created_at", { ascending: false }).limit(20),
    supabase.from("teams").select("id, name").eq("organization_id", context.organizationId).order("name"),
  ]);
  const members = (memberData ?? []) as unknown as Member[];
  const invitations = (invitationData ?? []) as unknown as Invitation[];
  const teams = (teamData ?? []) as Team[];

  return <main className="managementShell">
    <ActivityBeacon organizationId={context.organizationId} />
    <header className="managementHeader"><div><p className="eyebrow">WORKSPACE ADMINISTRATION</p><h1>Team & access</h1><p>Invite people, assign job scope, and control whether they own, edit, or only view the workspace.</p></div><form action={signOut}><button className="secondaryButton">Sign out</button></form></header>
    <section className="accessExplainer"><article><strong>Owner</strong><p>Full workspace administration, access grants, and ownership transfer.</p></article><article><strong>Editor</strong><p>Can work inside the assigned job scope. Authorized Ops editors may invite non-owners.</p></article><article><strong>Viewer</strong><p>Read-only. Cannot change content, start timers, invite users, or run write automations.</p></article></section>
    <section className="managementPanel"><h2>Invite a member</h2><InviteMemberForm organizationId={context.organizationId} canInviteOwner={context.accessLevel === "owner"} teams={teams} /></section>
    <section className="managementGrid"><div className="managementPanel"><h2>Active members</h2>{members.length ? members.map((member) => <div className="directoryRow" key={member.id}><div className="memberAvatar">{(member.profiles?.display_name ?? member.profiles?.email ?? "M").slice(0,1).toUpperCase()}</div><div><strong>{member.profiles?.display_name ?? member.profiles?.email}</strong><small>{member.job_role.replaceAll("_", " ")}</small></div><span className="accessPill">{member.access_level}</span><i>{member.status}</i></div>) : <p className="emptyState">No visible members yet.</p>}</div><div className="managementPanel"><h2>Pending invitations</h2>{invitations.length ? invitations.map((invite) => <div className="directoryRow" key={invite.id}><div className="memberAvatar pending">✉</div><div><strong>{invite.email}</strong><small>{invite.job_role.replaceAll("_", " ")}</small></div><span className="accessPill">{invite.access_level}</span><i>{invite.status}</i></div>) : <p className="emptyState">No pending invitations.</p>}</div></section>
    <p className="securityNote">Dashboard visibility is filtered in the interface and enforced again by database RLS. {hasPermission(context,"members.manage") ? "You can manage membership access." : "You can invite editors/viewers but cannot transfer ownership."}</p>
  </main>;
}
