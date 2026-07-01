# Hopex Sprint 3 Dry-Run Migration Scripts

These scripts are for inspection, comparison, and dry-run planning only.

## Rules

- Do not run target scripts against the old source project.
- Do not run source scripts with write privileges.
- Do not commit exported production data.
- Do not execute final migration during Sprint 3.
- Keep source exports in a secure local staging folder outside Git.
- Do not migrate passwords, password hashes, provider secrets, or live-domain settings.

## Scripts

1. `01_source_readonly_inventory.sql`
   - Run on old source project only.
   - Uses `begin read only;`.
   - Returns schema counts, table counts, column metadata, indexes, constraints, foreign keys, RLS/policies, entity counts, JSON key/type inventory, duplicate candidates, storage buckets, storage objects, and auth/profile email inventory.

2. `02_target_schema_snapshot.sql`
   - Run on new target project only.
   - Uses `begin read only;`.
   - Returns target schema counts, row counts, column metadata, indexes, constraints, foreign keys, RLS/policies, business table baselines, bucket inventory, and object counts.

3. `03_transform_dry_run_rollback.sql`
   - Run on new target project only after manually loading reviewed source export into `migration_staging.old_hopex_app_records`.
   - Uses `begin;` and ends with `rollback;`.
   - Builds temporary normalized candidate tables, reports row-count comparisons, rejects, duplicates, target collisions, invoice line candidates, and journal line candidates.

4. `04_dry_run_validation.sql`
   - Run on new target project during dry-run review.
   - Uses `begin read only;`.
   - Produces validation counts for target baseline business rows, storage buckets, indexes, foreign keys, RLS, roles, permissions, and policy hardening.

## Sprint 3 Output

The expected result is a dry-run report, not migrated data.

Required report evidence:

- source schema inventory
- target schema inventory
- source-to-target row-count comparison
- reject summary
- duplicate summary
- target collision summary
- storage inventory
- auth/staff match summary
- Sprint 4 blocker list
