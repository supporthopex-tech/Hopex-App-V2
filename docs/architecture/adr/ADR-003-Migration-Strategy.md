# ADR-003: Migration Strategy

## Status

Accepted

## Context

Hopex is moving from the old live app into Hopex App V2. The old production system must remain available and safe during migration.

## Decision

Use staged, idempotent migration:

1. Export from old Hopex database in read-only mode.
2. Load reviewed source data into staging tables.
3. Transform into new Hopex V2 schema.
4. Log migrated records and rejects.
5. Validate counts before approval.
6. Run final production migration only after dry-run sign-off.

## Consequences

- No destructive source operations.
- Running scripts twice must not duplicate target rows.
- Dry-run report is required before final migration.
