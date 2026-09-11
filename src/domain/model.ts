export type Role =
  | "founder"
  | "agency_ops_lead"
  | "team_lead"
  | "writer"
  | "uploader"
  | "sales"
  | "analyst"
  | "client_guest";

export type ContentKind = "post" | "comment";
export type ContentStatus =
  | "backlog"
  | "assigned"
  | "writing"
  | "ready_for_review"
  | "revision_required"
  | "approved"
  | "ready_to_upload"
  | "scheduled"
  | "uploaded"
  | "live"
  | "removed"
  | "replacement_required"
  | "replacement_writing"
  | "replacement_ready"
  | "reuploaded"
  | "verified_live"
  | "archived";

export type HealthState = "healthy" | "watch" | "at_risk" | "critical";
export type Priority = "low" | "normal" | "high" | "urgent" | "critical";

export interface Client {
  id: string;
  name: string;
  ownerId: string;
  status: "lead" | "onboarding" | "active" | "paused" | "churned";
  timezone: string;
  priorityTier: "A" | "B" | "C";
  renewalDate?: string;
  reportCadence: "weekly" | "biweekly" | "monthly";
  health: HealthState;
}

export interface Campaign {
  id: string;
  clientId: string;
  name: string;
  startDate: string;
  deadline: string;
  targetPosts: number;
  targetComments: number;
  riskScore: number;
  reportReadiness: number;
}

export interface ContentItem {
  id: string;
  clientId: string;
  campaignId: string;
  kind: ContentKind;
  title: string;
  body: string;
  writerId?: string;
  uploaderId?: string;
  redditAccountId?: string;
  subreddit?: string;
  status: ContentStatus;
  priority: Priority;
  urgencyScore: number;
  dueAt: string;
  redditUrl?: string;
  originalContentId?: string;
  replacementContentId?: string;
  liveAt?: string;
  removedAt?: string;
  reportIncluded: boolean;
}

export interface RedditAccount {
  id: string;
  username: string;
  assignedUploaderId?: string;
  health: "healthy" | "watch" | "cooldown" | "restricted" | "suspended" | "retired";
  riskScore: number;
  removalRate30d: number;
  lastActivityAt?: string;
  cooldownUntil?: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  taskId: string;
  clientId?: string;
  activity: "writing" | "review" | "upload" | "monitoring" | "reporting" | "sales" | "operations";
  startedAt: string;
  endedAt?: string;
  durationMinutes?: number;
  billable: boolean;
}

export interface Reminder {
  id: string;
  resourceType: "task" | "content" | "client" | "campaign" | "report" | "renewal";
  resourceId: string;
  remindAt: string;
  recipientIds: string[];
  escalationPolicyId?: string;
  status: "scheduled" | "sent" | "snoozed" | "resolved";
}

export interface SalesOpportunity {
  id: string;
  company: string;
  ownerId: string;
  stage: "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
  value: number;
  currency: "USD" | "KRW" | "IDR";
  probability: number;
  nextAction: string;
  nextActionAt: string;
}
