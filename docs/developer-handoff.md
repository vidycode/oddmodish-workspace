# Developer handoff

## Outcome for bootstrap v1

This pull request establishes a deployable UI shell, shared domain vocabulary, event/automation contracts, CI and Netlify configuration. Demo data is synthetic.

## First vertical slice

Build this end-to-end before the CRM, founder analytics or broad AI layer:

1. Writer creates or edits a post/comment and submits it.
2. Reviewer approves it; the system moves it to the upload queue and notifies Upload.
3. Uploader assigns a Reddit account, uploads, and attaches the exact URL.
4. Writer and Ops immediately see Uploaded/Live state from the same content record.
5. Monitor detects Removed; the system records evidence and creates one linked replacement.
6. Writer receives the replacement with original copy and reason; completion returns it to Upload.
7. Re-upload preserves the replacement chain and updates report readiness.

## Acceptance criteria

- One canonical content record; no writer/upload shadow tables.
- Every status change has actor, timestamp, old value and new value.
- Invalid transitions are rejected by the domain service.
- Automation handlers are idempotent; repeated removal events cannot create duplicate replacements.
- Role and client scope are enforced server-side with RLS tests.
- A timer has at most one open entry per person and survives refresh/device changes.
- Deadlines store UTC plus the relevant operational/client timezone.
- Notifications support resolve, snooze, delegate and escalation.
- Monitoring failures are distinguishable from confirmed removals.

## Route plan

| Route | Primary audience | Purpose |
|---|---|---|
| `/` | Ops Lead | Control Tower and intervention queue |
| `/my-work` | All team | Personal priorities and blockers |
| `/content` | Writer/Reviewer | Writing, review and approval |
| `/live` | Upload/Ops | Live verification and monitoring |
| `/replacements` | Writer/Upload/Ops | Replacement debt and linked history |
| `/clients` | Ops/Founder | Client health and delivery |
| `/crm` | Sales/Founder | Pipeline, next action and conversion |
| `/workload` | Ops/Lead | Effort-based capacity |
| `/time` | Team/Ops | Timer, entries and activity |
| `/reports` | Ops/Analyst | Readiness and report generation |
| `/ai` | Permission scoped | Briefs, risks and previewed actions |

## Environment and safety

Copy `.env.example` to `.env.local`. Store real secrets only in the local environment and Netlify environment settings. Reddit, Supabase and AI integrations must ship disabled until their credentials, scopes, rate limits and audit behavior are reviewed.

## Definition of done for the next PR

- Database migrations and seed fixtures
- Supabase Auth plus RLS policy tests
- Content lifecycle API/service and optimistic UI
- Writer and Upload role views backed by the same records
- Transactional outbox or equivalent reliable event publication
- Replacement idempotency test and audit timeline
- Preview deploy validated on desktop and mobile
