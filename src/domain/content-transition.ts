import type { ContentStatus, Role } from "./model";

export interface TransitionActor {
  accessLevel: "owner" | "editor" | "viewer";
  role: Role;
  isAssignedWriter: boolean;
}

export const nextContentStatuses: Record<ContentStatus, readonly ContentStatus[]> = {
  backlog: ["assigned"],
  assigned: ["writing"],
  writing: ["ready_for_review"],
  ready_for_review: ["revision_required", "ready_to_upload"],
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

const writerPairs = new Set([
  "assigned:writing",
  "writing:ready_for_review",
  "revision_required:writing",
  "replacement_required:replacement_writing",
  "replacement_writing:replacement_ready",
]);

const uploaderPairs = new Set([
  "ready_to_upload:scheduled",
  "ready_to_upload:uploaded",
  "scheduled:uploaded",
  "uploaded:live",
  "uploaded:removed",
  "live:removed",
 /be
  "replacement_ready:reuploaded",
  "reuploaded:verified_live",
  "reuploaded:removed",
  "verified_live:removed",
]);

const leadPairs = new Set([
  "writing:ready_for_review",
  "ready_for_review:revision_required",
  "ready_for_review:ready_to_upload",
  "revision_required:writing",
  "replacement_writing:replacement_ready",
]);

export function canTransitionContent(actor: TransitionActor, from: ContentStatus, to: ContentStatus): boolean {
  if (actor.accessLevel === "viewer" || !nextContentStatuses[from].includes(to)) return false;
  if (actor.accessLevel === "owner" || actor.role === "founder" || actor.role === "agency_ops_lead") return true;
  const pair = `${from}:${to}`;
  if (actor.role === "writer") return actor.isAssignedWriter && writerPairs.has(pair);
  if (actor.role === "uploader") return uploaderPairs.has(pair);
  if (actor.role === "team_lead") return leadPairs.has(pair);
  return false;
}

export function transitionRequirements(to: ContentStatus) {
  return {
    requiresRedditUrl: to === "uploaded" || to === "reuploaded",
    requiresReason: to === "revision_required" || to === "removed",
  };
}
