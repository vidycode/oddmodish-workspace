import type { Role } from "./model";

export type AccessLevel = "owner" | "editor" | "viewer";
export type ResourceType = "dashboard" | "client" | "campaign" | "report" | "document";
export type Permission =
  | "workspace.manage"
  | "members.invite"
  | "members.manage"
  | "dashboard.read"
  | "dashboard.edit"
  | "content.read"
  | "content.edit"
  | "delivery.edit"
  | "crm.read"
  | "crm.edit"
  | "reports.read"
  | "reports.edit"
  | "time.track"
  | "time.read_team"
  | "activity.read_team";

const accessPermissions: Record<AccessLevel, readonly Permission[]> = {
  owner: [
    "workspace.manage", "members.invite", "members.manage", "dashboard.read", "dashboard.edit",
    "content.read", "content.edit", "delivery.edit", "crm.read", "crm.edit", "reports.read",
    "reports.edit", "time.track", "time.read_team", "activity.read_team",
  ],
  editor: ["dashboard.read", "dashboard.edit", "content.read", "time.track"],
  viewer: ["dashboard.read", "content.read", "reports.read"],
};

const rolePermissions: Partial<Record<Role, readonly Permission[]>> = {
  founder: ["dashboard.read", "crm.read", "reports.read", "time.read_team", "activity.read_team"],
  agency_ops_lead: ["members.invite", "dashboard.read", "dashboard.edit", "content.read", "content.edit", "delivery.edit", "reports.read", "reports.edit", "time.track", "time.read_team", "activity.read_team"],
  team_lead: ["dashboard.read", "content.read", "content.edit", "reports.read", "time.track", "time.read_team", "activity.read_team"],
  writer: ["dashboard.read", "content.read", "content.edit", "time.track"],
  uploader: ["dashboard.read", "content.read", "delivery.edit", "time.track"],
  sales: ["dashboard.read", "crm.read", "crm.edit", "time.track"],
  analyst: ["dashboard.read", "reports.read", "reports.edit", "activity.read_team"],
  client_guest: ["dashboard.read", "reports.read"],
};

export interface MembershipAccess {
  accessLevel: AccessLevel;
  role: Role;
}

export function hasPermission(member: MembershipAccess, permission: Permission): boolean {
  if (member.accessLevel === "owner") return true;
  return accessPermissions[member.accessLevel].includes(permission) ||
    (rolePermissions[member.role] ?? []).includes(permission);
}

export function canGrantAccess(actor: MembershipAccess, requested: AccessLevel): boolean {
  if (actor.accessLevel === "owner") return true;
  return actor.accessLevel === "editor" && hasPermission(actor, "members.invite") && requested !== "owner";
}

export function canMutate(accessLevel: AccessLevel): boolean {
  return accessLevel !== "viewer";
}
