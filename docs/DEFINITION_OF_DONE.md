# Definition of Done

A sprint is done only when:

- Scope is implemented without touching old production systems.
- Required docs are updated.
- Lint and build pass when app code changes.
- Database changes are applied only to the new Supabase project.
- RLS, permissions, and REST access are verified for schema work.
- Migration work includes logs, validation, idempotency checks, and rollback notes.
- Known blockers are documented.
- No secrets are committed.

## Migration-Specific Done Criteria

- Source database access is read-only.
- Target writes are limited to the new Supabase project.
- Running migration scripts twice does not duplicate records.
- Rejects and ambiguous records are logged.
- Counts match accepted mapping rules.
- Final production migration is not run until dry-run report is approved.
