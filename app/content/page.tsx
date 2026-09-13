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

const focusConfig = {
  all: { title: "Writing → Upload → Live", description: "One synchronized record for drafts, approvals, Reddit URLs, removals and linked replacements." },
  live: { title: "Live monitor", description: "Uploaded content, verification state, exact Reddit URLs and confirmed removals." },
  replacements: { title: "Replacement queue", description: "Removed originals and linked replacement work moving back from Writing to Upload." },
} as const;

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ focus?: string }> }) {
  const context = await requireWorkspaceContext("content.read");
  const requested = (await searchParams).focus;
  const focus: keyof typeof focusConfig = requested === "live" || requested === "replacements" ? requested : "all";
  const supabase = await createClient();
  const [{ data: contentData }, { data: writerData }] = await Promise.all([
    supabase.from("content_items").select(
      "id, kind, title, body, subreddit, status, priority, due_at, reddit_url, revision_reason, writer_id, original_content_id, version, clients(name), campaigns(name), writer:profiles!content_items_writer_id_fkey(display_name,email)"
    ).eq("organization_id", context.organizationId).order("due_at", { ascending: true, nullsFirst: false }).limit(200),
    supabase.from("memberships").select("user_id, profiles(display_name,email)")
      .eq("organization_id", context.organizationId).eq("status", "active")
      .in("job_role", ["writer","team_lead","agency_ops_lead"]),
  ]);

  const allItems = (contentData ?? []) as unknown as DeliveryRow[];
  const items = focus === "live"
    ? allItems.filter(item => ["ready_to_upload","scheduled","uploaded","live","removed","replacement_ready","reuploaded","verified_live"].includes(item.status))
    : focus === "replacements"
      ? allItems.filter(item => item.status.includes("replacement") || item.original_content_id)
      : allItems;
  const writers = ((writerData ?? []) as unknown as WriterMembership[]).map(row => ({
    id: row.user_id,
    label: row.profiles?.display_name ?? row.profiles?.email ?? "Writer",
  }));

  return <main className="managementShell wideManagement">
    <ActivityBeacon organizationId={context.organizationId} />
    <header className="managementHeader"><div><p className="eyebrow">CONTENT DELIVERY</p><h1>{focusConfig[focus].title}</h1><p>{focusConfig[focus].description}</p></div><div className="headerActions"><Link className="secondaryButton" href="/">Control Tower</Link><span className="accessPill">{context.role.replaceAll("_"," ")} · {context.accessLevel}</span></div></header>
    <nav className="viewTabs" aria-label="Delivery views"><Link className={focus === "all" ? "active" : ""} href="/content">All workflow</Link><Link className={focus === "live" ? "active" : ""} href="/content?focus=live">Upload & live</Link><Link className={focus === "replacements" ? "active" : ""} href="/content?focus=replacements">Replacements</Link></nav>
    <ContentWorkspace organizationId={context.organizationId} userId={context.userId} accessLevel={context.accessLevel} role={context.role} initialItems={items} writers={writers} showCreate={focus === "all"} />
  </main>;
}
