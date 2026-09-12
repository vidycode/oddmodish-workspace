import Link from "next/link";
import { ActivityBeacon } from "@/src/components/activity-beacon";
import { ContentWorkspace, type DeliveryRow } from "@/src/components/content-workspace";
import { requireWorkspaceContext } from "@/src/lib/auth/context";
import { createClient } from "@/src/lib/supabase/server";

export const dynamic = "force-dynamic";

interface WriterMembership {
  user_id: string;
  profiles: { display_name: string | null; email: string } | null;
}

export default async function ContentPage() {
  const context = await requireWorkspaceContext("content.read");
  const supabase = await createClient();
  const [{ data: contentData }, { data: writerData }] = await Promise.all([
    supabase.from("content_items").select(
      "id, kind, title, body, subreddit, status, priority, due_at, reddit_url, revision_reason, writer_id, version, clients(name), campaigns(name), writer:profiles!content_items_writer_id_fkey(display_name,email)"
    ).eq("organization_id", context.organizationId).order("due_at", { ascending: true, nullsFirst: false }).limit(200),
    supabase.from("memberships").select("user_id, profiles(display_name,email)")
      .eq("organization_id", context.organizationId).eq("status", "active")
      .in("job_role", ["writer","team_lead","agency_ops_lead"]),
  ]);

  const items = (contentData ?? []) as unknown as DeliveryRow[];
  const writers = ((writerData ?? []) as unknown as WriterMembership[]).map(row => ({
    id: row.user_id,
    label: row.profiles?.display_name ?? row.profiles?.email ?? "Writer",
  }));

  return <main className="managementShell wideManagement">
    <ActivityBeacon organizationId={context.organizationId} />
    <header className="managementHeader"><div><p className="eyebrow">CONTENT DELIVERY</p><h1>Writing → Upload → Live</h1><p>One synchronized record for drafts, approvals, Reddit URLs, removals and linked replacements.</p></div><div className="headerActions"><Link className="secondaryButton" href="/">Control Tower</Link><span className="accessPill">{context.role.replaceAll("_"," ")} · {context.accessLevel}</span></div></header>
    <ContentWorkspace organizationId={context.organizationId} userId={context.userId} accessLevel={context.accessLevel} role={context.role} initialItems={items} writers={writers} />
  </main>;
}
