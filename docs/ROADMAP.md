# Roadmap

## Sprint 1: Application Setup

Status: Complete

- GitHub connected.
- Vercel connected.
- Local environment configured.
- Local lint/build/runtime verified.
- Old production app untouched.

## Sprint 2: Database Preparation

Status: Complete

- Supabase schema prepared for Hopex App V2.
- RLS, roles, permissions, helper functions, triggers, indexes, and storage buckets verified.
- Minimum system seed added: Hopex company, system roles, permissions, settings.
- No production business data migrated.

## Sprint 3: Dry Run Migration

Status: Current

Goals:

- Export old Hopex data in read-only mode.
- Load sample/staged data into migration staging only.
- Run idempotent migration scripts against the new database.
- Validate counts, rejects, duplicate prevention, and rollback procedure.
- Produce a dry-run report before any production migration.

## Future Sprints

- Sprint 4: Production migration approval and execution.
- Sprint 5: UAT, bug fixing, and staff permission verification.
- Sprint 6: Preview deployment sign-off and domain cutover planning.
