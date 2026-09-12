import { NextResponse } from "next/server";
import { z } from "zod";
import type { ContentStatus } from "@/src/domain/model";
import { canTransitionContent, transitionRequirements } from "@/src/domain/content-transition";
import { getWorkspaceContext } from "@/src/lib/auth/context";
import { createClient } from "@/src/lib/supabase/server";

const statuses = [
  "backlog","assigned","writing","ready_for_review","revision_required","approved",
  "ready_to_upload","scheduled","uploaded","live","removed","replacement_required",
  "replacement_writing","replacement_ready","reuploaded","verified_live","archived",
] as const;

const schema = z.object({
  to: z.enum(statuses),
  expectedVersion: z.number().int().positive(),
  reason: z.string().trim().max(1000).nullable().optional(),
  redditUrl: z.url().startsWith("https://www.reddit.com/").nullable().optional(),
  idempotencyKey: z.string().trim().min(8).max(120),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getWorkspaceContext();
  if (!context) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid transition details" }, { status: 400 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid content ID" }, { status: 400 });

  const supabase = await createClient();
  const { data: item, error: readError } = await supabase.from("content_items")
    .select("id, status, version, writer_id, organization_id").eq("id", id).maybeSingle();
  if (readError || !item || item.organization_id !== context.organizationId) return NextResponse.json({ error: "Content not found" }, { status: 404 });

  const to = parsed.data.to as ContentStatus;
  if (!canTransitionContent({
    accessLevel: context.accessLevel,
    role: context.role,
    isAssignedWriter: item.writer_id === context.userId,
  }, item.status as ContentStatus, to)) return NextResponse.json({ error: "This role cannot perform that transition" }, { status: 403 });

  const requirements = transitionRequirements(to);
  if (requirements.requiresRedditUrl && !parsed.data.redditUrl) return NextResponse.json({ error: "Attach the exact Reddit URL first" }, { status: 400 });
  if (requirements.requiresReason && !parsed.data.reason) return NextResponse.json({ error: "Add a reason so the next team knows what happened" }, { status: 400 });

  const { data, error } = await supabase.rpc("transition_content", {
    p_content_id: id,
    p_to: to,
    p_expected_version: parsed.data.expectedVersion,
    p_reason: parsed.data.reason ?? null,
    p_reddit_url: parsed.data.redditUrl ?? null,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: error.message.includes("refresh") ? 409 : 400 });
  return NextResponse.json(data);
}
