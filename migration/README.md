# Hopex App V2 Migration Scripts

These scripts are designed for a staged migration from the old live Hopex app into the new Naro-based Hopex App V2.

Rules:

- Never run target import scripts against the old Hopex production database.
- Never run source export scripts with write privileges beyond read-only selection.
- Export source data first, review it, then load into target staging tables.
- Import scripts are idempotent and should be safe to rerun.
- Validation scripts must pass before Vercel preview testing is considered complete.

Recommended order:

1. Run `scripts/01_old_hopex_readonly_export.sql` on the old source database.
2. Save each result set as JSON/CSV in a secure local staging folder outside Git.
3. Load reviewed source JSON into the target `migration_staging.old_hopex_app_records` table.
4. Run `scripts/02_new_hopex_idempotent_import.sql` on the new Hopex Supabase project.
5. Run `scripts/03_validate_new_hopex.sql`.
6. Review `migration_staging.migration_log` and any `migration_staging.migration_rejections`.
