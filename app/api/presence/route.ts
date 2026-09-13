import { NextResponse } from "next/server";
import { z } from "zod";
import { getWorkspaceContext } from "@/src/lib/auth/context";
import { createClient } from "@/src/lib/supabase/server";

const heartbeatSchema = z.object({
  organizationId: z.uuid(),
  path: z.string().startsWith("/").max(200),
  sessionId: z.uuid().nullable(),
  activeSeconds: z.number().int().min(0).max(30),
});

export async function POST(request: Request) {
  const context = await getWorkspaceContext();
  if (!context) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const parsed = heartbeatSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid presence heartbeat" }, { status: 400 });
  if (parsed.data.organizationId !== context.organizationId) return NextResponse.json({ error: "Cross-workspace presence rejected" }, { status: 403 });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("heartbeat_presence", { p_organization_id: context.organizationId, p_path: parsed.data.path, p_session_id: parsed.data.sessionId, p_active_seconds: parsed.data.activeSeconds });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
