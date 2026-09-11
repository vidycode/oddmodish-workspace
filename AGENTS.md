# Repository guidance

## Product invariant

Writer, reviewer, upload team, monitor, replacement and reporting operate on one canonical content lifecycle. Do not introduce parallel status fields or role-specific copies of the same work item.

## Engineering rules

- Keep TypeScript strict.
- Enforce permissions in server/domain code and database RLS, never UI alone.
- Emit an auditable domain event for meaningful state changes.
- Make automation and webhook handlers idempotent.
- Use UTC for storage and explicit timezones for display/deadline policies.
- Treat AI output as a proposal until a permissioned action is confirmed.
- Never commit credentials, client content or real Reddit account data.

## Validation

Run `npm run check` before requesting review.
