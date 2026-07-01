# Migration Prompt

```text
Prepare a Hopex App V2 migration step.

Rules:
- Old Hopex database is read-only source.
- New Hopex V2 Supabase is target.
- Do not migrate final production data unless explicitly approved.
- Scripts must be idempotent.
- Log migrated records and rejects.
- Validate counts and duplicates.
- Provide rollback notes.

Deliver:
- Source tables used
- Target tables affected
- Mapping notes
- Validation SQL
- Reject handling
- Dry-run result
```
