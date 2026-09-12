import { NextResponse } from "next/server";
import { z } from "zod";
import { getWorkspaceContext } from "@/src/lib/auth/context";
import { createClient } from "@/src/lib/supabase/server";

const schema = z.object({
  organizationId: z.uuid(),
  clientName: z.string().trim().min(2).max(120),
  campaignName: z.string().trim().min(2).max(160),
  kind: z.enum(["post", "comment"]),
  title: z.string().trim().min(2).max(240),
  body: z.string().max(20000).default(""),
  dueAt: z.iso.datetime().nullable(),
  writerId: z.uuid().nullable(),
  subreddit: z.string().trim().max(80).nullable(),
});

export async function POST(request: Request) {
  const context = await getWorkspaceContext();
  if (!context) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check client, campaign, title, writer and deadline fields" }, { status: 400 });
  if (parsed.data.organizationId !== context.organizationId) return NextResponse.json({ error: "Cross-workspace writes are not allowed" }, { status: 403 });

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_content_item", {
    p_organization_id: context.organizationId,
    p_client_name: parsed.data.clientName,
    p_campaign_name: parsed.data.campaignName,
    p_kind: parsed.data.kind,
    p_title: parsed.data.title,
    p_body: parsed.data.body,
    p_due_at: parsed.data.dueAt,
    p_writer_id: parsed.data.writerId,
    p_subreddit: parsed.data.subreddit,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data }, { status: 201 });
}
