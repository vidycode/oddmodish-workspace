import type { ContentStatus, Role } from "./model";

export interface DomainEvent<TPayload = Record<string, unknown>> {
  id: string;
  type: string;
  occurredAt: string;
  actorId: string;
  organizationId: string;
  resourceId: string;
  payload: TPayload;
}

export const allowedContentTransitions: Record<ContentStatus, readonly ContentStatus[]> = {
  backlog: ["assigned"],
  assigned: ["writing"],
  writing: ["ready_for_review"],
  ready_for_review: ["revision_required", "approved"],
  revision_required: ["writing"],
  approved: ["ready_to_upload"],
  ready_to_upload: ["scheduled", "uploaded"],
  scheduled: ["uploaded"],
  uploaded: ["live", "removed"],
  live: ["removed", "archived"],
  removed: ["replacement_required", "archived"],
  replacement_required: ["replacement_writing"],
  replacement_writing: ["replacement_ready"],
  replacement_ready: ["reuploaded"],
  reuploaded: ["verified_live", "removed"],
  verified_live: ["removed", "archived"],
  archived: [],
};

export const permissions: Record<Role, readonly string[]> = {
  founder: ["workspace:*"],
  agency_ops_lead: ["operations:*", "clients:*", "content:*", "reports:*", "time:read", "crm:read"],
  team_lead: ["team:manage", "content:manage", "reports:read", "time:read_team"],
  writer: ["content:read_assigned", "content:write_assigned", "time:write_self"],
  uploader: ["content:read_upload_queue", "content:update_delivery", "accounts:read", "time:write_self"],
  sales: ["crm:*", "clients:create", "time:write_self"],
  analyst: ["analytics:read", "reports:manage"],
  client_guest: ["client_portal:read_scoped"],
};

export const automationRecipes = [
  {
    id: "writer-handoff",
    when: "content.status_changed:ready_for_review",
    then: ["notify reviewer", "start review SLA"],
  },
  {
    id: "approval-to-upload",
    when: "content.status_changed:approved",
    then: ["set ready_to_upload", "assign upload team", "notify uploader"],
  },
  {
    id: "url-attached",
    when: "content.reddit_url_added",
    then: ["set uploaded", "notify writer", "start monitoring window"],
  },
  {
    id: "reddit-removed",
    when: "monitor.detected:removed",
    then: ["set removed", "create linked replacement", "notify writer and ops", "recalculate report readiness"],
  },
  {
    id: "replacement-ready",
    when: "replacement.status_changed:replacement_ready",
    then: ["add to upload queue", "preserve original relationship", "notify uploader"],
  },
  {
    id: "deadline-escalation",
    when: "deadline.threshold_crossed",
    then: ["recalculate urgency", "notify assignee", "escalate to ops lead when overdue"],
  },
] as const;
