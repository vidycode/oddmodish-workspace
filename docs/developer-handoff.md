# Developer handoff

## Outcome of the auth and accountability slice

This stacked pull request adds deployable Supabase SSR authentication, one-time Owner bootstrap, email invitations, scoped navigation, RLS-protected workspace tables, persistent timers, presence and an audit history. Demo data remains synthetic.

## Bring-up sequence

1. Create a Supabase project and run `supabase/migrations/202609120001_access_and_accountability.sql` once.
2. In Supabase Auth, create the initial user or enable the desired email sign-in path. Do not create any workspace row manually.
3. Configure the four environment variables in `.env.example` locally and in Netlify. The service-role key is server-only.
4. Add `https://YOUR_APP/auth/callback` and the local equivalent to Supabase Auth redirect URLs.
5. Sign in at `/sign-in`. The authenticated user is sent to `/bootstrap`; the first successful bootstrap becomes workspace Owner and seeds Operations, Writing, Upload and Sales teams plus their dashboard scopes.
6. From `/team`, invite each person by email with access level, job role and team. The acceptance callback claims the pending invitation before asking the person to set a password.
7. Verify at least one Owner remains before adding membership update/delete UI.

The app must never expose `SUPABASE_SERVICE_ROLE_KEY` to client components. Permission checks in React are navigation affordances only; authorization remains in RLS and security-definer functions.

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
- Viewer accounts cannot mutate records or start timers.
- Ops Editors may invite Editor/Viewer accounts but cannot grant Owner.
- Team activity is visible only to Owner, Founder, Ops Lead, Team Lead and Analyst scopes.
- Presence counts only visible, recently interacted-with in-app time; it does not capture input contents or activity outside the app.

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

## Definition of done for the next workflow PR

- Content lifecycle API/service and optimistic UI
- Writer and Upload role views backed by the same records
- Transactional outbox or equivalent reliable event publication
- Replacement idempotency test and audit timeline
- Preview deploy validated on desktop and mobile

## Integration boundaries

- Reddit URL monitoring must run as a scheduled/background worker, store HTTP/API evidence, retry with backoff and use `unknown` rather than `removed` when detection is inconclusive. A browser page is not a reliable monitor.
- Email invitation delivery uses Supabase Admin Auth from the server route only.
- Brainbase/agent tools should call permission-filtered domain services; agents never query raw tables with a service-role key.
- Rhythms should schedule operational briefs and reminder/escalation jobs after the canonical content workflow exists. They are orchestration, not the source of truth.
