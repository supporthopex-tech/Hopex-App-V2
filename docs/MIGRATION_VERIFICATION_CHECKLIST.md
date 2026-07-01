# Migration Verification Checklist

Sprint: Sprint 3 Dry Run Migration

## Source Verification

- [ ] Source project ref confirmed as `exnxwhqolekycrblqchp`.
- [ ] Source access is read-only for export step.
- [ ] Source `public.app_records` count captured.
- [ ] Source `public.profiles` count captured.
- [ ] Source auth user count captured without password/hash export.
- [ ] Source entity counts captured.
- [ ] Source JSON key/type inventory captured.
- [ ] Source table-by-table schema captured.
- [ ] Source column-by-column schema captured.
- [ ] Source indexes captured.
- [ ] Source constraints captured.
- [ ] Source foreign keys captured.
- [ ] Source RLS/policies captured.
- [ ] Source storage bucket inventory captured.
- [ ] Source storage object inventory captured.
- [ ] No source INSERT/UPDATE/DELETE/DDL executed.

## Target Verification

- [ ] Target project ref confirmed as `ozgeatgwgnpcfnzjhqit`.
- [ ] Target company id confirmed as `6d19adf9-570f-46c3-8476-dfab624248b3`.
- [ ] Target business tables are empty before dry run.
- [ ] Target seeded company exists.
- [ ] Target roles and permissions exist.
- [ ] Target RLS remains enabled on all public tables.
- [ ] Target policies do not use `auth.role()`.
- [ ] Target table-by-table schema captured.
- [ ] Target column-by-column schema captured.
- [ ] Target indexes captured.
- [ ] Target constraints captured.
- [ ] Target foreign keys captured.
- [ ] Target storage buckets exist.
- [ ] Target storage object counts captured.
- [ ] Target auth users required for staff migration are identified.

## Dry-Run Transformation Verification

- [ ] Every transformed row has an old source id.
- [ ] Every target candidate row has `company_id = 6d19adf9-570f-46c3-8476-dfab624248b3`.
- [ ] Row-count comparison exists for every source entity and target table.
- [ ] Duplicate customers are reported, not silently merged without evidence.
- [ ] Duplicate shipment tracking numbers are reported.
- [ ] Duplicate invoice numbers are reported.
- [ ] Target collision checks are reported for shipments and invoices.
- [ ] Invalid dates and numerics are rejected or null-normalized with evidence.
- [ ] Staff rows without matching V2 auth user are rejected.
- [ ] Journal entries balance before import.
- [ ] Journal entry line counts are reported.
- [ ] Invoice line item counts are reported.
- [ ] Invoice totals match line item totals or are reported.
- [ ] Sample rows are flagged for owner decision.
- [ ] Optional history rows are classified as import, reject, or archive.
- [ ] The dry-run transaction ends with `rollback;`.

## Storage Verification

- [ ] Source `uploads` object list captured with path, size, MIME type, owner, timestamps.
- [ ] Source objects are classified by target bucket.
- [ ] Target bucket exists for every approved object class.
- [ ] Private files are not mapped to public buckets.
- [ ] Staff/profile documents are marked PII-sensitive.
- [ ] No storage copy has been performed in Sprint 3.

## Auth Verification

- [ ] Old auth users listed by email/id only.
- [ ] No old password hashes exported.
- [ ] V2 Auth users identified or invited.
- [ ] Staff records map by email to V2 Auth users.
- [ ] Admin privileges explicitly approved.
- [ ] Permission mapping reviewed for every staff member.

## Sprint 3 Acceptance Criteria

- [ ] Existing Sprint 3 artifacts are completed rather than restarted.
- [ ] Schema comparison covers tables, columns, indexes, constraints, and foreign keys.
- [ ] Row-count comparison covers source entities and target tables.
- [ ] Column-level migration mapping is documented.
- [ ] Storage inventory covers source and target buckets plus source object-level evidence plan.
- [ ] Auth migration plan exists.
- [ ] Dry-run scripts are read-only or rollback-only.
- [ ] Risks, blockers, and Sprint 4 readiness are documented.
- [ ] No production migration is performed.
- [ ] No writes are made to old production.
- [ ] No commit or push is performed.

## Application Verification After Approved Import

Do not run this section until Sprint 4.

- [ ] Login works with V2 users.
- [ ] Staff list shows expected users.
- [ ] Dashboard counts match imported business data.
- [ ] Customers open and search correctly.
- [ ] Shipments open and tracking page works.
- [ ] Quotes and invoices generate correct documents.
- [ ] Payments and expenses appear in accounting reports.
- [ ] Role permissions restrict modules correctly.
- [ ] Storage documents open from target buckets.
- [ ] Vercel preview passes smoke tests.

## Sign-Off

- [ ] Dry-run report approved.
- [ ] Rollback plan approved.
- [ ] Auth migration plan approved.
- [ ] Production migration window approved.
- [ ] Old production app remains untouched.
- [ ] Live domain remains disconnected.
