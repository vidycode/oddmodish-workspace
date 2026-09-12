# Oddmodish OS

Internal agency operations workspace for Oddmodish, built around one auditable flow:

**Writer submission → review → upload queue → Reddit URL → live/removed monitoring → replacement → reporting and renewal.**

## Current foundation

- Next.js 16 App Router, React 19 and strict TypeScript
- Responsive Control Tower starter UI
- Shared domain contracts for content, clients, campaigns, Reddit accounts, time, reminders and CRM
- Explicit content state machine and initial automation recipes
- Role and permission vocabulary
- Supabase SSR sign-in, one-time Owner bootstrap and email invitations
- Owner/Editor/Viewer access layered with job role, team and resource scope
- Database-enforced RLS, audit events, transparent in-app presence and persistent timers
- GitHub Actions quality gate
- Netlify deployment configuration
- Architecture, phased implementation plan and developer handoff

## Design workflow

The production React components are the design source of truth; this project does not depend on Figma. Build the interface directly in code using the [UI direction and reference patterns](docs/ui-direction.md), then validate responsive, permission, loading, empty, error and keyboard states in the browser.

## Local development

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>.

## Quality gate

```bash
npm run check
```

This runs ESLint, TypeScript, domain tests and an optimized production build.

## Product references

- [UI direction](docs/ui-direction.md)
- [Architecture](docs/architecture.md)
- [Developer handoff](docs/developer-handoff.md)
- [Implementation plan](docs/implementation-plan.md)
- [Access and monitoring model](docs/security-access.md)

## Security

Never commit production credentials, client content or real Reddit account data. Configure secrets in `.env.local` and Netlify environment settings only.
