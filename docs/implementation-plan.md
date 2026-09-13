# Implementation plan

## Phase 1 — Foundations

Authentication, organizations, memberships, RBAC/resource scope, schema migrations, activity log, application shell, observability and preview deployment.

## Phase 2 — Delivery spine

Content editor, review, approval, upload queue, URL attachment, lifecycle events, monitor evidence, removed classification, replacement chain and cross-role realtime sync.

## Phase 3 — Operations intelligence

Control Tower, urgency engine, workload/capacity, deadline reminders, escalation policies, time tracking and report readiness.

## Phase 4 — Business management

Client health, sales CRM, onboarding handoff, renewal pipeline, founder view and financial/effort signals.

## Phase 5 — Controlled AI and integrations

Brainbase agents use permission-scoped tools for summaries, risk detection, report drafts and proposed actions. Rhythms consumes approved KPI snapshots for operating cadence and goals. All write actions require a preview, permission check and audit record.

## Non-negotiable release gates

- No production client data in seeds or logs.
- No service-role key reaches the browser bundle.
- No background job changes lifecycle state without an audit event.
- No AI agent receives raw database access.
- No monitoring action attempts to circumvent Reddit enforcement.
- Restore, rollback and incident ownership are documented before production.
