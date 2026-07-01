# Development Rules

## Non-Negotiable Rules

- Do not touch the old Hopex production app.
- Do not write to the old Hopex production database.
- Treat the old production database as read-only source only.
- Do not connect the live Hopex domain until preview testing is complete and approved.
- Do not run destructive actions without explicit approval and a rollback plan.
- Do not commit secrets.

## Database Rules

- New Supabase project is the only write target.
- Use idempotent migrations and scripts.
- Verify RLS on every exposed table.
- Prefer least-privilege policies and explicit grants.
- Production business data migration must run only after dry-run approval.

## Code Rules

- Preserve existing app architecture.
- Keep changes scoped to the sprint objective.
- Run lint and build after code changes.
- Document important decisions in `docs/DECISION_LOG.md` or ADR files.
