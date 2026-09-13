import { NextResponse } from "next/server";
import { z } from "zod";
import { canGrantAccess } from "@/src/domain/access";
import { getWorkspaceContext } from "@/src/lib/auth/context";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { createClient } from "@/src/lib/supabase/server";

const invitationSchema = z.object({
  organizationId: z.uuid(),
  email: z.email().transform((value) => value.toLowerCase()),
  accessLevel: z.enum(["owner", "editor", "viewer"]),
  jobRole: z.enum(["founder", "agency_ops_lead", "team_lead", "writer", "uploader", "sales", "analyst", "client_guest"]),
  teamId: z.uuid().nullable().optional(),
});

export async function POST(request: Request) {
  const context = await getWorkspaceContext();
  if (!context) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const parsed = invitationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the email, access level, and team role" }, { status: 400 });
  if (parsed.data.organizationId !== context.organizationId) return NextResponse.json({ error: "Cross-workspace invitations are not allowed" }, { status: 403 });
  if (!canGrantAccess(context, parsed.data.accessLevel)) return NextResponse.json({ error: "You cannot grant this access level" }, { status: 403 });

  const supabase = await createClient();
  if (parsed.data.teamId) {
    const { data: team } = await supabase.from("teams").select("id").eq("id", parsed.data.teamId).eq("organization_id", context.organizationId).maybeSingle();
    if (!team) return NextResponse.json({ error: "Selected team does not belong to this workspace" }, { status: 400 });
  }
  const { data: invitation, error: insertError } = await supabase.from("invitations").insert({
    organization_id: context.organizationId,
    email: parsed.data.email,
    access_level: parsed.data.accessLevel,
    job_role: parsed.data.jobRole,
    team_id: parsed.data.teamId ?? null,
    invited_by: context.userId,
  }).select("id, email").single();
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const admin = createAdminClient();
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    redirectTo: `${appUrl}/auth/callback?next=/set-password`,
    data: { invitation_id: invitation.id, organization_id: context.organizationId },
  });
  if (inviteError) {
    await supabase.from("invitations").update({ status: "failed" }).eq("id", invitation.id);
    return NextResponse.json({ error: inviteError.message }, { status: 400 });
  }
  return NextResponse.json({ id: invitation.id, email: invitation.email }, { status: 201 });
}
