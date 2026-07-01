# Migration Execution Order

Sprint: Sprint 3 Dry Run Migration

## Sprint 3 Dry-Run Order

1. Confirm project refs:
   - Source: `exnxwhqolekycrblqchp`
   - Target: `ozgeatgwgnpcfnzjhqit`
2. Run source inventory as read-only:
   - `migration/dry-run/01_source_readonly_inventory.sql`
3. Save source output to secure local staging outside Git:
   - schema summary
   - table row counts
   - column metadata
   - indexes
   - constraints
   - foreign keys
   - entity counts
   - JSON key/type inventory
   - storage bucket and object inventory
4. Run target schema snapshot as read-only:
   - `migration/dry-run/02_target_schema_snapshot.sql`
5. Save target output to secure local staging outside Git:
   - schema summary
   - table row counts
   - column metadata
   - indexes
   - constraints
   - foreign keys
   - RLS/policies
   - storage buckets and object counts
6. Export source records into secure local staging outside Git.
7. Review exported JSON/CSV manually for:
   - secrets
   - PII handling
   - sample rows
   - duplicate identifiers
   - invalid numeric/date fields
   - files or URLs requiring storage migration
8. Confirm V2 Auth users required for staff import:
   - see `docs/AUTH_MIGRATION_PLAN.md`
9. Load reviewed export into target staging in a non-production dry-run session only:
   - `migration_staging.old_hopex_app_records`
10. Run target dry-run transform script:
   - `migration/dry-run/03_transform_dry_run_rollback.sql`
11. Run validation checklist SQL:
   - `migration/dry-run/04_dry_run_validation.sql`
12. Review rejects, duplicates, row-count comparisons, and target collisions.
13. Produce Sprint 3 dry-run sign-off report.

## Sprint 4 Production Migration Order

Production migration must not start until Sprint 3 is approved.

1. Freeze old production write activity or schedule maintenance window.
2. Back up old source and new target metadata.
3. Export source data read-only.
4. Export source storage object inventory.
5. Create target migration batch id.
6. Confirm V2 Auth users and role mapping.
7. Import reference data:
   - customers
   - staff metadata after V2 Auth users exist
   - chart/accounting reference mappings
   - bank accounts after duplicate review
8. Import operational records:
   - shipments
   - shipment items
   - shipment tracking/status logs
   - quote requests/quotes
   - invoices
9. Import financial records:
   - payments
   - expenses
   - journal entries
   - journal entry lines
10. Import optional history only if approved:
   - activity logs
   - notifications
   - tasks
   - WhatsApp logs
11. Copy approved files from old `uploads` bucket to target buckets.
12. Run validation.
13. Run application smoke tests on preview URL.
14. Request sign-off.

## Do Not Run Yet

- Final production import.
- Storage copy into target production buckets.
- Domain connection.
- Any delete/update against old production.
- Any password/hash migration.
