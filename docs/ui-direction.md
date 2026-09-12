# UI direction — build directly in code

Oddmodish OS does not depend on Figma. The production interface and reusable React components are the design source of truth.

## Product feeling

The interface should feel like a calm, intelligent operations cockpit: information-dense enough for daily agency work, but warm, legible and rewarding to use for hours. It must not look like a generic admin template or a literal ClickUp clone.

## Reference patterns

Use references as pattern research, never as visual copying:

| Reference | Learn from | Do not copy |
|---|---|---|
| [Linear](https://linear.app/) | Focus, hierarchy, keyboard navigation, restrained motion | Brand styling or issue-tracker terminology |
| [ClickUp](https://clickup.com/) | Workspace hierarchy, multiple views, workload, time and automation mental models | Visual clutter or every configuration option |
| [Attio](https://attio.com/) | Polished data tables, flexible objects and modern CRM interactions | Sales-first information architecture |
| [Notion](https://www.notion.com/) | Sharing, invitations and understandable access controls | Document-editor layout for operational queues |
| [Raycast](https://www.raycast.com/) | Command palette speed and crisp interaction feedback | Desktop-only interaction assumptions |

## Visual system

- Warm-light canvas: `#F7F6FA`
- Primary ink: `#17151F`
- Neutral dark navigation: `#211E29`
- Intelligent/action accent: `#6C4CF6`
- Healthy/success: `#2EBB91`
- Attention/deadline risk: `#E6A23C`
- Escalation/removal: `#E45D6B`
- Informational: `#4E8DF7`
- Default density: Compact, with Comfortable and Dense preferences later
- Typography: Geist or Inter fallback, tabular numerals for time and metrics
- Borders and shadows stay subtle; state color must carry meaning, not decoration

## Layout rules

1. Persistent left navigation for workspace scope and role-filtered destinations.
2. Sticky top bar for search, timer, quick add and AI entry.
3. Each screen starts with one clear purpose, primary action and no more than six top-level KPIs.
4. Tables are the primary operational surface; cards summarize or prioritize rather than duplicate the table.
5. A right-side drawer handles task/content detail without losing list context.
6. Critical status, deadline and replacement information must remain legible without relying on color alone.
7. Mobile supports review, approvals, status changes and urgent intervention; dense planning remains desktop-first.

## Interaction character

- Fast hover/focus states and 150–220 ms transitions.
- Skeletons for data loading; optimistic updates only when rollback is reliable.
- Visible save/sync state.
- Command palette and keyboard shortcuts for frequent actions.
- Small progress moments for completing a workflow, never distracting confetti.
- Empty states explain the next useful action.
- AI recommendations always show evidence and a preview before applying changes.

## Role-specific home surfaces

| Role | Default emphasis |
|---|---|
| Founder | Client health, revenue at risk, renewals, capacity and escalations |
| Agency Operations Lead | Attention queue, deadlines, replacements, workload, reports and active team |
| Content Writer | Assigned writing, revisions, replacements, due dates and uploaded/live feedback |
| Upload Team | Ready to upload, account recommendation, verification, removals and replacement queue |
| Sales | Pipeline, next action, follow-up SLA, conversion and onboarding handoff |
| Viewer / Client Guest | Permission-scoped read-only delivery and reporting |

The underlying records remain shared. Role surfaces are filtered views, not separate copies of work.

## Component-first implementation order

1. Tokens: color, typography, spacing, radius, elevation, motion and density.
2. Primitives: buttons, inputs, badges, avatars, tooltip, popover, dialog and toast.
3. Navigation: sidebar, top bar, breadcrumbs, command palette and responsive shell.
4. Data display: KPI card, table, filters, tabs, progress, health and capacity meters.
5. Domain components: content row, status transition, deadline indicator, replacement chain, account health and report readiness.
6. Overlays: task drawer, quick add, invitation/access modal and automation preview.
7. Screens: Control Tower, My Work, Writing, Upload/Live, Replacements, Clients, CRM, Reports and Founder.

## Quality bar

Before calling a screen complete:

- Responsive at 1440 px, 1024 px and 390 px.
- Keyboard operable with visible focus.
- WCAG AA contrast for text and critical controls.
- Loading, empty, error, success and permission-denied states included.
- No real client content or credentials in visual fixtures.
- No duplicated role-specific records.
- Screenshot or browser regression coverage for primary states.
- `npm run check` passes.
