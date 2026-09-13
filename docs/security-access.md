# Access, accountability and monitoring

## Access model

Authorization is the intersection of four controls:

| Control | Purpose |
|---|---|
| Access level | Owner administers; Editor changes permitted work; Viewer is read-only |
| Job role | Founder, Ops, Writer, Upload, Sales, Analyst and Client Guest receive different capabilities |
| Team | Membership in Operations, Writing, Upload or Sales scopes team dashboards |
| Resource grant | Owner can explicitly grant a user or team Viewer/Editor access to one dashboard, client, campaign, report or document |

Hiding a sidebar item is not security. Every protected table uses Supabase Row Level Security, and privileged mutations use server routes plus the caller's session.

## Default dashboard scopes

| Dashboard | Default roles |
|---|---|
| Founder Overview | Founder |
| Agency Operations | Founder, Agency Operations Lead |
| Content Writing | Founder, Ops, Team Lead, Writer |
| Upload & Live Monitor | Founder, Ops, Team Lead, Uploader |
| Sales CRM | Founder, Ops, Sales |
| Client Reporting | Founder, Ops, Analyst, Client Guest |

Owner bypasses dashboard scope. Explicit grants can extend a specific resource without changing the person's global role.

Team Leads can read activity, presence and time for members of their own team only. Founder, Agency Operations Lead, Analyst and Owner scopes can read organization-wide operational activity.

## Accountability data

The system records business-relevant evidence:

- data mutation events with actor, time, entity and operation;
- timer start/stop and computed duration;
- current in-app route, last heartbeat and accumulated active seconds;
- invitation and access changes.

Presence heartbeats count a maximum of 30 seconds at a time and only when the page is visible and the member interacted within the last two minutes. The interface visibly states when presence is being shared.

The system does **not** record keystroke contents, passwords, clipboard data, screenshots, unrelated browser tabs, or activity outside Oddmodish OS. This boundary should remain visible in onboarding and employee policy.

## Operational safeguards

- Keep at least two trusted Owners after launch.
- Review pending invites and access grants weekly.
- Suspend access immediately during offboarding; do not delete audit history.
- Define retention periods with local employment/privacy counsel before production rollout.
- Rotate the Supabase service-role key if it is ever exposed and audit all admin-route usage.
