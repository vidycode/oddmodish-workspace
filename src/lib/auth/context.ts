import { redirect } from "next/navigation";
import type { AccessLevel, MembershipAccess, Permission } from "@/src/domain/access";
import { hasPermission } from "@/src/domain/access";
import type { Role } from "@/src/domain/model";
import { isSupabaseConfigured } from "@/src/lib/env";
import { createClient } from "@/src/lib/supabase/server";

export interface WorkspaceContext extends MembershipAccess {
  userId: string;
  email: string;
  membershipId: string;
  organizationId: string;
  organizationName: string;
  teamId: string | null;
}

interface MembershipRow {
  id: string;
  organization_id: string;
  access_level: AccessLevel;
  job_role: Role;
  team_id: string | null;
  organizations: { name: string } | { name: string }[] | null;
}

export interface AuthenticatedIdentity {
  userId: string;
  email: string;
}

export async function getAuthenticatedIdentity(): Promise<AuthenticatedIdentity | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) return null;
  return { userId, email: String(data.claims.email ?? "") };
}

export async function getWorkspaceContext(): Promise<WorkspaceContext | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return null;

  const { data, error } = await supabase
    .from("memberships")
    .select("id, organization_id, access_level, job_role, team_id, organizations(name)")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as unknown as MembershipRow;
  const organization = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
  return {
    userId,
    email: String(claimsData.claims.email ?? ""),
    membershipId: row.id,
    organizationId: row.organization_id,
    organizationName: organization?.name ?? "Oddmodish",
    teamId: row.team_id,
    accessLevel: row.access_level,
    role: row.job_role,
  };
}

export async function requireWorkspaceContext(permission?: Permission): Promise<WorkspaceContext> {
  if (!isSupabaseConfigured()) redirect("/setup");
  const context = await getWorkspaceContext();
  if (!context) {
    const identity = await getAuthenticatedIdentity();
    redirect(identity ? "/bootstrap" : "/sign-in");
  }
  if (permission && !hasPermission(context, permission)) redirect("/no-access");
  return context;
}
