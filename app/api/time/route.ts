import { NextResponse } from "next/server";
import { z } from "zod";
import { hasPermission } from "@/src/domain/access";
import { getWorkspaceContext } from "@/src/lib/auth/context";
import { createClient } from "@/src/lib/supabase/server";

const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), organizationId: z.uuid(), taskId: z.uuid().nullable().optional(), activity: z.enum(["writing", "review", "upload", "monitoring", "reporting", "sales", "operations"]) }),
  z.object({ action: z.literal("stop"), entryId: z.uuid() }),
]);

export async function POST(request: Request) {
  const context = await getWorkspaceContext();
  if (!context) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!hasPermission(context, "time.track")) return NextResponse.json({ error: "Viewer access cannot track time" }, { status: 403 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid timer request" }, { status: 400 });
  const supabase = await createClient();

  if (parsed.data.action === "start") {
    if (parsed.data.organizationId !== context.organizationId) return NextResponse.json({ error: "Cross-workspace timer rejected" }, { status: 403 });
    const { data, error } = await supabase.rpc("start_work_session", { p_organization_id: context.organizationId, p_task_id: parsed.data.taskId ?? null, p_activity: parsed.data.activity });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const result = data as { id: string; started_at: string };
    return NextResponse.json({ id: result.id, startedAt: result.started_at }, { status: 201 });
  }

  const { data, error } = await supabase.rpc("stop_work_session", { p_entry_id: parsed.data.entryId });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
