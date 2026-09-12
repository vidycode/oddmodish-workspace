"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AccessLevel } from "@/src/domain/access";
import type { ContentStatus, Role } from "@/src/domain/model";
import { canTransitionContent, nextContentStatuses, transitionRequirements } from "@/src/domain/content-transition";

export interface DeliveryRow {
  id: string;
  kind: "post" | "comment";
  title: string;
  body: string;
  subreddit: string | null;
  status: ContentStatus;
  priority: string;
  due_at: string | null;
  reddit_url: string | null;
  revision_reason: string | null;
  writer_id: string | null;
  original_content_id: string | null;
  version: number;
  clients: { name: string } | null;
  campaigns: { name: string } | null;
  writer: { display_name: string | null; email: string } | null;
}

interface Props {
  organizationId: string;
  userId: string;
  accessLevel: AccessLevel;
  role: Role;
  initialItems: DeliveryRow[];
  writers: readonly { id: string; label: string }[];
  showCreate?: boolean;
}

const labels: Partial<Record<ContentStatus, string>> = {
  writing: "Start writing",
  ready_for_review: "Submit for review",
  revision_required: "Request revision",
  ready_to_upload: "Approve → Upload",
  scheduled: "Schedule",
  uploaded: "Attach URL",
  live: "Verify live",
  removed: "Mark removed",
  replacement_writing: "Start replacement",
  replacement_ready: "Send replacement to Upload",
  reuploaded: "Attach replacement URL",
  verified_live: "Verify replacement",
  archived: "Archive",
};

export function ContentWorkspace({ organizationId, userId, accessLevel, role, initialItems, writers, showCreate = true }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const canCreate = accessLevel !== "viewer" && ["founder","agency_ops_lead","team_lead","writer"].includes(role);
  const grouped = useMemo(() => {
    const result = new Map<string, DeliveryRow[]>();
    for (const item of initialItems) {
      const key = item.status.includes("replacement") ? "Replacement" :
        ["ready_to_upload","scheduled","uploaded"].includes(item.status) ? "Upload" :
        ["live","verified_live","removed","reuploaded"].includes(item.status) ? "Live monitor" : "Writing & review";
      result.set(key, [...(result.get(key) ?? []), item]);
    }
    return result;
  }, [initialItems]);

  async function createItem(formData: FormData) {
    setMessage("Creating…");
    const dueRaw = String(formData.get("dueAt") ?? "");
    const response = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        clientName: formData.get("clientName"),
        campaignName: formData.get("campaignName"),
        kind: formData.get("kind"),
        title: formData.get("title"),
        body: formData.get("body"),
        dueAt: dueRaw ? new Date(dueRaw).toISOString() : null,
        writerId: formData.get("writerId") || null,
        subreddit: formData.get("subreddit") || null,
      }),
    });
    const result = await response.json();
    setMessage(response.ok ? "Content created and assigned." : result.error ?? "Could not create content");
    if (response.ok) router.refresh();
  }

  async function transition(item: DeliveryRow, to: ContentStatus) {
    const requirements = transitionRequirements(to);
    const redditUrl = requirements.requiresRedditUrl ? window.prompt("Paste the exact Reddit URL") : null;
    if (requirements.requiresRedditUrl && !redditUrl) return;
    const reason = requirements.requiresReason ? window.prompt(to === "removed" ? "Why was this classified as removed?" : "What should the writer revise?") : null;
    if (requirements.requiresReason && !reason) return;

    setPendingId(item.id);
    setMessage("");
    const response = await fetch(`/api/content/${item.id}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        expectedVersion: item.version,
        redditUrl,
        reason,
        idempotencyKey: `${item.id}:${item.version}:${to}`,
      }),
    });
    const result = await response.json();
    setPendingId(null);
    setMessage(response.ok ? `Updated to ${String(result.status).replaceAll("_"," ")}.` : result.error ?? "Update failed");
    if (response.ok) router.refresh();
  }

  return <div className="deliveryWorkspace">
    {canCreate && showCreate ? <section className="managementPanel">
      <div className="sectionHeading"><div><p className="eyebrow">QUICK CREATE</p><h2>Assign content</h2></div><small>One record stays synced across Writing, Upload and Monitoring.</small></div>
      <form action={createItem} className="contentCreateForm">
        <label>Client<input name="clientName" placeholder="Client name" required /></label>
        <label>Campaign<input name="campaignName" placeholder="September delivery" required /></label>
        <label>Type<select name="kind"><option value="post">Post</option><option value="comment">Comment</option></select></label>
        <label>Writer<select name="writerId" defaultValue={role === "writer" ? userId : writers[0]?.id}>{writers.map(writer => <option value={writer.id} key={writer.id}>{writer.label}</option>)}</select></label>
        <label className="span2">Title<input name="title" placeholder="Clear internal title" required /></label>
        <label>Subreddit<input name="subreddit" placeholder="r/example" /></label>
        <label>Deadline<input name="dueAt" type="datetime-local" /></label>
        <label className="spanAll">Writing<textarea name="body" rows={5} placeholder="Draft post or comment…" /></label>
        <button className="primary" type="submit">Create & assign</button>
      </form>
    </section> : null}

    {message ? <p className="formMessage" role="status">{message}</p> : null}

    {[...grouped.entries()].map(([group, items]) => <section className="managementPanel deliveryGroup" key={group}>
      <div className="sectionHeading"><h2>{group}</h2><span>{items.length} items</span></div>
      <div className="deliveryTable">
        {items.map(item => {
          const next = nextContentStatuses[item.status].filter(to => canTransitionContent({
            accessLevel, role, isAssignedWriter: item.writer_id === userId,
          }, item.status, to));
          return <article className="deliveryRow" key={item.id}>
            <div className="contentIdentity"><span className="kindBadge">{item.kind}</span><div><strong>{item.title}</strong><small>{item.clients?.name} · {item.campaigns?.name}{item.subreddit ? ` · ${item.subreddit}` : ""}</small></div></div>
            <div><span className={`statusPill status-${item.status}`}>{item.status.replaceAll("_"," ")}</span>{item.revision_reason ? <small className="revisionNote">{item.revision_reason}</small> : null}</div>
            <div className="deliveryMeta"><span>{item.writer?.display_name ?? item.writer?.email ?? "Unassigned"}</span><small>{item.due_at ? new Date(item.due_at).toLocaleString() : "No deadline"}</small></div>
            <div className="rowActions">{item.reddit_url ? <a href={item.reddit_url} target="_blank" rel="noreferrer">Reddit ↗</a> : null}{next.map(to => <button disabled={pendingId === item.id} onClick={() => transition(item,to)} key={to}>{labels[to] ?? to.replaceAll("_"," ")}</button>)}</div>
          </article>;
        })}
      </div>
    </section>)}
    {!initialItems.length ? <section className="managementPanel emptyDelivery"><h2>No content yet</h2><p>Create the first item above. Its status will stay synchronized for every permitted team view.</p></section> : null}
  </div>;
}
