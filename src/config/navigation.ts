import type { MembershipAccess, Permission } from "@/src/domain/access";
import { hasPermission } from "@/src/domain/access";

export interface NavigationItem {
  label: string;
  href: string;
  icon: string;
  permission: Permission;
}

export const navigation: readonly NavigationItem[] = [
  { label: "Control Tower", href: "/", icon: "⌂", permission: "dashboard.read" },
  { label: "My Work", href: "/my-work", icon: "✓", permission: "content.read" },
  { label: "Clients", href: "/clients", icon: "◫", permission: "dashboard.read" },
  { label: "Campaigns", href: "/campaigns", icon: "◎", permission: "content.read" },
  { label: "Content Delivery", href: "/content", icon: "✎", permission: "content.read" },
  { label: "Live Monitor", href: "/live", icon: "◉", permission: "delivery.edit" },
  { label: "Replacements", href: "/replacements", icon: "↻", permission: "content.read" },
  { label: "Reports", href: "/reports", icon: "▤", permission: "reports.read" },
  { label: "Sales CRM", href: "/crm", icon: "◇", permission: "crm.read" },
  { label: "Workload", href: "/workload", icon: "▥", permission: "time.read_team" },
  { label: "Time", href: "/time", icon: "◷", permission: "time.track" },
  { label: "Activity", href: "/activity", icon: "◌", permission: "activity.read_team" },
  { label: "Team & Access", href: "/team", icon: "♙", permission: "members.invite" },
  { label: "AI Intelligence", href: "/ai", icon: "✦", permission: "dashboard.read" },
] as const;

export function navigationFor(member?: MembershipAccess): readonly NavigationItem[] {
  return member ? navigation.filter((item) => hasPermission(member, item.permission)) : navigation;
}

export const roleWorkspaces = [
  "Agency Operations Lead",
  "Founder",
  "Content Writer",
  "Upload Team",
  "Sales",
] as const;
