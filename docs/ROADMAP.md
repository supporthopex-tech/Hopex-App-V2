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

Status: Complete

Completed:

- Sprint 3A planning and static validation approved.
- Sprint 3B read-only dry-run validation approved.
- Source and target metadata inspected in safe read-only mode.
- Mapping, schema, storage, auth, duplicate, nullable, enum/status, and FK validation reports produced.
- No production migration was executed.
- No old production writes were performed.
- No live domain was connected.

## Future Sprints

- Sprint 4: Production migration approval and execution.
- Sprint 5: UAT, bug fixing, and staff permission verification.
- Sprint 6: Preview deployment sign-off and domain cutover planning.
