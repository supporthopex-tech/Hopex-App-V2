# Sprint 3 Migration Risk Report

Date: 2026-07-01
Scope: Dry-run planning only. No migration executed.

## Risk Summary

| Risk | Level | Evidence | Mitigation |
| --- | --- | --- | --- |
| Accidental write to old production database | Critical | Old source is live production project `exnxwhqolekycrblqchp`. | Source scripts use `begin read only`; use separate source/target commands; never run target scripts against source. |
| Running final migration during Sprint 3 | Critical | Sprint 3 is approved for dry run only. | Target dry-run transform ends with `rollback`; production import scripts are out of scope. |
| JSON-to-relational mismatch | High | Old business data lives in `app_records.data`; target has 83 normalized tables. | Use staging, source ids, row-count comparisons, reject tables, and human review before Sprint 4. |
| Incomplete schema comparison | High | Source has generic JSON; target has constraints/FKs/indexes that can reject data. | `01_source_readonly_inventory.sql` and `02_target_schema_snapshot.sql` now emit columns, indexes, constraints, FKs, policies, and row counts. |
| Staff/auth mismatch | High | Old has auth users/profiles and staff JSON records; target staff tables are empty. | Create/invite V2 Auth users first, match by email, never migrate passwords. See `docs/AUTH_MIGRATION_PLAN.md`. |
| Admin over-permissioning | High | Old roles/modules may not match V2 permission keys. | Map to least privilege; require owner approval for administrator access and custom permissions. |
| Activity log linkage loss | High | Old `ActivityLog` uses mixed `entity_id`, tracking/id references, and free text. | Build link maps by old id and tracking number; reject/archive unlinked rows. |
| Accounting imbalance | High | Old journals contain JSON `lines`, `total_debit`, `total_credit`, `is_balanced`. | Reject unbalanced journals; resolve account codes before import. |
| Invoice/payment semantic mismatch | High | Old invoice records may encode paid/partial states in status fields. | Create payments only after paid semantics are verified by sample review. |
| Duplicate customers | Medium | Customers may lack email or use phone/name only. | Normalize email/phone; report duplicates; preserve old-id mapping. |
| Duplicate shipments | Medium | Target uniqueness depends on `company_id, tracking_number`. | Prefer tracking number; reject missing/duplicate tracking numbers. |
| Currency mismatch | Medium | Old keys include USD revenue fields while target seed currency is TZS. | Preserve source currency; no FX conversion without approval. |
| File migration path mismatch | Medium | Old has one public `uploads` bucket; target has purpose-built buckets. | Capture object inventory; classify files by entity; copy only approved objects. |
| PII exposure in storage/staff docs | Medium | Staff/profile files may contain personal information. | Do not copy staff documents without explicit approval and bucket-level review. |
| Sample data contamination | Medium | Old records may include `is_sample`. | Flag sample rows during dry run; require owner decision. |
| Historical notifications/noise | Low | Old notifications/presence records are operationally stale. | Default notifications/tasks/WhatsApp logs to archive-only unless approved. |

## Critical Controls

- Every source script starts with `begin read only;`.
- Every target dry-run transform script ends with `rollback;`.
- No final production import runs in Sprint 3.
- No destructive SQL is allowed without explicit approval and rollback plan.
- No source credentials, exported data, passwords, or provider secrets may be committed.
- Every imported Sprint 4 row must have a migration batch id and source old id.

## Blockers Before Sprint 4

1. V2 Auth users are not yet confirmed for staff migration.
2. Object-level source storage inventory has not yet been captured.
3. Representative JSON payload samples have not yet been reviewed.
4. Optional history policy is not finalized for `ActivityLog`, `Notification`, `Task`, `UserPresence`, and `WhatsAppLog`.
5. Currency treatment for USD/TZS fields is not approved.
6. Dry-run output has not yet been executed and reviewed.

## Required Decisions Before Sprint 4

1. Confirm whether `ActivityLog` becomes audit history, shipment tracking history, or archive-only.
2. Confirm whether `Notification`, `UserPresence`, `Task`, and `WhatsAppLog` should migrate.
3. Confirm target auth users and admin/staff role mapping.
4. Confirm file migration scope and whether old `uploads` objects are required.
5. Confirm currency treatment for USD/TZS fields.
6. Confirm sample records policy for rows where `is_sample = true`.
7. Confirm production migration window and old-app write freeze procedure.
